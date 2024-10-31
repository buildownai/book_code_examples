import { raw } from 'hono/html'
import { useContext } from 'hono/jsx'
import { md } from '../markdown.js'
import { agentStateContext } from '../states.js'

export const DisplayContent = () => {
	const state = useContext(agentStateContext)
	return (
		<div class="prose dark:prose-invert" id="content">
			{raw(md.render(state.description))}
		</div>
	)
}
