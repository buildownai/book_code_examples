import OpenAI from 'openai'
import { apiKey, baseURL, model } from '../config.js'
import { getGraphContext } from '../get_graph_context.ts'

const client = new OpenAI({
	baseURL,
	apiKey,
})

const getSystemMessage = (
	context: string,
) => `You are an AI specialized to answer questions about PURISTA typescript backend framework based on the given context.

Answer the users question based on the context provided.
Do not refer to the context as "the context" or any other similar phrase. Instead, integrate it into your response seamlessly.
If you don't know the answer, say only "I don't know" without further explainantion.

Here is the context:

${context}
`

export const getKnowledgeGraphAnswer = async (
	content: string,
	entityIds: string[],
) => {
	const graphContext = await getGraphContext(...entityIds)

	const result = await client.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: getSystemMessage(graphContext) },
			{ role: 'user', content },
		],
		temperature: 0.7,
	})

	const res = result.choices[0].message.content ?? "I don't know"

	console.log('Graph Answer', res)

	return res
}
