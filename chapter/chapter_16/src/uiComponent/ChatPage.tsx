import { ChatForm } from './ChatForm.js'
import { Conversation } from './Conversation.js'
import { DisplayContent } from './DisplayContent.js'
import { DisplayState } from './DisplayState.js'
import { Layout } from './Layout.js'

export const ChatPage = () => (
	<Layout>
		<div class="flex flex-row">
			<div class="flex h-screen w-1/3 flex-col">
				<Conversation />
				<ChatForm />
			</div>
			<div class="h-screen flex-grow overflow-auto p-4 bg-gray-300 dark:bg-slate-950">
				<DisplayContent />
			</div>
			<div class="h-screen w-1/3 overflow-auto p-4 bg-gray-300 dark:bg-slate-800">
				<DisplayState />
			</div>
		</div>
	</Layout>
)
