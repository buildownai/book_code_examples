import { ollama } from '@buildownai/examples_ollama';
import { config } from './config.js';

const systemPrompt = `You are an Author and your task is to summarize the given text from your book.
The summary should explain what a reader can expect to read.
Try do include important keywords and topics in the text.
Keep the headlines and sub headlines.
The summary must be easy to read and understandable.
The summary should be long.
Do not write in third person. Instead of "the author", you should write from authors perspective.
Answer only with the summary.

The response must contain a front-matter header with title, description and keywords, which uses the YAML syntax with key: value pairs.
The header must contain the title, which is the first headline of the input text, description which a one sentence summary and keywords which are keywords related to the content
Use --- to separate the header.
`

const summarize = async (content: string) => {
  const response = await ollama.generate({
    model: config().model,
    prompt: content,
    system: systemPrompt,
    stream: false,
    options: {
      temperature: config().temperature
    }
  });

  return response.response
};

export { summarize };
