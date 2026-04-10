'use client';

import { useState } from 'react';

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
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex gap-2 md:gap-4 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`px-4 md:px-6 py-3 font-semibold text-sm md:text-base transition-colors ${
              activeTab === tab.id
                ? 'text-white bg-lumiere-text-primary rounded-t-lg'
                : 'text-lumiere-text-secondary hover:text-lumiere-text-primary'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="py-6 prose prose-sm max-w-none">
        {activeTab === 'description' && (
          <div
            className="text-lumiere-text-secondary"
            dangerouslySetInnerHTML={{
              __html: description || '<p>No description available.</p>',
            }}
          />
        )}
        {activeTab === 'ingredients' && (
          <div
            className="text-lumiere-text-secondary"
            dangerouslySetInnerHTML={{
              __html: ingredients || '<p>No ingredients information available.</p>',
            }}
          />
        )}
        {activeTab === 'howToUse' && (
          <div
            className="text-lumiere-text-secondary"
            dangerouslySetInnerHTML={{
              __html: howToUse || '<p>No usage instructions available.</p>',
            }}
          />
        )}
      </div>
    </div>
  );
};
