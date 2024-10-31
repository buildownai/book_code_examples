import type { SSEStreamingApi } from 'hono/streaming'
import { defaultAgent } from './defaultAgent.js'
import { finalAnswerAgent } from './finalAnswerAgent.js'
import { router } from './router'
import { updateChecklistAgent } from './updateChecklistAgent.js'
import { updateDescriptionAgent } from './updateDescriptionAgent.js'
import { updateFactsAgent } from './updateFactsAgent.js'

export const getTheAnswer = async (stream: SSEStreamingApi) => {
	const routerChoice = await router()

	console.log('router_choice:', routerChoice)

	if (routerChoice === 'defaultAgent') {
		// Direct answer to user if no defined path could be identified
		return defaultAgent()
	}

	// Enter the selected path from the flow
	switch (routerChoice) {
		case 'onlyUpdateChecklist':
			await updateFactsAgent(stream)
			await updateChecklistAgent(stream)
			return defaultAgent()
		case 'updateProjectDescription':
			await updateFactsAgent(stream)
			await updateDescriptionAgent(stream)
			await updateChecklistAgent(stream)
			break
		default:
			console.error(`Unknown router choice: ${routerChoice}`)
	}

	return finalAnswerAgent()
}
