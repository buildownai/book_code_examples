export const baseURL = 'http://localhost:11434/v1/'
export const apiKey = process.env.OPENAI_API_KEY ?? 'ollama-key'
export const model = 'buildownai/llama3b'
export const embeddingModel = 'nomic-embed-text:latest'

export const chatGernationParameters = {
	temperature: 1,
}
