import Surreal, { ConnectionStatus } from 'surrealdb'

let db = new Surreal()
let expirationDate = new Date()
let migrated = false

const migration = `
DEFINE TABLE IF NOT EXISTS knowledge
  COMMENT "Knowledge base table";

DEFINE INDEX IF NOT EXISTS knowledge_idx 
  ON TABLE knowledge 
  COLUMNS embedding 
  MTREE DIMENSION 768 
  COMMENT "Index of the embedding vectors";

DEFINE TABLE IF NOT EXISTS faq
  COMMENT "FAQ table";

DEFINE INDEX IF NOT EXISTS faq_idx 
  ON TABLE faq 
  COLUMNS embedding 
  MTREE DIMENSION 768 
  COMMENT "Index of the embedding vectors";
`

function decodeBase64Url(base64Url: string): string {
	// Replace base64url characters to base64
	const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')

	// Decode base64 string to normal string
	return decodeURIComponent(
		atob(base64)
			.split('')
			.map((c) => `%${(`00${c.charCodeAt(0).toString(16)}`).slice(-2)}`)
			.join(''),
	)
}

export const getExpireTimeFromJWT = (token: string): number => {
	try {
		// Split the JWT into its components
		const parts = token.split('.')

		if (parts.length !== 3) {
			throw new Error('Invalid JWT structure')
		}

		// The payload is the second part, decode it from base64url
		const payload = JSON.parse(decodeBase64Url(parts[1]))

		// Return the 'exp' claim if it exists
		return payload.exp ? payload.exp : null
	} catch (err) {
		console.error('Invalid token', err)
		return 0
	}
}

export const connectDb = async () => {
	db = new Surreal()
	// Connect to database
	await db.connect('ws://127.0.0.1:8000/')
	await db.use({
		database: 'buildownai',
		namespace: 'buildownai',
	})

	// Authenticate
	const token = await db.signin({
		username: 'root',
		password: 'root',
	})

	expirationDate = new Date(getExpireTimeFromJWT(token) * 1000)

	const version = await db.version()

	if (!migrated) {
		await migrateDb()
		migrated = true
	}

	console.log(`Using SurrealDB version ${version}`, db.status)
}

export const getDb = async () => {
	if (db.status === ConnectionStatus.Connected && expirationDate > new Date()) {
		return db
	}

	await db
		.close()
		.catch((err) => console.error('failed to close surrealDB connection', err))

	await connectDb()

	return db
}

export const closeDb = async () => {
	await db.close()
}

export const migrateDb = async () => {
	// Run migration
	await db
		.query(migration)
		.catch((err) => console.error(err, 'Migration failed'))
	console.log('migration done')
}
