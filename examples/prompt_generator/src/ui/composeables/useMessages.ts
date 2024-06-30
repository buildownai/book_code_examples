import type { Message } from 'ollama';
import { ref } from 'vue';

const messages = ref<Message[]>([]);

export const useMessages = () => {
	return {
		messages,
		fetchMessageHistory: async () => {
			const response = await fetch('/api/prompt-generator/messages');
			messages.value = await response.json();
		},
		addHistory: (role: string, content: string) =>
			messages.value.push({ role, content }),
		clearHistory: () => {
			messages.value = [];
		},
	};
};
