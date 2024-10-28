import { Hono } from 'hono'

const app = new Hono()

const model = 'qwen2.5-coder:1.5b'

const siteHtml = `
<form action="/" method="post" autocomplete="off">
  <input type="text" name="prompt" a/>
  <button type="submit">Send</button>
</form>
`
app.get('/', (c) => {
	return c.html(siteHtml)
})

app.post('/', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtml)
	}

	// Call the language model via Ollama API
	const res = await fetch('http://localhost:11434/api/generate', {
		method: 'post',
		body: JSON.stringify({
			model,
			prompt,
			stream: false,
		}),
		headers: {
			Accept: 'application/json',
			'Content-Type': 'application/json',
		},
	})

	if (!res.ok) {
		// Handle response error
		console.error(res.status, res.statusText)
		return c.html(siteHtml)
	}

	// Extract the llm model response from the returned JSON response
	const content = await res.json()
	console.log(JSON.stringify(content, null, 2))

	return c.html(`<div>
    <i>You:</i><p>${prompt}</p>
  </div>
  <div>
    <strong>AI:</strong><p>${content.response}</p>
  </div>
${siteHtml}
`)
})

export default app
