'use client';

import { useState, useLayoutEffect } from 'react';
import { rewriteInternalLinks } from '@/lib/rewriteInternalLinks';
import { sanitizeHtml } from '@/lib/sanitizeHtml';

interface DetailsTabsProps {
  description: string;
  ingredients: string;
  howToUse: string;
}

export const DetailsTabs: React.FC<DetailsTabsProps> = ({
  description,
  ingredients,
  howToUse,
}) => {
  const [activeTab, setActiveTab] = useState<'description' | 'ingredients' | 'howToUse'>('description');
  // SSR renders hydrated=false → all panels visible in HTML for crawlers.
  // useLayoutEffect fires before first browser paint → hides non-active panels
  // without a visible flash.
  const [hydrated, setHydrated] = useState(false);
  useLayoutEffect(() => { setHydrated(true); }, []);

  const tabs = [
    { id: 'description', label: 'Description', html: description },
    { id: 'ingredients', label: 'Ingredients', html: ingredients },
    { id: 'howToUse', label: 'How to use', html: howToUse },
  ].filter((tab) => stripHtmlText(tab.html).length > 0);

  if (tabs.length === 0) return null;
  const activePanel = tabs.some((tab) => tab.id === activeTab) ? activeTab : tabs[0].id;

  const isActive = (tabId: string) => !hydrated || activePanel === tabId;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const ids = tabs.map((t) => t.id);
    const cur = ids.indexOf(activePanel);
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      setActiveTab(ids[(cur + 1) % ids.length] as typeof activeTab);
    } else if (e.key === 'ArrowLeft') {
      e.preventDefault();
      setActiveTab(ids[(cur - 1 + ids.length) % ids.length] as typeof activeTab);
    }
  };

  return (
    <div className="clear-both rounded-2xl border border-hairline bg-white p-4 shadow-sm md:p-5">
      {/* Heading anchors the product-content panels (which may contain h2/h3 from raw
          Woo content) under a valid h2, avoiding an h1->h3 heading-level skip. */}
      <h2 className="sr-only">Product details</h2>
      {/* Tab Navigation */}
      <div role="tablist" aria-label="Product details" className="flex gap-4 overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onKeyDown={handleKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activePanel === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activePanel === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`shrink-0 border-b-2 px-1 py-3 text-sm font-semibold transition-colors md:text-base ${
              activePanel === tab.id
                ? 'border-ink text-ink'
                : 'border-transparent text-muted hover:text-ink'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* All three panels always in SSR HTML; client switches visibility after hydration */}
      <div className="prose prose-sm max-w-none pb-6 pt-4 [&>div>*:first-child]:mt-0">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            role="tabpanel"
            id={`tabpanel-${tab.id}`}
            aria-labelledby={`tab-${tab.id}`}
            aria-hidden={hydrated && activePanel !== tab.id}
            tabIndex={isActive(tab.id) ? 0 : -1}
            className={isActive(tab.id) ? 'text-muted' : 'hidden'}
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(rewriteInternalLinks(tab.html), ''),
            }}
          />
        ))}
      </div>
    </div>
  );
};

function stripHtmlText(value: string): string {
  return value
    .replace(/<[^>]*>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
