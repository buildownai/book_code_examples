import { useContext } from 'hono/jsx'
import { userConversationContext } from '../states.js'
import { SingleMessage } from './SingleMessage.js'

export const Conversation = () => {
	const allMessages = useContext(userConversationContext)
	const messages = 2 >= allMessages.length ? allMessages : allMessages.slice(-2)

	return (
		<div
			id="chatbox"
			class="flex-1 overflow-y-auto text-sm leading-6 text-slate-900 shadow-md dark:text-slate-300 sm:text-base sm:leading-7"
		>
			{messages.map((message, index) => (
				<SingleMessage
					// biome-ignore lint/suspicious/noArrayIndexKey: <explanation>
					key={index}
					role={message.role}
					content={message.content}
				/>
			))}

			<div class="flex justify-start px-4 py-8 sm:px-6">
				<div id="final-message" class="prose dark:prose-invert" />
			</div>
		</div>
	)
}
