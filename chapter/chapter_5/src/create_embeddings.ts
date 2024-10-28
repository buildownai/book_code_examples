export const createEmbeddings = async (
	texts: string | string[],
	prefix: 'search_document' | 'search_query',
) => {
	const input = Array.isArray(texts)
		? texts.map((t) => `${prefix}: ${t}`)
		: `${prefix}: ${texts}`

	// Call the embeddings endpoint with the text or array of texts to create embeddings for
	const res = await fetch('http://localhost:11434/api/embed', {
		method: 'post',
		body: JSON.stringify({
			model: 'nomic-embed-text:latest',
			input,
		}),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	})
	// Check Response
	if (!res.ok) {
		// Handle response error
		console.error(res.status, res.statusText)
		throw new Error('Failed to create embeddings')
	}

	// Return the response with typescript types
	return res.json() as Promise<{
		model: string
		embeddings: number[][]
	}>
}
