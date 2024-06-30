import { config } from '@buildownai/examples_config';
import { ollama } from '@buildownai/examples_ollama';
import type { DocumentMetadata } from '../types.js';
import { generateFaqSystemMessage } from './systemMessage.js';

/**
* Use the llm to generate question answer pairs for given text.
* The answer from the llm should be a JSON string, which will be parsed into a regular object
*/
export const getFaqFromText = async (text: string) => {
  const result = await ollama.generate({
    model: config().model,
    prompt: text,
    system: generateFaqSystemMessage,
  });

  return JSON.parse(result.response) as {
    items: DocumentMetadata[];
  };
};
