import type { RecordId } from 'surrealdb'

export type Message = {
	role: 'system' | 'user' | 'assistant'
	content: string
}

export type Chunk = {
	similarity: number
	text: string
	metadata: {
		file: string
		Header_1?: string
		Header_2?: string
		Header_3?: string
		Header_4?: string
	}
}

export type QuestionAnswerPair = {
	similarity: number
	answer: string
	question: string
}

export type Entity = {
	id: RecordId<'entity'>
	name: string
	description: string
}

export type GraphRelation = {
	description: string
	id: RecordId<'entity'>
	name: string
	relates: string[]
	type: string
}

export type GraphEntry = {
	description: string
	name: string
	relatesFrom: GraphRelation[]
	relatesTo: GraphRelation[]
}
