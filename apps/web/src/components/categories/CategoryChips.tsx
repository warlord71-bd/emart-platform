'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Flame } from 'lucide-react';
import { useCategoryPageI18n } from './categoryPageI18n';

interface CategoryChip {
  id: number;
  name: string;
  slug: string;
  display_order?: number;
  is_trending?: boolean;
}

async function fetchCategories() {
  const response = await fetch('/api/categories/popular?limit=12&window=7d&include=is_trending', { cache: 'no-store' });
  if (!response.ok) throw new Error('Categories unavailable');
  return response.json();
}

export default function CategoryChips({ initialCategories = [] }: { initialCategories?: CategoryChip[] }) {
  const { t } = useCategoryPageI18n();
  const { data } = useQuery({
    queryKey: ['category_page.category_chips'],
    queryFn: fetchCategories,
    initialData: { categories: initialCategories },
    refetchInterval: 60_000,
  });
  const categories: CategoryChip[] = Array.isArray(data?.categories) ? data.categories : [];

  return (
    <section className="sticky top-[72px] z-20 border-b border-[var(--mb-line)] bg-[var(--mb-paper)]/95 backdrop-blur">
      <div className="mb-container overflow-x-auto py-3 mb-scrollbar-none">
        <div className="flex w-max items-center gap-2">
          <Link href="/categories" className="rounded-full bg-[var(--mb-navy)] px-4 py-2 text-sm font-bold text-white">{t('all')}</Link>
          <Link href="#popular" className="inline-flex items-center gap-1 rounded-full border border-[var(--mb-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--mb-ink)]">
            <Flame size={14} className="text-[var(--mb-pink)]" /> {t('trending')}
          </Link>
          {categories
            .slice()
            .sort((a, b) => (a.display_order || 0) - (b.display_order || 0))
            .map((category) => (
              <Link
                key={category.id}
                href={`/category/${category.slug}`}
                className="rounded-full border border-[var(--mb-line)] bg-white px-4 py-2 text-sm font-bold text-[var(--mb-ink-2)] transition hover:border-[var(--mb-pink-soft)] hover:text-[var(--mb-pink)]"
              >
                {category.name}
              </Link>
            ))}
        </div>
      </div>
    </section>
  );
}
