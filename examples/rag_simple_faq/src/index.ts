import { config } from '@buildownai/examples_config';
import { ensureModel } from '@buildownai/examples_ollama';
import { swaggerUI } from '@hono/swagger-ui';
import { OpenAPIHono } from '@hono/zod-openapi';
import { getAnswerWithContext } from './llm/getAnswerWithContext.js';
import { getInsertEmbedding, getQueryEmbedding } from './llm/getEmbedding.js';
import { getFaqFromText } from './llm/getFaqFromText.js';
import { addRoute, askRoute } from './openapi.js';
import { addItem, query } from './vectorDb.js';

// Ensure the required models available in Ollama
// They are automatically downloaded, if not present
await ensureModel(config().model);
await ensureModel(config().embeddingModel);

const app = new OpenAPIHono();

// the route to provide a new text content.
app.openapi(addRoute, async (c) => {
  // get the text from the http request
  const content = await c.req.text();

  console.debug('Creating FAQ for given content');
  // Call the llm to generate the question answer pairs
  const questions = await getFaqFromText(content);

  console.debug(`${questions.items.length} question answer pairs generated`);
  // insert each question answer pair into the database
  for (const item of questions.items) {
    // generate a embedding vector for the current pair
    const embedding = await getInsertEmbedding(item);

    // insert the question answer pair with embeddings into vector database
    await addItem(item, embedding);
    console.debug('Question', item.question);
  }

  return c.text(`${questions.items.length} question answer pairs inserted`);
});

// The endpoint to ask questions, which will be answered based on the FAQ
app.openapi(askRoute, async (c) => {
  // get the question from the http request
  const question = await c.req.text();

  // create a embedding vector for the question
  const embedding = await getQueryEmbedding(question);

  // query the database with the question embedding
  const faqs = await query(embedding);

  // Ask the llm to answer the question and provide the question answer pairs
  const answer = await getAnswerWithContext(question, faqs);

  // Sent back the answer of the llm
  return c.text(answer);
});

// Adding the endpoints for the Swagger UI
app.get('/', swaggerUI({ url: '/doc' }));
app.doc('/doc', {
  info: {
    title: 'Simple RAG FAQ',
    version: 'v1',
  },
  openapi: '3.1.0',
});

export default app;
