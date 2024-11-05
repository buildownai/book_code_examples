import { createContext } from 'hono/jsx'
import type { AgentState, Message } from './types.js'

export const userConversationMessages: Message[] = []

export const userConversationContext = createContext(userConversationMessages)

export const agentState: AgentState = {
	facts: ['The project is a software project'],
	description: '# Project',
	checklist: [{ item: 'What is the purpose of the project', done: false }],
}

export const agentStateContext = createContext(agentState)
