import { createOpenAI } from '@ai-sdk/openai';

export const openrouter = createOpenAI({
  baseURL: 'https://openrouter.ai/api/v1',
  apiKey: process.env.OPENROUTER_API_KEY || '',
});

export const agentModel = openrouter(
  process.env.OPENROUTER_MODEL || 'nvidia/nemotron-3-super-120b-a12b:free',
);
