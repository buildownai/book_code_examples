import { config } from '@buildownai/examples_config';
import { ollama } from '@buildownai/examples_ollama';
import type { DocumentMetadata } from '../types.js';
import { answerBasedOnFaq, generateFaqSystemMessage } from './systemMessage.js';

/**
* Ask the llm to answer the question, and provide more context for the llm with question answer pairs
*/
export const getAnswerWithContext = async (
  question: string,
  faq: DocumentMetadata[] = [],
) => {
  // Build the prompt we use to call the llm
  let prompt = `Here is the question:
  ${question}
  `;

  if (faq.length) {
    prompt += `
    Here are question & answers fro mthe FAQ which help you to give the correct answer

    `;
    for (const item of faq) {
      prompt += `
      Question: ${item.question}
      Answer: ${item.answer}`;
    }
  }

  const result = await ollama.generate({
    model: config().model,
    prompt,
    system: answerBasedOnFaq,
    options: {
      temperature: config().temperature,
    },
  });

  return result.response;
};
