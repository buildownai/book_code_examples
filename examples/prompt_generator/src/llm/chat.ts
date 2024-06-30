import { config } from '@buildownai/examples_config';
import { ollama } from '@buildownai/examples_ollama';
import { addToHistory, getHistory, resetHistory } from './history.js';

/**
 * Chat with the LLM about the actual prompt
 */
export const chat = async (
  content: string,
  model: string,
  forceResetHistory = false,
) => {
  if (forceResetHistory) {
    resetHistory();
  }
  addToHistory(content, 'user');

  return ollama.chat({
    model,
    messages: getHistory(),
    stream: true,
    options: {
      temperature: config().temperature,
    },
  });
};
