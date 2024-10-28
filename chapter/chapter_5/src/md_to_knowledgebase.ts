import { readFile, readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import { MarkdownNodeParser } from '@llamaindex/core/node-parser'
import { Document } from '@llamaindex/core/schema'
import { createEmbeddings } from './create_embeddings.js'
import { getDb } from './db.js'

export const createDocumentChunks = (text: string, file: string) => {
	const splitter = new MarkdownNodeParser()
	return splitter.getNodesFromDocuments([
		new Document({ text, metadata: { file } }),
	])
}

const removeFrontmatter = (markdown: string): string => {
	// Match frontmatter block starting with '---' or '+++'
	const frontmatterRegex = /^---[\s\S]*?---\s*|^\+\+\+[\s\S]*?\+\+\+\s*/

	// Remove the frontmatter block if it exists
	return markdown.replace(frontmatterRegex, '').trim()
}

const main = async () => {
	// read the directory and subdirectory
	const basePath = join(import.meta.dir, '..', '..', '..', 'md_handbook_files')
	const files = await readdir(basePath, { recursive: true })

	const db = await getDb()

	for (const file of files) {
		// ignore all files which are not markdown
		if (extname(file) !== '.md') {
			continue
		}
		// get the file content and create chunks
		const fileContent = await readFile(join(basePath, file), {
			encoding: 'utf-8',
		})
		const chunks = createDocumentChunks(removeFrontmatter(fileContent), file)

		const embeddings = await createEmbeddings(
			chunks.map((c) => c.text),
			'search_document',
		)

		embeddings.embeddings.forEach(
			// biome-ignore lint/suspicious/noAssignInExpressions: <explanation>
			(embedding, index) => (chunks[index].embedding = embedding),
		)

		const docs = chunks.map((c) => c.toJSON())
		await db.insert('knowledge', docs)
	}
}

main()
