export type Message = {
	role: 'user' | 'assistant'
	content: string
}

export type AgentState = {
	facts: string
	description: string
	checklist: string
}
