import { createContext } from 'hono/jsx'
import type { AgentState, Message } from './types.js'

export const userConversationMessages: Message[] = []

export const userConversationContext = createContext(userConversationMessages)

export const agentState: AgentState = {
	facts: '',
	description: '',
	checklist: '',
}

export const agentStateContext = createContext(agentState)
