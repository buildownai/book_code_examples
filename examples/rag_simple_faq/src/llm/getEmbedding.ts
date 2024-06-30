import { config } from '@buildownai/examples_config';
import { ollama } from '@buildownai/examples_ollama';
import type { DocumentMetadata } from '../types.ts';

/**
* Generate a embedding vector for the given question answer pair
*/
export const getInsertEmbedding = async (input: DocumentMetadata) => {
  const result = await ollama.embeddings({
    model: config().embeddingModel,
    prompt: `search_document: Question: ${input.question}

    Answer:
    ${input.answer}`,
  });

  return result.embedding;
};

/**
* Generate a embedding vector for a question, which needs to be answered with FAQ data
*/
export const getQueryEmbedding = async (question: string) => {
  const result = await ollama.embeddings({
    model: config().embeddingModel,
    prompt: `search_query: ${question}`,
  });

  return result.embedding;
};
