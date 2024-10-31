import type { SSEStreamingApi } from 'hono/streaming'
import OpenAI from 'openai'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { md } from '../markdown.js'
import { agentState } from '../states'

const client = new OpenAI({
	baseURL,
	apiKey,
})

export const updateChecklistAgent = async (stream: SSEStreamingApi) => {
	const systemPrompt = `Your task is to create checklist for a project description.

The user will provide a list of facts. You need to check if the facts are missing important information.
If a information is missing an entry must be added to the checklist.
If a information is given in the facts the related checklist entry is done and must be removed from the list.
Never include facts or information from facts in the checklist
Provided facts should not be included in the checklist and removed from the checklist.

Here are some citeria on what you should check for:

- is the programming language defined which is used in the project
- which kind of project is it? frontend, backend, fullstack, mobile app, native desktop app, library, etc.
  - is it hard required to define a runtime environment - especially for nativ apps and mobile apps?
- what is the purpose of the project (brief 1-2 sentences about the business case)
- what is the repository structure - is it a single app repo or mono repo with workspaces?
- when it contains a backend:
  - should a framework be used, and if so which one
  - does the backend provide an API? If yes, what kind of API (REST, GraphQL, etc.)
  - is a test framework required? If yes, which one?
  - is a database required? If yes, which one?
    - should an ORM be used and if so which one?
    - is the schema of the database well-documented?
    - is there a migration tool for the database?
    - are there any specific constraints or rules that must be followed when designing the database schema
- when it contains a frontend:
  - should a framework be used, and if so which one
  - does it need something like a bunder (like webpack, vite)
  - are there general style guidelines or design patterns that must be followed?
  - should it support darkmode and lightmode
  - what is the default language for labels and texts in the frontend?
  - is it a multilanguage app? If yes, which languages dn how should they handled
  - are component libraries required? If yes, which ones?
  - does the frontend use any state management library? If yes, which one?
  - does the frontend use any routing library? If yes, which one?
  - is it a single page application (SPA) or a multi-page application (MPA)?
  - are there specific tools or libraries that must be used for testing?
  - does the frontend consume an API? If yes, what kind of API (REST, GraphQL, etc.)
  - are the general views/pages defined (like login, dashboard, settings)?
  - is the navigation structure defined?
- when it contains frontend and backend:
  - is the development fronted or back-end first? Which one should be prioritized?
  - how does the frontend and backend communiate with each other (REST, GraphQL, etc.)
- are third party services required? If yes, which ones?
  - how should data be exchanged between the project and these services? (API calls, webhooks, etc.)
  - what kind of authentication and authorization mechanisms should be used with these services?
- are there any specific security requirements or guidelines that must be followed for the project?
- how are secrets managed in the project? (e.g. API keys, passwords, etc.)
- how are project configurations managed? (e.g. environment variables, build settings, etc.)

Be smart and only add checklist items to the list when they are required and not already done by the facts.
Add own items if it makes sense in your context.
For example if the project does not contain a backend or frontend, do not include those sections in the checklist.
If a framework is used, which provides frontend and backend, do not add items for framework check individually for frontend and backend.
If the facts providing a specific answer to an item remove the item and do not include in the list.

DO NOT ADD CHECKLIST ITEMS THAT ARE DEFINED BY FACTS.

Here is the current checklist:
<checklist>
${agentState.checklist}
</checklist>

The checklist must always complete and be accurate.
Only remove items from the checklist if the facts contain the information or if the entry is no longer relevant based on the provided facts.

Return the list formatted with markdown without any thoughts or explainantion or any other text. Do not use backticks.
Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response.
`

	const response = await client.chat.completions.create({
		model,
		messages: [
			{ role: 'system', content: systemPrompt },
			{
				role: 'user',
				content: agentState.facts,
			},
		],
		...chatGernationParameters,
		stream: true,
	})

	let content = ''
	let id = 0

	for await (const chunk of response) {
		const data = chunk.choices[0].delta.content
		if (data) {
			content += data

			stream.writeSSE({
				data: JSON.stringify({ data }),
				event: 'checklist',
				id: id.toString(),
			})
			id++
		}
	}

	stream.writeSSE({
		data: JSON.stringify({ data: md.render(content) }),
		event: 'end-checklist',
		id: '0',
	})

	agentState.checklist = content
}
