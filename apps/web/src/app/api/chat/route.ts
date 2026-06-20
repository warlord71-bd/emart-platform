import { streamText } from 'ai';
import { getAgentModel } from '@/lib/agent/openrouter';
import { agentTools } from '@/lib/agent/tools';
import { SYSTEM_PROMPT } from '@/lib/agent/system-prompt';
import { buildContextNote, extractContext, updateSession } from '@/lib/agent/sessionStore';
import { hasBangla } from '@/lib/search/queryEnhance';

export const dynamic = 'force-dynamic';
export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, sessionId } = await req.json();
  const sid = typeof sessionId === 'string' && sessionId ? sessionId : 'anon';

  const ctx = extractContext(messages);
  if (Object.keys(ctx).length > 0) updateSession(sid, ctx);

  const contextNote = buildContextNote(sid);
  const latestUserText = [...messages].reverse().find((m: { role?: string }) => m.role === 'user')?.content || '';
  const bangla = typeof latestUserText === 'string' && hasBangla(latestUserText);

  const result = await streamText({
    model: getAgentModel({ bangla }),
    system: SYSTEM_PROMPT + contextNote,
    messages,
    tools: agentTools,
    maxSteps: 3,
  });

  return result.toDataStreamResponse();
}
