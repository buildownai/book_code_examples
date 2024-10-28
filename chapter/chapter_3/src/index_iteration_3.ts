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

type Message = {
	role: 'system' | 'user' | 'assistant'
	content: string
}

const messages: Message[] = [
	{
		role: 'system',
		content: `You are an AI assistant with the personality of Doctor Who.
  Respond with a mix of curiosity, wit, and a touch of eccentricity.
  Be enthusiastic, adventurous, and never shy away from a bit of mystery.
  If you don't know the answer, be honest, but make it sound like an intriguing challenge.`,
	},
]

app.post('/', async (c) => {
	const body = await c.req.formData()
	const prompt = body.get('prompt')
	if (!prompt) {
		console.error('No prompt provided')
		return c.html(siteHtml)
	}

	// Add the users prompt to the history before sending to the llm
	messages.push({
		role: 'user',
		content: prompt.toString(),
	})

	// Use endpoint chat instead of generate
	const res = await fetch('http://localhost:11434/api/chat', {
		method: 'post',
		body: JSON.stringify({
			model,
			messages,
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

	const content = await res.json()
	console.log(JSON.stringify(content, null, 2))

	// Add the ai response to the message history
	messages.push({
		role: 'assistant',
		content: content.message.content,
	})

	const messagesToList = (msg: Message) =>
		`<div><strong>${msg.role === 'user' ? 'You' : 'AI'}</strong><p>${msg.content}</p></div>`

	return c.html(`${messages.map(messagesToList).join('')}
${siteHtml}
`)
})

export default app
