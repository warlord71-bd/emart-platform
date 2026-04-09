'use client';

import { useState } from 'react';

interface CollapsibleSectionProps {
  title: string;
  content: string;
  defaultOpen?: boolean;
}

export const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
  title,
  content,
  defaultOpen = false,
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  if (!content) return null;

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between text-left font-semibold text-lumiere-text-primary hover:text-lumiere-primary transition-colors"
      >
        <span className="text-sm md:text-base">{title}</span>
        <span className={`text-xl transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>

      {isOpen && (
        <div className="mt-4 text-sm md:text-base text-lumiere-text-secondary prose prose-sm max-w-none">
          <div
            dangerouslySetInnerHTML={{
              __html: content.replace(/\n/g, '<br />'),
            }}
          />
        </div>
      )}
    </div>
  );
};
