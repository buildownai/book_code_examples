import { Hono } from 'hono'
import OpenAI from 'openai'
import { z } from 'zod'
import { apiKey, baseURL, chatGernationParameters, model } from './config.js'
import { getChunkAnswer } from './functions/get-chunk-answer.js'
import { getKnowledgeGraphAnswer } from './functions/get-knowledge-graph-answer.js'
import { getQuestionAnswerAnswer } from './functions/get-question-answer-answer.js'
import { transformToSnakeCase } from './transform_to_snake_case.js'
import type { Message } from './types.js'

const app = new Hono()

const client = new OpenAI({
	baseURL,
	apiKey,
})

// the response schema of the first step to create the function input
const schema = z.object({
	parameters: z.object({
		question: z.string(),
		entities: z.array(z.string().transform(transformToSnakeCase)).default([]),
	}),
})

// the system prompt of the first step to create the function input
const generateParameterSystemMessage: Message = {
	role: 'system',
	content: `You are an AI assistant specified for PURISTA, which is a typescript backend framework.
    
    Your task is to generates a JSON response based for the latest user input.

    - You must always generate a short and precise question which reflects what exactly needs to be responded for the latest user input, that can be used as a function parameter.
    - The question must always relate to the PURISTA framework
    - The question should the reflect the users intent and be specific to the context of the conversation.
    - Entities are nouns, which are describing logic groups of the framework and they are always singular.
    - You must always generate a list of entities for the generated question
    
    Return only valid and plain JSON. Never return any thoughts or explanations.
The returned JSON must be a object with the key parameters, which is a objects with keys question and entities.
Entities is a list of strings, contain the id of the entity which is the very detailed and precise singular name of the entity in snake-case.
The id should be very precise and unique. Example: use service_config instead of config.
Always ensure this JSON schema for your response:

{
 "parameters": {
   "question": "<a_natural_language_question_to_answer>",
   "entities: ["<the_id_of_the_entity>","<the_id_of_the_other_entity>"]
 }
}
`,
}

const getFinalResponseSystemMessage = (answers: string[]): Message => ({
	role: 'system',
	content: `You are an AI assistant which creates an answer based on the given context.
   
The context are different answers for the current user question. You must combine these answers into a final response.
Your answer must always be only based on the given answers.
Do not refer to the context as "the context" or any other similar phrase. Instead, integrate it into your response seamlessly.
If you don't know the answer, say only "I don't know" without further explainantion.

Here is the context:
   
${answers.map((answer, index) => `## Answer ${index}: \n\n${answer}`).join('\n')}
   `,
})

const userConversation: Message[] = []

const siteHtmlKnowledge = `
<form action="/knowledge" method="post" autocomplete="off">
  <input type="text" name="prompt" a/>
  <button type="submit">Send</button>
</form>
`

app.get('/', (c) => {
	const messagesToList = (msg: Message) =>
		`<strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content.replaceAll('\n', '</br>')}</p></div>`

	return c.html(`<h3>Poor Mans Tool-Calling</h3><div>${userConversation.map(messagesToList).join('')}
${siteHtmlKnowledge}
`)
})

app.post('/knowledge', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtmlKnowledge)
	}

	// Add the original users prompt to the history
	userConversation.push({
		role: 'user',
		content: prompt.toString(),
	})

	// generate the function parameters
	const parameterResponse = await client.chat.completions.create({
		model,
		messages: [generateParameterSystemMessage, ...userConversation],
		...chatGernationParameters,
		response_format: { type: 'json_object' }, // zodResponseFormat(schema,'parameters'),
	})

	const validInput = schema.parse(
		JSON.parse(parameterResponse.choices[0].message.content as string),
	)

	console.log(validInput)

	const graphAnswer = await getKnowledgeGraphAnswer(
		validInput.parameters.question,
		validInput.parameters.entities,
	)
	const chunkAnswer = await getChunkAnswer(validInput.parameters.question)
	const qaAnswer = await getQuestionAnswerAnswer(validInput.parameters.question)

	const finalRes = await client.chat.completions.create({
		model,
		messages: [
			getFinalResponseSystemMessage([graphAnswer, chunkAnswer, qaAnswer]),
			{ role: 'user', content: validInput.parameters.question },
		],
	})

	const finalAnswer = finalRes.choices[0].message.content ?? "I don't know"

	userConversation.push({
		role: 'assistant',
		content: finalAnswer,
	})

	const messagesToList = (msg: Message) =>
		`<strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content.replaceAll('\n', '</br>')}</p></div>`

	return c.html(`<h3>Poor Mans Tool-Calling</h3><div>${userConversation.map(messagesToList).join('')}
${siteHtmlKnowledge}
`)
})

export default app
