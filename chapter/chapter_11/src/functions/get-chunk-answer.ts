import OpenAI from 'openai'
import { apiKey, baseURL, model } from '../config.js'
import { createEmbeddings } from '../create_embeddings'
import { getDb } from '../db.js'
import type { Chunk } from '../types.js'

const client = new OpenAI({
	baseURL,
	apiKey,
})

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

const getSystemMessage = (chunks: Chunk[]) => `You are an AI specialized to answer questions about PURISTA typescript backend framework based on the given context.

Use the provided context to extract the related information.
Your answer should only be based on the extracted information.
Do not refer to the context as "the context" or any other similar phrase. Instead, integrate it into your response seamlessly.
If you don't know the answer, say only "I don't know" without further explainantion.

Here is the context:

${groupChunksByFileHeadlineAndSubheadline(chunks)}
`

export const getChunkAnswer = async (question: string) => {
	const db = await getDb()
	const embeddingRes = await createEmbeddings(
		question.toString(),
		'search_query',
	)

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

	if (!chunks?.length) {
		return "I don't know"
	}

	const result = await client.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: getSystemMessage(chunks) },
			{ role: 'user', content: question },
		],
		temperature: 0.7,
	})

	const res = result.choices[0].message.content ?? "I don't know"

	console.log('Chunk Answer', res)

	return res
}
