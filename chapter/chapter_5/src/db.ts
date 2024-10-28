import Surreal, { ConnectionStatus } from 'surrealdb'

let db = new Surreal()

const migration = `
DEFINE TABLE IF NOT EXISTS knowledge
  COMMENT "Knowledge base table";

DEFINE INDEX IF NOT EXISTS knowledge_idx 
  ON TABLE knowledge 
  COLUMNS embedding 
  MTREE DIMENSION 768 
  COMMENT "Index of the embedding vectors";
`

export const connectDb = async () => {
	db = new Surreal()
	// Connect to database
	await db.connect('http://127.0.0.1:8000/rpc')
	await db.use({
		database: 'buildownai',
		namespace: 'buildownai',
	})

	// Authenticate
	await db.signin({
		username: 'root',
		password: 'root',
	})

	// Run migration
	await db
		.query(migration)
		.catch((err) => console.error(err, 'Migration failed'))
}

export const getDb = async () => {
	if (!db || db.connection?.status !== ConnectionStatus.Connected) {
		await connectDb()
	}
	return db
}
