import { userConversationMessages } from '../states.ts'
import type { Message } from '../types.ts'

export const getLastMessages = (x = 10): Message[] => {
	if (x >= userConversationMessages.length) {
		return userConversationMessages
	}
	return userConversationMessages.slice(-x)
}
