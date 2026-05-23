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
    { id: 'description', label: 'Description' },
    { id: 'ingredients', label: 'Ingredients' },
    { id: 'howToUse', label: 'How to use' },
  ];

  const isActive = (tabId: string) => !hydrated || activeTab === tabId;

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const ids = tabs.map((t) => t.id);
    const cur = ids.indexOf(activeTab);
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
      {/* Tab Navigation */}
      <div role="tablist" aria-label="Product details" className="flex gap-4 overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" onKeyDown={handleKeyDown}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
            tabIndex={activeTab === tab.id ? 0 : -1}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`shrink-0 border-b-2 px-1 py-3 text-sm font-semibold transition-colors md:text-base ${
              activeTab === tab.id
                ? 'border-lumiere-text-primary text-lumiere-text-primary'
                : 'border-transparent text-lumiere-text-secondary hover:text-lumiere-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* All three panels always in SSR HTML; client switches visibility after hydration */}
      <div className="prose prose-sm max-w-none py-6">
        <div
          role="tabpanel"
          id="tabpanel-description"
          aria-labelledby="tab-description"
          aria-hidden={hydrated && activeTab !== 'description'}
          tabIndex={isActive('description') ? 0 : -1}
          className={isActive('description') ? 'text-lumiere-text-secondary' : 'hidden'}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(rewriteInternalLinks(description), '<p>No description available.</p>'),
          }}
        />
        <div
          role="tabpanel"
          id="tabpanel-ingredients"
          aria-labelledby="tab-ingredients"
          aria-hidden={hydrated && activeTab !== 'ingredients'}
          tabIndex={isActive('ingredients') ? 0 : -1}
          className={isActive('ingredients') ? 'text-lumiere-text-secondary' : 'hidden'}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(rewriteInternalLinks(ingredients), '<p>No ingredients information available.</p>'),
          }}
        />
        <div
          role="tabpanel"
          id="tabpanel-howToUse"
          aria-labelledby="tab-howToUse"
          aria-hidden={hydrated && activeTab !== 'howToUse'}
          tabIndex={isActive('howToUse') ? 0 : -1}
          className={isActive('howToUse') ? 'text-lumiere-text-secondary' : 'hidden'}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(rewriteInternalLinks(howToUse), '<p>No usage instructions available.</p>'),
          }}
        />
      </div>
    </div>
  );
};
