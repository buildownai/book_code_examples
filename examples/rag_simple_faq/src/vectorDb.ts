import { join } from 'node:path';
import { LocalIndex } from 'vectra';
import type { DocumentMetadata } from './types.js';

// Setup the vector store database
const index = new LocalIndex(
  join(import.meta.dir, '..', 'vectorDbIndex'),
);

if (!(await index.isIndexCreated())) {
  console.info('Creating vector store index');
  await index.createIndex();
} else {
  console.info('Use existing vector store index');
}

/**
* Add a question answer pair with it´s embedding vector to the database
*/
export const addItem = async (input: DocumentMetadata, embedding: number[]) =>
  index.insertItem({
    vector: embedding,
    metadata: input,
  });


/**
* Query the database for question answer pairs which are related to given embedding vectors
*/
export const query = async (embedding: number[], topK = 5) => {
  const results = await index.queryItems<DocumentMetadata>(embedding, topK);

  return results.map((resut) => resut.item.metadata);
};
