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

  const panelClass = (tabId: string) =>
    !hydrated || activeTab === tabId ? 'text-lumiere-text-secondary' : 'hidden';

  return (
    <div className="clear-both rounded-2xl border border-hairline bg-white p-4 shadow-sm md:p-5">
      {/* Tab Navigation */}
      <div role="tablist" aria-label="Product details" className="flex gap-4 overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            id={`tab-${tab.id}`}
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
          className={panelClass('description')}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(rewriteInternalLinks(description), '<p>No description available.</p>'),
          }}
        />
        <div
          role="tabpanel"
          id="tabpanel-ingredients"
          aria-labelledby="tab-ingredients"
          className={panelClass('ingredients')}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(rewriteInternalLinks(ingredients), '<p>No ingredients information available.</p>'),
          }}
        />
        <div
          role="tabpanel"
          id="tabpanel-howToUse"
          aria-labelledby="tab-howToUse"
          className={panelClass('howToUse')}
          dangerouslySetInnerHTML={{
            __html: sanitizeHtml(rewriteInternalLinks(howToUse), '<p>No usage instructions available.</p>'),
          }}
        />
      </div>
    </div>
  );
};
