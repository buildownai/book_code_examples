import OpenAI from 'openai'
import { apiKey, baseURL, model } from '../config.js'
import { createEmbeddings } from '../create_embeddings'
import { getDb } from '../db'
import type { QuestionAnswerPair } from '../types.js'

const client = new OpenAI({
	baseURL,
	apiKey,
})

const getSystemMessage = (pairs: QuestionAnswerPair[]) => {
	const context = pairs
		.map((c) => `Question: ${c.question}\nAnswer; ${c.answer}`)
		.join('\n\n')

	return `You are an AI specialized to answer questions about PURISTA typescript backend framework based on the given context.

The context are question-answer pairs.
You should use these pairs to provide accurate and helpful answers.
Do not refer to the context as "the context" or any other similar phrase. Instead, integrate it into your response seamlessly.
If you don't know the answer, say only "I don't know" without further explainantion.

Here is the context:

${context}
`
}

export const getQuestionAnswerAnswer = async (question: string) => {
	const db = await getDb()
	const embeddingRes = await createEmbeddings(
		question.toString(),
		'search_query',
	)

	const dbResult = await db.query<[QuestionAnswerPair[]]>(
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

	const pairs = dbResult[0]

	if (!pairs?.length) {
		return "I don't know"
	}

	const result = await client.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: getSystemMessage(pairs) },
			{ role: 'user', content: question },
		],
		temperature: 0.7,
	})

	const res = result.choices[0].message.content ?? "I don't know"

	console.log('QA Answer', res)

	return res
}
