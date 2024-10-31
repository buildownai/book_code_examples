import { raw } from 'hono/html'
import { useContext } from 'hono/jsx'
import { md } from '../markdown.js'
import { agentStateContext } from '../states.js'

export const DisplayState = () => {
	const state = useContext(agentStateContext)
	return (
		<div class="prose dark:prose-invert">
			<h3>Facts</h3>
			<div class="prose dark:prose-invert" id="facts">
				{raw(md.render(state.facts))}
			</div>
			<h3>Checklist</h3>
			<div class="prose dark:prose-invert" id="checklist">
				{raw(md.render(state.checklist))}
			</div>
		</div>
	)
}
