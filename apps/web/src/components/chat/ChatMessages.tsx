'use client';

import type { Message } from 'ai';

function AssistantIcon() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
      E
    </span>
  );
}

export default function ChatMessages({ messages, isLoading }: { messages: Message[]; isLoading: boolean }) {
  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      {messages.length === 0 && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-center text-sm text-gray-400">
          <AssistantIcon />
          <p className="font-medium text-gray-600">Hi! I&apos;m Emart&apos;s AI assistant.</p>
          <p>Ask me about products, orders, shipping, or skincare routines.</p>
        </div>
      )}
      {messages.map((m) => (
        <div key={m.id} className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
          {m.role === 'assistant' && <AssistantIcon />}
          <div
            className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-800'
            }`}
          >
            {m.content}
          </div>
        </div>
      ))}
      {isLoading && (
        <div className="flex items-center gap-2">
          <AssistantIcon />
          <div className="flex gap-1 rounded-2xl bg-gray-100 px-4 py-3">
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '0ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '150ms' }} />
            <span className="h-2 w-2 animate-bounce rounded-full bg-gray-400" style={{ animationDelay: '300ms' }} />
          </div>
        </div>
      )}
    </div>
  );
}
