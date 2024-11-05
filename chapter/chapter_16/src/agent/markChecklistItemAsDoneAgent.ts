import OpenAI from 'openai'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { getLastMessages } from '../helper/getLastMessages.js'
import { agentState } from '../states'

const client = new OpenAI({
	baseURL,
	apiKey,
})

const schema = z.object({
	done: z
		.array(z.string().describe('ID of item which should be marked as done'))
		.default([])
		.describe('List of ids to mark as done on the checklist'),
})

export const markChecklistItemAsDoneAgent = async () => {
	const recentMessages = getLastMessages()
		.map((message) => `${message.role}: ${message.content}`)
		.join('\n\n')

	const stateList = agentState.checklist
		.map((item, index) => ({
			item: `- 'id_${index}': ${item.item}`,
			done: item.done,
		}))
		.filter((item) => !item.done)

	const prompt = `Your task is to mark items from a given checklist.

Your task is, to look at the checklist in isolation and determine:

- Mark a item as done if the answer is included in the facts
- Mark a item as done if the user has provided a answer in the recent messages
- Mark a item as done if it is no longer relevant in the given context of facts and user answers.

DO NOT MARK ITEMS AS DONE WHEN THEY ARE NOT ANSWERED OR RELEVANT.

Here are the facts:

${agentState.facts.map((fact) => `- ${fact}`).join('\n')}

Here is the checklist:

${stateList.map((item) => `${item.item}`).join('\n')}

A few of the recent messages in the chat history are:
<recent-messages>
${recentMessages}
</recent-messages>

Before you answer, you need to think and validate if your decisions are valid.

Return as JSON without any thoughts or explainantion or any other text. Do not use backticks.
Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response.

Return only a valid and plain JSON object. Never return any thoughts or explanations.
The object has the key "done" which is an flat array of ids which are should be marked as done the checklist.

${JSON.stringify(zodToJsonSchema(schema), null, 2)}
`

	const response = await client.chat.completions.create({
		model,
		messages: [{ role: 'user', content: prompt }],
		...chatGernationParameters,
		response_format: { type: 'json_object' },
	})

	const result = schema.parse(
		JSON.parse(response.choices[0].message.content ?? '{"done":[]}'),
	)

	for (const stringId of result.done) {
		const id = Number.parseInt(stringId.replace('id_', ''))
		if (agentState.checklist[id]) {
			agentState.checklist[id].done = true
		}
	}
}
