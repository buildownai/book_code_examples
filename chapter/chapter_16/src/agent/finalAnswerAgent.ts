import OpenAI from 'openai'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { getLastMessages } from '../helper/getLastMessages.js'
import { agentState } from '../states.js'

const client = new OpenAI({
	baseURL,
	apiKey,
})
export const finalAnswerAgent = async () => {
	const recentMessages = getLastMessages()
		.map((message) => `${message.role}: ${message.content}`)
		.join('\n\n')

	const prompt = `You are an AI assistant tasked with generating a followup.
The context is you're having a conversation with the user, and you've just updated an description for them. Now you should follow up with a message that notifies them you have done the changes.

Here is the description you generated:

${agentState.description}

Finally, here is the chat history between you and the user:
<recent-messages>
${recentMessages}
</recent-messages>

The notification that you have done the changes must be very short.
Never generate more than 2-3 short sentences.
Your tone should be somewhat formal, but still friendly and be creative here. Remember, you're an AI assistant.

Depending on the conversation history, you should ask the user for information to further improve the description.
You should only ask one question at a time.
The question should be a single sentence that can be answered with a short phrase or sentence or best case with yes or no.
Choose the most relevant question based on the users most recent message from the checklist which needs to be answered. If there is no relevant question, choose one from the top of the checklist.
Do not repeat questions that have already been asked.
Here is a checklist of what information might be helpfull:

${agentState.checklist
	.filter((item) => !item.done)
	.map((item) => `- ${item.item}`)
	.join('\n')}

The description is only finished when there are no items on the checklist which do not have a fact.

ALWAYS CHECK THE CONVERSATION HISTORY BEFORE ASKING A QUESTION. DO NOT REPEAT QUESTIONS THAT HAVE ALREADY BEEN ASKED.
DO NOT ASK THE USER IF YOU SHOULD MAKE CHANGES OR REFINE ON YOUR OWN.

NEVER return the description or parts of the descrption or an outline. ONLY return the very short followup message.

Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response. Do NOT suffix your response. Your response to this message should ONLY contain the followup message.
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
		stream: true,
	})

	return response
}
