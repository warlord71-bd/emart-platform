import Link from 'next/link';
import type { WooTag } from '@/lib/woocommerce';

interface ConcernTagsProps {
  tags: WooTag[];
}

const CONCERN_EMOJIS: Record<string, string> = {
  acne: '🔴',
  'acne-solution': '🔴',
  pore: '🔵',
  'pore-cleansing': '🔵',
  brightening: '🌙',
  'dark-spots': '🌙',
  dryness: '💧',
  'dry-sensitive': '💧',
  sensitivity: '🌿',
  sensitive: '🌿',
  'anti-aging': '✨',
  antiaging: '✨',
  clarifying: '🧪',
};

export const ConcernTags: React.FC<ConcernTagsProps> = ({ tags }) => {
  if (!tags || tags.length === 0) return null;

  // Map tags to concerns (take first 5)
  const concernTags = tags.slice(0, 5);

  return (
    <div className="py-6 border-y border-gray-200">
      <p className="text-sm font-semibold text-lumiere-text-primary mb-3">CONCERNS</p>
      <div className="flex flex-wrap gap-2">
        {concernTags.map((tag) => (
          <Link
            key={tag.id}
            href={`/shop?tag=${tag.slug}`}
            className="inline-flex items-center gap-1 px-4 py-2 bg-gray-100 hover:bg-lumiere-primary hover:text-white text-lumiere-text-primary rounded-full text-sm font-medium transition-all"
          >
            <span>{CONCERN_EMOJIS[tag.slug.toLowerCase()] || '✓'}</span>
            <span>{tag.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
