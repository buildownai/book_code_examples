/**
* This file contains only some OpenAPI (Swagger) markup.
*/

import { createRoute, z } from '@hono/zod-openapi';

export const addRoute = createRoute({
  method: 'post',
  path: '/add',
  request: {
    body: {
      content: { 'text/plain': { schema: z.string(), example: '' } },
      description:
        'Provide the text content for which you like to generate FAQ data',
    },
  },
  responses: {
    200: {
      content: {
        'text/plain': {
          schema: z.string(),
          example: '12 question answer pairs inserted',
        },
      },
      description: 'Returns how many FAQ pairs are inserted',
    },
  },
});

export const askRoute = createRoute({
  method: 'post',
  path: '/ask',
  request: {
    body: {
      content: { 'text/plain': { schema: z.string(), example: '' } },
      description: 'The question to answer',
    },
  },
  responses: {
    200: {
      content: {
        'text/plain': {
          schema: z.string(),
          example: 'The answer to your question 42',
        },
      },
      description: 'The answer to the question',
    },
  },
});
