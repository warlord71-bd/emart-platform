'use client';

import { useChat } from '@ai-sdk/react';
import type { Message } from 'ai';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { MessageCircle, Sparkles, X } from 'lucide-react';
import ChatMessages from './ChatMessages';
import ChatInput from './ChatInput';
import EmartAssistantLogo from './EmartAssistantLogo';

type Tab = 'chat' | 'whatsapp';

const WHATSAPP_HREF = 'https://wa.me/8801919797399';
const SESSION_KEY = 'emart-chat-session';
const MESSAGES_KEY = 'emart-chat-messages';
const PDP_NUDGE_KEY = 'emart-chat-pdp-nudge';

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = crypto.randomUUID();
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return 'anon';
  }
}

function loadMessages(): Message[] {
  try {
    const raw = sessionStorage.getItem(MESSAGES_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    sessionStorage.setItem(MESSAGES_KEY, JSON.stringify(msgs));
  } catch { /* sessionStorage unavailable */ }
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab>('chat');
  const [pdpNudge, setPdpNudge] = useState<{ slug: string } | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const sessionId = useMemo(() => getSessionId(), []);
  const initialMessages = useMemo(() => loadMessages(), []);

  const { messages, input, handleInputChange, handleSubmit, isLoading, append } = useChat({
    api: '/api/chat',
    id: sessionId,
    initialMessages,
    body: { sessionId },
  });

  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

  const handleSend = useCallback(
    (text: string) => {
      append({ role: 'user', content: text });
    },
    [append],
  );

  const handlePdpNudge = useCallback(() => {
    if (!pdpNudge) return;
    setOpen(true);
    setTab('chat');
    setPdpNudge(null);
    try {
      sessionStorage.setItem(PDP_NUDGE_KEY, pdpNudge.slug);
    } catch { /* sessionStorage unavailable */ }
    append({
      role: 'user',
      content: `I am viewing /shop/${pdpNudge.slug}. Suggest a simple skincare routine or matching products from Emart that go well with this product.`,
    });
  }, [append, pdpNudge]);

  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const match = window.location.pathname.match(/^\/shop\/([^/?#]+)/);
    if (!match) return;
    const slug = decodeURIComponent(match[1]);
    try {
      if (sessionStorage.getItem(PDP_NUDGE_KEY) === slug) return;
    } catch { /* sessionStorage unavailable */ }
    const timer = window.setTimeout(() => {
      if (!open) setPdpNudge({ slug });
    }, 8000);
    return () => window.clearTimeout(timer);
  }, [open]);

  return (
    <>
      {/* Floating Action Button */}
      {!open && (
        <>
          {pdpNudge && (
            <button
              onClick={handlePdpNudge}
              className="fixed bottom-24 right-4 z-50 max-w-[250px] rounded-2xl border border-primary-100 bg-white p-3 text-left shadow-xl transition-transform hover:-translate-y-0.5 lg:bottom-28"
              aria-label="Ask Emart AI for product suggestions"
            >
              <span className="mb-1 flex items-center gap-1.5 text-xs font-semibold text-primary-600">
                <Sparkles size={14} aria-hidden="true" />
                Need pairing ideas?
              </span>
              <span className="block text-xs leading-5 text-gray-600">
                Ask Emart AI what goes well with this product.
              </span>
            </button>
          )}
          <button
            onClick={() => setOpen(true)}
            className="fixed bottom-6 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-transform hover:scale-110 active:scale-95 lg:bottom-8"
            aria-label="Open Emart AI assistant"
          >
            <EmartAssistantLogo size="lg" />
            <span className="absolute -right-0.5 -top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white text-primary-500 shadow-sm">
              <MessageCircle size={12} aria-hidden="true" />
            </span>
          </button>
        </>
      )}

      {/* Chat Panel */}
      {open && (
        <div className="fixed inset-0 z-50 flex items-end justify-end sm:inset-auto sm:bottom-6 sm:right-4">
          {/* Backdrop on mobile */}
          <div
            className="absolute inset-0 bg-black/20 sm:hidden"
            onClick={() => setOpen(false)}
          />

          <div className="relative flex h-full w-full flex-col overflow-hidden bg-white shadow-2xl sm:h-[560px] sm:w-[380px] sm:rounded-2xl">
            {/* Header */}
            <div className="flex items-center justify-between bg-primary-500 px-4 py-3 text-white">
              <div className="flex items-center gap-2.5">
                <EmartAssistantLogo size="md" className="ring-white/40" />
                <div>
                  <p className="text-sm font-semibold">Emart Support</p>
                  <p className="text-[11px] opacity-80">Skincare · Orders · Shipping</p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-1 transition-colors hover:bg-white/20"
                aria-label="Close chat"
              >
                <X size={20} />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex border-b border-gray-100">
              <button
                onClick={() => setTab('chat')}
                className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                  tab === 'chat'
                    ? 'border-b-2 border-primary-500 text-primary-500'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                AI Assistant
              </button>
              <button
                onClick={() => setTab('whatsapp')}
                className={`flex-1 py-2.5 text-center text-xs font-medium transition-colors ${
                  tab === 'whatsapp'
                    ? 'border-b-2 border-[#25D366] text-[#25D366]'
                    : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                WhatsApp
              </button>
            </div>

            {/* Content */}
            {tab === 'chat' ? (
              <div ref={scrollRef} className="flex flex-1 flex-col overflow-hidden">
                <ChatMessages messages={messages} isLoading={isLoading} onSend={handleSend} />
                <ChatInput
                  input={input}
                  isLoading={isLoading}
                  onInputChange={handleInputChange}
                  onSubmit={handleSubmit}
                />
              </div>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366]/10">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="#25D366">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-800">Chat on WhatsApp</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Talk to our support team directly.
                    <br />
                    Available Sat–Thu, 9 AM – 9 PM
                  </p>
                </div>
                <a
                  href={WHATSAPP_HREF}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-xl bg-[#25D366] px-6 py-3 text-sm font-medium text-white shadow-sm transition-transform hover:scale-105"
                >
                  Open WhatsApp
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
