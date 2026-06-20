'use client';

import type { Message } from 'ai';
import type { ToolInvocation } from '@ai-sdk/ui-utils';
import { Fragment, type ReactNode } from 'react';
import ChatProductCard from './ChatProductCard';

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
  const re = /(\[([^\]]+)\]\((https?:\/\/[^)]+)\)|\*\*([^*]+)\*\*|(https?:\/\/[^\s,)]+))/g;
  const parts: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;

  while ((match = re.exec(line)) !== null) {
    if (match.index > last) parts.push(line.slice(last, match.index));

    if (match[2] && match[3]) {
      parts.push(makeLink(match[3], match[2], linkClass, parts.length));
    } else if (match[4]) {
      parts.push(<strong key={parts.length}>{match[4]}</strong>);
    } else if (match[5]) {
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

interface ProductResult {
  name: string;
  slug: string;
  price: string;
  brand?: string;
  image?: string;
  stock_status?: string;
  category?: string;
}

function extractProducts(inv: ToolInvocation): ProductResult[] | null {
  if (inv.state !== 'result') return null;
  const result = inv.result as Record<string, unknown>;
  if (!result) return null;

  if (inv.toolName === 'searchProducts' && Array.isArray(result.products)) {
    return result.products as ProductResult[];
  }
  if (inv.toolName === 'recommendByProfile' && Array.isArray(result.recommended)) {
    return (result.recommended as ProductResult[]).map((p) => ({
      ...p,
      slug: p.slug || '',
    }));
  }
  if (inv.toolName === 'getProductDetails' && result.name && result.slug) {
    return [result as unknown as ProductResult];
  }

  return null;
}

function ToolInvocationCards({ invocations }: { invocations: ToolInvocation[] }) {
  const pending = invocations.some((inv) => inv.state === 'call' || inv.state === 'partial-call');

  if (pending) {
    return (
      <div className="flex items-center gap-1.5 py-1 text-xs text-gray-400">
        <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary-500" />
        Searching...
      </div>
    );
  }

  const allProducts: ProductResult[] = [];
  for (const inv of invocations) {
    const products = extractProducts(inv);
    if (products) allProducts.push(...products);
  }

  if (!allProducts.length) return null;

  return (
    <div className="mt-2 flex flex-col gap-1.5">
      {allProducts.slice(0, 5).map((p, i) => (
        <ChatProductCard key={`${p.slug}-${i}`} product={p} />
      ))}
    </div>
  );
}

const STARTER_CHIPS = [
  { label: 'Find a product', query: "I'm looking for a skincare product" },
  { label: 'Track my order', query: 'I want to track my order' },
  { label: 'Skincare routine', query: 'Can you recommend a skincare routine for me?' },
  { label: 'Shipping info', query: 'What are your shipping rates and delivery times?' },
  { label: 'Talk to human', query: "I'd like to speak with a human agent" },
];

function StarterChips({ onSelect }: { onSelect: (query: string) => void }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-3 p-4 text-center">
      <AssistantIcon />
      <div>
        <p className="text-sm font-medium text-gray-600">Hi! I&apos;m Emart&apos;s AI assistant.</p>
        <p className="mt-0.5 text-xs text-gray-400">How can I help you today?</p>
      </div>
      <div className="flex flex-wrap justify-center gap-2 pt-1">
        {STARTER_CHIPS.map((chip) => (
          <button
            key={chip.label}
            onClick={() => onSelect(chip.query)}
            className="rounded-xl border border-gray-200 px-3 py-2 text-xs text-gray-600 transition-colors hover:border-primary-500/50 hover:bg-primary-500/5 hover:text-primary-600"
          >
            {chip.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function QuickReplies({
  products,
  onSelect,
}: {
  products: ProductResult[];
  onSelect: (query: string) => void;
}) {
  const first = products[0];
  const replies: { label: string; query: string }[] = [];

  if (first?.name) {
    const shortName = first.name.length > 30 ? first.name.slice(0, 30) + '...' : first.name;
    replies.push({ label: `More about ${shortName}`, query: `Tell me more about ${first.name}` });
  }
  replies.push({ label: 'Show more like this', query: 'Show me more products like these' });
  replies.push({ label: 'Talk to human', query: "I'd like to speak with a human agent" });

  return (
    <div className="flex flex-wrap gap-1.5 pt-1">
      {replies.map((r) => (
        <button
          key={r.label}
          onClick={() => onSelect(r.query)}
          className="rounded-lg border border-gray-200 px-2.5 py-1.5 text-[11px] text-gray-500 transition-colors hover:border-primary-500/50 hover:text-primary-600"
        >
          {r.label}
        </button>
      ))}
    </div>
  );
}

interface ChatMessagesProps {
  messages: Message[];
  isLoading: boolean;
  onSend: (message: string) => void;
}

export default function ChatMessages({ messages, isLoading, onSend }: ChatMessagesProps) {
  if (messages.length === 0) {
    return (
      <div className="flex flex-1 flex-col overflow-y-auto">
        <StarterChips onSelect={onSend} />
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-3">
      {messages.map((m, mi) => {
        const hasToolInvocations = m.role === 'assistant' && m.toolInvocations?.length;
        const products: ProductResult[] = [];
        if (hasToolInvocations) {
          for (const inv of m.toolInvocations!) {
            const p = extractProducts(inv);
            if (p) products.push(...p);
          }
        }

        const isLastAssistant =
          m.role === 'assistant' && mi === messages.length - 1 && !isLoading;

        return (
          <div key={m.id}>
            <div className={`flex gap-2 ${m.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              {m.role === 'assistant' && <AssistantIcon />}
              <div className="max-w-[85%]">
                {m.content && (
                  <div
                    className={`rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed ${
                      m.role === 'user'
                        ? 'bg-primary-500 text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <FormatMessage text={m.content} isUser={m.role === 'user'} />
                  </div>
                )}
                {hasToolInvocations && (
                  <ToolInvocationCards invocations={m.toolInvocations!} />
                )}
                {isLastAssistant && products.length > 0 && (
                  <QuickReplies products={products} onSelect={onSend} />
                )}
              </div>
            </div>
          </div>
        );
      })}
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
