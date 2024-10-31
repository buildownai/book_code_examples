import { Hono } from 'hono'
import { streamSSE } from 'hono/streaming'
import { getTheAnswer } from './agent/getTheAnswer.js'
import { md } from './markdown.js'
import { userConversationMessages } from './states.js'
import { ChatPage } from './uiComponent/ChatPage.js'

const app = new Hono()

app.get('/', (c) => {
	return c.html(<ChatPage />)
})

app.post('/', async (c) => {
	const body = await c.req.text()
	if (!body) {
		return c.text('Invalid message', 400)
	}
	console.log()
	console.log('User message:', body)
	console.log()

	userConversationMessages.push({
		role: 'user',
		content: body,
	})

	return streamSSE(c, async (stream) => {
		const finalAnswer = await getTheAnswer(stream)

		let content = ''
		let id = 0

		for await (const chunk of finalAnswer) {
			const data = chunk.choices[0].delta.content
			if (data) {
				content += data

				stream.writeSSE({
					data: JSON.stringify({ data }),
					event: 'final-message',
					id: id.toString(),
				})
				id++
			}
		}

		stream.writeSSE({
			data: JSON.stringify({ data: md.render(content) }),
			event: 'end-final-message',
			id: '0',
		})

		userConversationMessages.push({
			role: 'assistant',
			content,
		})
	})
})

export default app
