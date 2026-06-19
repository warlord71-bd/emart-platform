'use client';

import type { Message } from 'ai';
import { Fragment, type ReactNode } from 'react';

function AssistantIcon() {
  return (
    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-primary-500 text-xs font-bold text-white">
      E
    </span>
  );
}

function FormatMessage({ text, isUser }: { text: string; isUser: boolean }) {
  const linkClass = isUser
    ? 'underline text-white/90'
    : 'underline font-semibold text-primary-500';

  const lines = text.split('\n');
  return (
    <>
      {lines.map((line, i) => (
        <Fragment key={i}>
          {i > 0 && <br />}
          {renderLine(line, linkClass)}
        </Fragment>
      ))}
    </>
  );
}

function renderLine(line: string, linkClass: string): ReactNode {
  // Match: [text](url), **bold**, or raw https:// URLs
  const re = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s,)]+))/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index));

    if (match[2] && match[3]) {
      // Markdown link [text](url)
      parts.push(makeLink(match[3], match[2], linkClass, parts.length));
    } else if (match[4]) {
      // Bold **text**
      parts.push(<strong key={parts.length}>{match[4]}</strong>);
    } else if (match[5]) {
      // Raw URL
      parts.push(makeLink(match[5], null, linkClass, parts.length));
    }
    last = match.index + match[0].length;
  }

  if (last < line.length) parts.push(line.slice(last));
  return <>{parts}</>;
}

function makeLink(url: string, label: string | null, cls: string, key: number) {
  const isInternal = url.includes('e-mart.com.bd');
  const href = isInternal ? url.replace(/https?:\/\/e-mart\.com\.bd/, '') || '/' : url;
  const display = label || (isInternal ? href : url);
  return (
    <a
      key={key}
      href={href}
      className={`${cls} break-all`}
      {...(isInternal ? {} : { target: '_blank', rel: 'noopener noreferrer' })}
    >
      {display}
    </a>
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
            <FormatMessage text={m.content} isUser={m.role === 'user'} />
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
