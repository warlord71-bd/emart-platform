'use client';

import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Camera, Mic, Search, X } from 'lucide-react';

const QUICK_SEARCHES = [
  'COSRX sunscreen',
  'Anua toner',
  'Snail mucin',
  'Japanese sunscreen',
  'Cerave cleanser',
  'Acne serum',
];

interface SearchEntryProps {
  initialQuery?: string;
}

export default function SearchEntry({ initialQuery = '' }: SearchEntryProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState(initialQuery);
  const [isListening, setIsListening] = useState(false);
  const [status, setStatus] = useState('');

  const runSearch = (term = query) => {
    const cleaned = term.trim();
    if (!cleaned) return;

    const params = new URLSearchParams({ q: cleaned });
    router.push(`/search?${params.toString()}`);
  };

  const startVoiceSearch = () => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setStatus('Voice search is not available on this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = 'en-BD';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    setIsListening(true);
    setStatus('Listening...');

    recognition.onresult = (event: any) => {
      const transcript = event.results?.[0]?.[0]?.transcript?.trim();
      if (transcript) {
        setQuery(transcript);
        setStatus('Voice captured.');
        runSearch(transcript);
      }
    };
    recognition.onerror = () => setStatus('Voice search could not hear that clearly.');
    recognition.onend = () => setIsListening(false);
    recognition.start();
  };

  const openVisualSearch = () => {
    fileInputRef.current?.click();
  };

  const handleVisualImage = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setStatus('Photo selected. Add a product or brand name to refine.');
  };

  return (
    <section className="rounded-lg border border-hairline bg-white p-3 shadow-card sm:p-4">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          runSearch();
        }}
        className="relative"
      >
        <div className="flex h-12 min-w-0 items-center overflow-hidden rounded-lg border border-hairline bg-bg-alt focus-within:border-accent focus-within:bg-white focus-within:ring-2 focus-within:ring-accent/15">
          <Search size={18} className="ml-3 shrink-0 text-muted-2" />
          <input
            type="search"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setStatus('');
            }}
            placeholder="Search products, brands..."
            className="h-full w-0 min-w-0 flex-1 bg-transparent px-3 text-sm font-semibold text-ink outline-none placeholder:font-medium placeholder:text-muted-2"
            autoComplete="off"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setStatus('');
              }}
              className="flex h-full w-9 shrink-0 items-center justify-center text-muted-2 hover:text-accent"
              aria-label="Clear search"
            >
              <X size={17} />
            </button>
          )}
          <button
            type="button"
            onClick={startVoiceSearch}
            className={`flex h-full w-10 shrink-0 items-center justify-center transition-colors hover:text-accent ${
              isListening ? 'text-accent' : 'text-muted'
            }`}
            aria-label="Voice search"
            title="Voice search"
          >
            <Mic size={18} />
          </button>
          <button
            type="button"
            onClick={openVisualSearch}
            className="flex h-full w-10 shrink-0 items-center justify-center text-muted transition-colors hover:text-accent"
            aria-label="Visual search"
            title="Visual search"
          >
            <Camera size={18} />
          </button>
          <button
            type="submit"
            className="mr-1 flex h-9 shrink-0 items-center justify-center rounded-lg bg-ink px-3 text-xs font-bold text-white transition-colors hover:bg-black"
          >
            Search
          </button>
        </div>
      </form>

      <div className="mt-3 flex gap-2 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {QUICK_SEARCHES.map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQuery(term);
              runSearch(term);
            }}
            className="inline-flex h-8 shrink-0 items-center rounded-full border border-hairline bg-bg-alt px-3 text-xs font-bold text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
          >
            {term}
          </button>
        ))}
      </div>

      {status && (
        <p className="mt-2 text-xs font-semibold text-gray-500" aria-live="polite">
          {status}
        </p>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleVisualImage}
        aria-hidden="true"
      />
    </section>
  );
}
