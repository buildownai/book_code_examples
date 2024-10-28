export const baseURL = 'http://localhost:11434/v1/'
export const apiKey = process.env.OPENAI_API_KEY ?? 'ollama-key'
export const model = 'buildownai/qwen14b'
export const embeddingModel = 'nomic-embed-text:latest'

export const chatGernationParameters = {
	temperature: 0.7,
	//frequency_penalty: 2,
}
