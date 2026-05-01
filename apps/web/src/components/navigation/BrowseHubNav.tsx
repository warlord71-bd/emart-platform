import Link from 'next/link';
import { Tags } from 'lucide-react';
import { UNIFIED_BROWSE_TREE } from '@/lib/category-navigation';

const HUBS = [
  ...UNIFIED_BROWSE_TREE.map((group) => ({
    label: group.label.replace('SHOP BY ', ''),
    href: group.href,
  })),
  { label: 'BRANDS', href: '/brands' },
];

export function BrowseHubNav({ active }: { active: 'categories' | 'concerns' | 'origins' | 'brands' }) {
  return (
    <nav className="border-b border-hairline bg-white/95 backdrop-blur" aria-label="Browse hubs">
      <div className="mx-auto max-w-7xl overflow-x-auto px-4 py-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <div className="flex w-max items-center gap-2">
          {HUBS.map((hub) => {
            const key = hub.href.slice(1) || 'categories';
            const selected = key === active;
            return (
              <Link
                key={hub.href}
                href={hub.href}
                aria-current={selected ? 'page' : undefined}
                className={`inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-extrabold transition ${
                  selected
                    ? 'border-ink bg-ink text-white'
                    : 'border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft hover:text-accent'
                }`}
              >
                {hub.href === '/brands' ? <Tags size={15} /> : null}
                {hub.label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
