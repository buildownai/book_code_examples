import { Hono } from 'hono'
import OpenAI from 'openai'
import { apiKey, baseURL, model } from './config.js'
import { createEmbeddings } from './create_embeddings.js'
import { getDb } from './db.js'
import { getGraphContext } from './get_graph_context.js'
import type { Chunk, Message } from './types.js'

const app = new Hono()

const client = new OpenAI({
	baseURL,
	apiKey,
})

const messagesKnowledge: Message[] = [
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

const messagesQA: Message[] = [
	{
		role: 'system',
		content: `You are an AI assistant specialized to answer questions about the PURISTA typescript backend framework.
Answer the user based on the provided question-answer context.
Do not mention or relate to the provided context.
If the context does not contain the required information to answer, tell the user that you can not provide a answer.
Answer short and precise. The word purista must be allways uppercased.`,
	},
]

const messagesGraph: Message[] = [
	{
		role: 'system',
		content: `You are an AI assistant specialized to answer questions about the PURISTA typescript backend framework.
Answer the user based on the provided context.
The context contains question-answer pairs and related entities with description and information about entity relationships.
Do not mention or relate to the provided context.
If the context does not contain the required information to answer, tell the user that you can not provide a answer.
Answer short and precise. The word purista must be allways uppercased.`,
	},
]

const siteHtmlKnowledge = `
<form action="/knowledge" method="post" autocomplete="off">
  <input type="text" name="prompt" a/>
  <button type="submit">Send</button>
</form>
`

const siteHtmlQA = `
<form action="/qa" method="post" autocomplete="off">
  <input type="text" name="prompt" a/>
  <button type="submit">Send</button>
</form>
`

const siteHtmlGraph = `
<form action="/graph" method="post" autocomplete="off">
  <input type="text" name="prompt" a/>
  <button type="submit">Send</button>
</form>
`

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

app.get('/', (c) => {
	return c.html(`<frameset cols="33%,33%,33%">
   <frame name="knowledgebase" src="/knowledge" />
   <frame name="qa" src="/qa" />
   <frame name="graph" src="/graph" />
</frameset>`)
})

app.get('/knowledge', (c) => {
	return c.html(`<h3>Knowledge</h3>${siteHtmlKnowledge}`)
})

app.post('/knowledge', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtmlKnowledge)
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
	messagesKnowledge.push({
		role: 'user',
		content: `${prompt.toString()}
    
    ${groupChunksByFileHeadlineAndSubheadline(chunks)}
    `,
	})

	const res = await client.chat.completions.create({
		model,
		messages: messagesKnowledge,
		temperature: 0.1,
	})

	// Add the ai response to the message history
	messagesKnowledge.push({
		role: res.choices[0].message.role,
		content: res.choices[0].message.content as string,
	})

	const messagesToList = (msg: Message) =>
		`<strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content.replaceAll('\n', '</br>')}</p></div>`

	return c.html(`<h3>Knowledge</h3><div>${messagesKnowledge.map(messagesToList).join('')}
${siteHtmlKnowledge}
`)
})

app.get('/qa', (c) => {
	return c.html(`<h3>Question-Answer</h3>${siteHtmlQA}`)
})

app.post('/qa', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtmlQA)
	}

	const db = await getDb()
	const embeddingRes = await createEmbeddings(prompt.toString(), 'search_query')

	const dbResult = await db.query<
		[{ similarity: number; answer: string; question: string }[]]
	>(
		`SELECT
      id,
      similarity,
      answer,
      question,
      vector::similarity::cosine(embedding, $embedding) as similarity
    FROM faq
    WHERE vector::similarity::cosine(embedding, $embedding) >= $scoreThreshold
    ORDER BY similarity desc
    LIMIT $maxResults;`,
		{
			embedding: embeddingRes.embeddings[0],
			scoreThreshold: 0.5,
			maxResults: 10,
		},
	)

	const pairs = dbResult[0] ?? []

	// Add the users prompt to the history before sending to the llm
	messagesQA.push({
		role: 'user',
		content: `${prompt.toString()}
    
    ${pairs.map((c) => `Question: ${c.question}\nAnswer; ${c.answer}`).join('\n\n')}
    `,
	})

	const res = await client.chat.completions.create({
		model,
		messages: messagesQA,
		temperature: 0.1,
	})

	// Add the ai response to the message history
	messagesQA.push({
		role: res.choices[0].message.role,
		content: res.choices[0].message.content as string,
	})

	const messagesToList = (msg: Message) =>
		`<strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content.replaceAll('\n', '</br>')}</p></div>`

	return c.html(`<h3>Question-Answer</h3><div>${messagesQA.map(messagesToList).join('')}
${siteHtmlQA}
`)
})

app.get('/graph', (c) => {
	return c.html(`<h3>QA + Graph</h3>${siteHtmlGraph}`)
})

app.post('/graph', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtmlGraph)
	}

	const db = await getDb()
	const embeddingRes = await createEmbeddings(prompt.toString(), 'search_query')

	const dbResult = await db.query<
		[
			{
				similarity: number
				answer: string
				question: string
				entities: string[]
			}[],
		]
	>(
		`SELECT
      id,
      similarity,
      answer,
      question,
      entities,
      vector::similarity::cosine(embedding, $embedding) as similarity
    FROM faq
    WHERE vector::similarity::cosine(embedding, $embedding) >= $scoreThreshold
    ORDER BY similarity desc
    LIMIT $maxResults;`,
		{
			embedding: embeddingRes.embeddings[0],
			scoreThreshold: 0.5,
			maxResults: 10,
		},
	)

	const pairs = dbResult[0] ?? []

	const entityIds = new Set<string>()

	for (const pair of pairs) {
		for (const entityId of pair.entities) {
			entityIds.add(entityId)
		}
	}

	const graphContext =
		entityIds.size > 0 ? await getGraphContext(...Array.from(entityIds)) : ''

	// Add the users prompt to the history before sending to the llm
	messagesGraph.push({
		role: 'user',
		content: `${prompt.toString()}
    
    ${pairs.map((c) => `Question: ${c.question}\nAnswer; ${c.answer}`).join('\n\n')}

    ${graphContext}
    `,
	})

	const res = await client.chat.completions.create({
		model,
		messages: messagesGraph,
		temperature: 0.1,
	})

	// Add the ai response to the message history
	messagesGraph.push({
		role: res.choices[0].message.role,
		content: res.choices[0].message.content as string,
	})

	const messagesToList = (msg: Message) =>
		`<strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content.replaceAll('\n', '</br>')}</p></div>`

	return c.html(`<h3>QA + Graph</h3><div>${messagesGraph.map(messagesToList).join('')}
${siteHtmlGraph}
`)
})
export default app
