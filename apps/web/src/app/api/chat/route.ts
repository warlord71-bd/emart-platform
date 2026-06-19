import { streamText } from 'ai';
import { agentModel } from '@/lib/agent/openrouter';
import { agentTools } from '@/lib/agent/tools';
import { SYSTEM_PROMPT } from '@/lib/agent/system-prompt';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = await streamText({
    model: agentModel,
    system: SYSTEM_PROMPT,
    messages,
    tools: agentTools,
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
