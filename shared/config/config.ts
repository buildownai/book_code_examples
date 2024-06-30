// general configuration
export const config = () => ({
	ollama: {
		host: 'http://localhost:11434',
	},
	embeddingModel: 'nomic-embed-text',
	model: 'gemma2',
	temperature: 0,
});
