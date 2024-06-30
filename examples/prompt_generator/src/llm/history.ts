import type { Message } from 'ollama';
import { systemMessage } from './systemMessage';

/**
 * The chat history
 */
let messages: Message[] = [
	{
		role: 'system',
		content: systemMessage,
	},
];

/**
 * Get the chat history
 */
export const getHistory = (): Message[] => {
	return messages;
};

/**
 * Add a single chat message to history
 */
export const addToHistory = (
	content: string,
	role: 'system' | 'user' | 'assistant',
) => {
	messages.push({ role, content });
};

/**
 * Reset the history (set only the system prompt)
 */
export const resetHistory = () => {
	messages = [
		{
			role: 'system',
			content: systemMessage,
		},
	];
};
