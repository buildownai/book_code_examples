import { RecordId } from 'surrealdb'
import { getDb } from './db.js'
import type { GraphEntry } from './types.js'

export const getGraphContext = async (...entityIds: string[]) => {
	const db = await getDb()

	const result = await db.query<[GraphEntry[]]>(
		`
  SELECT
    name,
    description,
    (
      SELECT
        array::group(description) as relates,
        out.name as name,
        out.id as id,
        out.description as description,
        type 
      FROM ->relation
      GROUP BY id
    ) as relatesTo,
    (
      SELECT
        array::group(description) as relates,
        in.name as name,
        in.id as id,
        in.description as description,
        type
      FROM <-relation
      GROUP BY id
    ) as relatesFrom
  FROM $entities;`,
		{ entities: entityIds.map((id) => new RecordId('entity', id)) },
	)

	let context = ''

	for (const entry of result[0]) {
		// handle the case, when a entity-id given in the FROM clause does not exist
		if (!entry) {
			continue
		}

		context += `## ${entry.name}\n\n`
		context += `${entry.description}\n`

		for (const rel of entry.relatesTo) {
			if (rel.name) {
				context += `\n### ${rel.name}\n\n`
			}
			if (rel.description) {
				context += `${rel.description}\n\n`
			}

			if (rel.relates.length > 0) {
				context += `${entry.name} ${rel.type} ${rel.name ?? ''}:\n\n`
				for (const desc of rel.relates) {
					context += `- ${desc}\n`
				}
			}
		}

		for (const rel of entry.relatesFrom) {
			if (rel.name) {
				context += `\n### ${rel.name}\n\n`
			}
			if (rel.description) {
				context += `${rel.description}\n\n`
			}

			if (rel.relates.length > 0) {
				context += `${rel.name ?? ''} ${rel.type} ${entry.name}:\n\n`
				for (const desc of rel.relates) {
					context += `- ${desc}\n`
				}
			}
		}

		context += '\n---\n'
	}

	return context
}
