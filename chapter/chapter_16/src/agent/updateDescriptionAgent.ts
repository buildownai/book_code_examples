import type { SSEStreamingApi } from 'hono/streaming'
import OpenAI from 'openai'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { getLastMessages } from '../helper/getLastMessages.js'
import { md } from '../markdown.js'
import { agentState } from '../states.js'
import { generalAppContext } from './prompt.js'

const client = new OpenAI({
	baseURL,
	apiKey,
})

export const updateDescriptionAgent = async (stream: SSEStreamingApi) => {
	const systemPrompt = `You are an AI assistant, and the user has provided facts and information or requested you make an update to an description you generated in the past.

${generalAppContext}

You also have the following reflections on general memories/facts about the user to use when generating your response.
<reflections>
NEVER make any assumptions or guesses. Never include any information, fact or data that is not provided by the user.

Especially never add or referr to any package, library, framework, tool or technology that is not mentioned by the user.

The description is very objective only based on facts and user provided information.
The description does not contain any explanations or justifications. It's purely factual
The description is hierarchical structured with sections for different aspects of the project.

The description formated as markdown, using headers (h1-h6) and lists to represent the hierarchy.

There is checklist and a list of facts managed internally. The checklist and facts are used to ask follow up questions when more information is needed.
When a question answer does not require to update the description, only the checklist needs to be updated.
The checklist and the facts are never visible to the user and you should never mention them.
</reflections>

Here is the current content of the project description:
<artifact>
${agentState.description}
</artifact>

Here are the facts:
<facts>
${agentState.facts}
</facts>

Instructions:

- the description must be concisely and accurately reflect the provided facts.
- the description must not include any information that is not explicitly stated in the facts or provided by the user.
- ensure that different paragraphs are always aligned with the facts and user information
- You never talk to the user directly
- Never ask for more information or clarification

You need to identify any information or change request from the users message and incorporate it into the existing description. If there are no changes requested, simply return the original description.
Return only the updated description without any additional text or thoughts.
The description should not contain instruction on how to to things, but rather a factual summary of the project itself.

IF YOU CAN NOT UPDATE THE DESCRIPTION BASED ON THE PROVIDED INFORMATION, RETURN THE ORIGINAL DESCRIPTION WITHOUT ANY CHANGES!
NEVER ASK QUESTIONS OR FOR MORE INFORMATION. JUST RETURN THE UPDATED DESCRIPTION IF POSSIBLE OR THE ORIGINAL ONE.

Your response to this message should ONLY contain the description without any thoughts or description.

Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response. Do NOT suffix your response. Just the plain project description without backticks.
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

	let content = ''
	let id = 0

	for await (const chunk of response) {
		const data = chunk.choices[0].delta.content
		if (data) {
			content += data

			stream.writeSSE({
				data: JSON.stringify({ data }),
				event: 'description',
				id: id.toString(),
			})
			id++
		}
	}

	stream.writeSSE({
		data: JSON.stringify({ data: md.render(content) }),
		event: 'end-description',
		id: '0',
	})

	agentState.description = content
	return agentState.description
}
