import OpenAI from 'openai'
import { apiKey, baseURL, embeddingModel } from './config.js'

const model = embeddingModel

const client = new OpenAI({
	baseURL,
	apiKey,
})

export const createEmbeddings = async (
	texts: string | string[],
	prefix: 'search_document' | 'search_query',
) => {
	const input = Array.isArray(texts)
		? texts.map((t) => `${prefix}: ${t}`)
		: `${prefix}: ${texts}`

	const res = await client.embeddings.create({
		model,
		input,
	})

	return {
		model,
		embeddings: res.data.map((e) => e.embedding),
	}
}
