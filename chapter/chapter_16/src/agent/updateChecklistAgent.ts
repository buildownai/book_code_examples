import type { SSEStreamingApi } from 'hono/streaming'
import OpenAI from 'openai'
import { z } from 'zod'
import zodToJsonSchema from 'zod-to-json-schema'
import { apiKey, baseURL, chatGernationParameters, model } from '../config.js'
import { md } from '../markdown.js'
import { agentState } from '../states'

const client = new OpenAI({
	baseURL,
	apiKey,
})

const schema = z.object({
	checklist: z
		.array(
			z
				.string()
				.describe(
					'A question about a fact which needs to be defined or clarified',
				),
		)
		.default([])
		.describe('List of new items for the checklist'),
})

export const updateChecklistAgent = async (stream: SSEStreamingApi) => {
	const prompt = `Your task is to update a checklist for a project description.

The user will provide a list of facts. You need to check if the facts are missing important information.
If a information is missing an item must be added to the checklist.
If a information is given in the facts the related checklist item must be removed from the list.
Never include facts or information from facts in the checklist.
Provided facts should not be included in the checklist.
The checklist is a flat list of questions. Each question is a separate item, asking for a single, specific fact or information to better describe the software project.

Here are some citeria on what you should check for:

- is the programming language defined which is used in the project
- which kind of project is it? frontend, backend, fullstack, mobile app, native desktop app, library, etc.
  - is it hard required to define a runtime environment - especially for nativ apps and mobile apps?
- what is the purpose of the project (brief 1-2 sentences about the business case)
- what is the repository structure - is it a single app repo or mono repo with workspaces?
- when it contains a backend:
  - should a framework be used, and if so which one
  - does the backend provide an API? If yes, what kind of API (REST, GraphQL, etc.)
    - which endpoints are provided by the API? (if applicable)
      - endpoint names and descriptions (if applicable)
    - which GraphQL schema is provided by the API? (if applicable)
      - query and mutation types with descriptions (if applicable)
    - is there any authentication mechanism?(if applicable)
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
For example if the project does not contain a backend or frontend, remove those sections from the checklist.
If a framework is used, which provides frontend and backend, do not add items for framework check individually for frontend and backend.
If the facts providing a specific answer to an item mark remove it from the checklist.

DO NOT ADD CHECKLIST ITEMS THAT ARE DEFINED BY FACTS.

Here are the facts:

${agentState.facts.map((fact) => `- ${fact}`).join('\n')}

Here is the current checklist:

${agentState.checklist.map((item) => `- ${item.item}`).join('\n')}

Return the list as JSON without any thoughts or explainantion or any other text. Do not use backticks.
Do NOT include any tags, or extra text before or after your response. Do NOT prefix your response.

Return only a valid and plain JSON object. Never return any thoughts or explanations.
The object has the key "checklist" which is an flat array of strings representing only new added items on the checklist.

${JSON.stringify(zodToJsonSchema(schema), null, 2)}
`
	const response = await client.chat.completions.create({
		model,
		messages: [{ role: 'user', content: prompt }],
		...chatGernationParameters,
		stream: true,
		response_format: { type: 'json_object' },
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

	const result = schema.parse(JSON.parse(content))

	agentState.checklist.push(
		...result.checklist.map((item) => ({ item, done: false })),
	)

	stream.writeSSE({
		data: JSON.stringify({
			data: md.render(
				agentState.checklist
					.map((item) => `- ${item.done ? 'DONE' : 'PENDING'}: ${item.item}`)
					.join('\n'),
			),
		}),
		event: 'end-checklist',
		id: '0',
	})
}
