import OpenAI from 'openai'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { getLastMessages } from '../helper/getLastMessages.js'

const client = new OpenAI({
	baseURL,
	apiKey,
})

export const defaultAgent = async () => {
	const systemPrompt = `You are an AI assistant called Buddy tasked with responding to the users question.

  The general topic is creating a detailed project description for a software development project.
  BUT HERE YOU NEVER create a description or provide an outline of descrption.
  The user must provide project information.
  
  You only answer the user friendly within 2-3 sentence maximum.
  .
  `

	const response = await client.chat.completions.create({
		model,
		messages: [
			{
				role: 'system',
				content: systemPrompt,
			},
			...getLastMessages(),
		],
		...chatGernationParameters,
		stream: true,
	})

	return response
}
