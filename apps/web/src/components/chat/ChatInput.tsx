'use client';

import { Send } from 'lucide-react';
import type { ChangeEvent, FormEvent } from 'react';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  onInputChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  onSubmit: (e: FormEvent<HTMLFormElement>) => void;
}

export default function ChatInput({ input, isLoading, onInputChange, onSubmit }: ChatInputProps) {
  return (
    <form onSubmit={onSubmit} className="flex items-end gap-2 border-t border-gray-100 bg-white p-3">
      <textarea
        value={input}
        onChange={onInputChange}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            e.currentTarget.form?.requestSubmit();
          }
        }}
        placeholder="Ask about products, orders, shipping..."
        rows={1}
        className="flex-1 resize-none rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-gray-400 focus:border-primary-500 focus:bg-white"
        disabled={isLoading}
      />
      <button
        type="submit"
        disabled={isLoading || !input.trim()}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-500 text-white transition-opacity disabled:opacity-40"
        aria-label="Send message"
      >
        <Send size={18} />
      </button>
    </form>
  );
}
