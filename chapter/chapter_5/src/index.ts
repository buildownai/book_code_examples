import { Hono } from 'hono'
import { createEmbeddings } from './create_embeddings.js'
import { getDb } from './db.js'

const app = new Hono()

const model = 'qwen2.5-coder:1.5b'

const siteHtml = `
<form action="/" method="post" autocomplete="off">
  <input type="text" name="prompt" a/>
  <button type="submit">Send</button>
</form>
`

app.get('/', (c) => {
	return c.html(siteHtml)
})

type Message = {
	role: 'system' | 'user' | 'assistant'
	content: string
}

type Chunk = {
	similarity: number
	text: string
	metadata: {
		file: string
		Header_1?: string
		Header_2?: string
		Header_3?: string
		Header_4?: string
	}
}

const groupChunksByFileHeadlineAndSubheadline = (chunks: Chunk[]): string => {
	const grouped: {
		[file: string]: { [headline: string]: { [subHeadline: string]: string[] } }
	} = {}

	// Group chunks by file, headline, and subheadline
	for (const chunk of chunks) {
		const file = chunk.metadata.file
		const headline = chunk.metadata.Header_1 || 'Miscellaneous'
		const subHeadline = chunk.metadata.Header_2 || 'Miscellaneous'

		if (!grouped[file]) {
			grouped[file] = {}
		}

		if (!grouped[file][headline]) {
			grouped[file][headline] = {}
		}

		if (!grouped[file][headline][subHeadline]) {
			grouped[file][headline][subHeadline] = []
		}

		grouped[file][headline][subHeadline].push(chunk.text)
	}

	// Reconstruct the text string in hierarchical order
	let result = ''

	for (const file of Object.keys(grouped)) {
		result += `File: ${file}\n`

		for (const headline of Object.keys(grouped[file])) {
			result += `\n# ${headline}\n`

			for (const subHeadline of Object.keys(grouped[file][headline])) {
				if (subHeadline !== 'Miscellaneous') {
					result += `\n## ${subHeadline}\n`
				}

				for (const text of grouped[file][headline][subHeadline]) {
					result += `${text}\n\n`
				}
			}
		}
	}

	return result
}

const messages: Message[] = [
	{
		role: 'system',
		content: `You are an AI assistant specialized to answer questions about the PURISTA typescript backend framework.
Use the provided context to extract the related information.
Your answer should only be based on the extracted information.
Do not refer to to the context in your answer.
If the context does not contain the required information to answer, tell the user that you can not provide a answer.
Answer short and precise. The word purista must be allways uppercased.`,
	},
]

app.post('/', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtml)
	}

	const db = await getDb()
	const embeddingRes = await createEmbeddings(prompt.toString(), 'search_query')

	const dbResult = await db.query<[Chunk[]]>(
		`SELECT
      id,
      similarity,
      text,
      metadata,
      vector::similarity::cosine(embedding, $embedding) as similarity
    FROM knowledge
    WHERE vector::similarity::cosine(embedding, $embedding) >= $scoreThreshold
    ORDER BY similarity desc
    LIMIT $maxResults;`,
		{
			embedding: embeddingRes.embeddings[0],
			scoreThreshold: 0.5,
			maxResults: 10,
		},
	)

	const chunks = dbResult[0] ?? []

	// Add the users prompt to the history before sending to the llm
	messages.push({
		role: 'user',
		content: `${prompt.toString()}
    
    ${groupChunksByFileHeadlineAndSubheadline(chunks)}
    `,
	})

	// Use endpoint chat instead of generate
	const res = await fetch('http://localhost:11434/api/chat', {
		method: 'post',
		body: JSON.stringify({
			model,
			messages,
			stream: false,
			options: {
				temperature: 0.1,
			},
		}),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	})

	if (!res.ok) {
		// Handle response error
		console.error(res.status, res.statusText)
		return c.html(siteHtml)
	}

	const content = await res.json()
	console.log(JSON.stringify(content, null, 2))

	// Add the ai response to the message history
	messages.push({
		role: 'assistant',
		content: content.message.content,
	})

	const messagesToList = (msg: Message) =>
		`<div><strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content.replaceAll('\n', '</br>')}</p></div>`

	return c.html(`${messages.map(messagesToList).join('')}
${siteHtml}
`)
})

export default app
