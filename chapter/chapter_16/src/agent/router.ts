import OpenAI from 'openai'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { getLastMessages } from '../helper/getLastMessages.js'
import { generalAppContext } from './prompt.js'

const client = new OpenAI({
	baseURL,
	apiKey,
})

export const router = async () => {
	const recentMessages = getLastMessages()
		.map((message) => `${message.role}: ${message.content}`)
		.join('\n\n')

	const routerOptions = `
- onlyUpdateChecklist: The user rejected an action or a message is provided which does not require to update the description and only the checklist should be updated. As an example, this is the case when you ask the user if you should do a specific change and the user rejects it. Or when you ask if something is ok and the user agrees.
- updateProjectDescription: The user has provided project information, requested some sort of change or creation, or revision to the project description. Use their recent message and the currently selected project description (if any) to determine what to do.
- defaultAgent: The user has asked a question, or has submitted a general message which requires a response, but is not related to building the description. Use this ONLY when you are sure the message is not an answer to a previous question or part of a larger conversation about the project description.
`

	const prompt = `You are an assistant tasked with routing the users query based on their most recent message.
You should look at this message in isolation and determine where to best route there query.

Use this context about the application and its features when determining where to route to:
${generalAppContext}

Your options are as follows:
<options>
${routerOptions}
</options>

A few of the recent messages in the chat history are:
<recent-messages>
${recentMessages}
</recent-messages>

You need to chose one of the router options based on the most recent message. Return only the choice name as plain text without any other text, without explanation and without thoughts.
`

	const response = await client.chat.completions.create({
		model,
		messages: [
			{
				role: 'user',
				content: prompt,
			},
		],
		...chatGernationParameters,
	})

	return response.choices[0].message.content ?? 'FAIL'
}
