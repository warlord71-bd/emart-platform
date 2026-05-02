'use client';

import { useState } from 'react';
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

  const tabs = [
    { id: 'description', label: 'Description', icon: '📋' },
    { id: 'ingredients', label: 'Ingredients', icon: '🧪' },
    { id: 'howToUse', label: 'How to use', icon: 'ℹ️' },
  ];

  return (
    <div className="clear-both rounded-2xl border border-hairline bg-white p-4 shadow-sm md:p-5">
      {/* Tab Navigation */}
      <div className="flex gap-4 overflow-x-auto border-b border-gray-200 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {tabs.map((tab) => (
          <button
            key={tab.id}
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

      {/* Tab Content */}
      <div className="prose prose-sm max-w-none py-6">
        {activeTab === 'description' && (
          <div
            className="text-lumiere-text-secondary"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(description, '<p>No description available.</p>'),
            }}
          />
        )}
        {activeTab === 'ingredients' && (
          <div
            className="text-lumiere-text-secondary"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(ingredients, '<p>No ingredients information available.</p>'),
            }}
          />
        )}
        {activeTab === 'howToUse' && (
          <div
            className="text-lumiere-text-secondary"
            dangerouslySetInnerHTML={{
              __html: sanitizeHtml(howToUse, '<p>No usage instructions available.</p>'),
            }}
          />
        )}
      </div>
    </div>
  );
};
