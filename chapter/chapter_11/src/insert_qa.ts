import { createEmbeddings } from './create_embeddings.js'
import { getDb } from './db.js'

const question = 'what is the website of purista'
const answer = `The official website of PURISTA is https://purista.dev
The source code can be found on the GitHub repository https://github.com/puristajs/purista`

const main = async () => {
	const db = await getDb()
	const embeddings = await createEmbeddings(
		`${question}\n\n${answer}`,
		'search_document',
	)

	const embedding = embeddings.embeddings[0]

	await db.insert('faq', { question, answer, embedding, metadata: {} })
}

main()
