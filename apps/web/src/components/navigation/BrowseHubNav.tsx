import Link from 'next/link';

const TABS = [
  { key: 'categories', label: 'Categories', href: '/categories' },
  { key: 'concerns', label: 'Concerns', href: '/concerns' },
  { key: 'ingredients', label: 'Ingredients', href: '/ingredients' },
  { key: 'origins', label: 'Origins', href: '/origins' },
  { key: 'brands', label: 'Brands', href: '/brands' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export function BrowseHubNav({ active }: { active: TabKey }) {
  return (
    <nav className="mx-auto max-w-7xl px-4 pt-6 pb-2">
      <div className="flex gap-1.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {TABS.map((tab) => (
          <Link
            key={tab.key}
            href={tab.href}
            aria-current={tab.key === active ? 'page' : undefined}
            className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
              tab.key === active
                ? 'bg-ink text-white'
                : 'bg-bg-alt text-muted hover:bg-accent-soft hover:text-accent'
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </nav>
  );
}
