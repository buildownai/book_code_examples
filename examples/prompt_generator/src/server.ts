import { config } from '@buildownai/examples_config';
import { ensureModel, ollama } from '@buildownai/examples_ollama';
import { Hono } from 'hono';
import { serveStatic } from 'hono/bun';
import { cors } from 'hono/cors';
import { streamSSE } from 'hono/streaming';
import { chat } from './llm/chat.js';
import { type GeneratePromptInput, getPrompt } from './llm/getPrompt.js';
import { addToHistory, getHistory } from './llm/history.js';


// Ensure the required models available in Ollama
// They are automatically downloaded, if not present
await ensureModel(config().model);

// Init the webserver
const app = new Hono();
app.use(
  cors({
    origin: '*',
  }),
);

// Provide the index page for UI
app.get('/', serveStatic({ root: './src/ui' }));

app.get('/ollama/models', async (c) => {
  const installedModels = await ollama.list();

  return c.json(installedModels);
});

// get the current conversation excluding the system prompt and the first user request
app.get('/api/prompt-generator/messages', (c) => c.json(getHistory().slice(2)));

let id = 0;
// Endpoint to start a new chat and generate a prompt with given details first
app.post('/api/prompt-generator/generate', async (c) => {
  const input = await c.req.json<GeneratePromptInput & { model: string }>();
  const llmInput = getPrompt(input);
  const streamResult = await chat(llmInput, input.model, true);

  return streamSSE(c, async (stream) => {
    let content = '';
    await stream.writeSSE({
      data: '',
      event: 'start',
      id: String(id++),
    });
    for await (const part of streamResult) {
      content += part.message.content;
      await stream.writeSSE({
        data: JSON.stringify({ content: part.message.content }),
        event: 'response',
        id: String(id++),
      });
    }
    await stream.writeSSE({
      data: '',
      event: 'end',
      id: String(id++),
    });
    addToHistory(content, 'assistant');
  });
});

// Endpoint to chat with LLM about the current prompt
app.post('/api/prompt-generator/chat', async (c) => {
  const input = await c.req.json<{ message: string; model: string }>();
  const streamResult = await chat(input.message, input.model);

  return streamSSE(c, async (stream) => {
    let content = '';
    await stream.writeSSE({
      data: '',
      event: 'start',
      id: String(id++),
    });
    for await (const part of streamResult) {
      content += part.message.content;
      await stream.writeSSE({
        data: JSON.stringify({ content: part.message.content }),
        event: 'response',
        id: String(id++),
      });
    }
    await stream.writeSSE({
      data: '',
      event: 'end',
      id: String(id++),
    });
    addToHistory(content, 'assistant');
  });
});

export default app;
