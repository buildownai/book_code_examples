import { raw } from 'hono/html'
import { md } from '../markdown.js'
import type { Message } from '../types.js'

export const SingleMessage = (message: Message) => {
	return (
		<div class="flex justify-start px-4 py-8 sm:px-6">
			<img
				class="mr-2 flex h-8 w-8 rounded-full sm:mr-4"
				alt={message.role}
				src={
					message.role === 'user'
						? 'https://dummyimage.com/256x256/363536/ffffff&text=U'
						: 'https://dummyimage.com/256x256/354ea1/ffffff&text=G'
				}
			/>
			<div class="prose dark:prose-invert">
				{raw(md.render(message.content))}
			</div>
		</div>
	)
}
