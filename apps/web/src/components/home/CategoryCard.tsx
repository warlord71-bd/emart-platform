'use client';

import Image from 'next/image';
import Link from 'next/link';
import { CategoryIllustration } from '@/components/category/CategoryIllustration';
import type { FeaturedCategory } from '@/lib/api/featured-categories';
import { useCategoryPresence } from '@/lib/realtime/presence';

export function CategoryCard({ category, index }: { category: FeaturedCategory; index: number }) {
  const viewers = useCategoryPresence(category.id);

  const badge =
    category.is_hot  ? { label: 'HOT',  cls: 'bg-[rgba(217,83,79,0.10)] text-[#D9534F]', icon: '🔥' } :
    category.has_new ? { label: 'NEW',  cls: 'bg-[rgba(212,162,72,0.15)] text-[#8C6914]', icon: null } :
    category.has_sale? { label: 'SALE', cls: 'bg-[var(--mb-pink-bg)] text-[#B33D6E]',     icon: null } :
    null;

  return (
    <Link
      href={category.href || `/category/${category.slug}`}
      className="group flex flex-col rounded-[var(--mb-radius)] border border-[var(--mb-line)] bg-white p-4 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_6px_20px_rgba(27,27,47,.08),0_1px_3px_rgba(27,27,47,.05)]"
    >
      {/* Image */}
      <div className="relative mb-3 aspect-[3/4] overflow-hidden rounded-xl bg-[var(--mb-cream)]">
        {category.hero_image ? (
          <Image
            src={category.hero_image}
            alt={category.name}
            fill
            sizes="(min-width:1024px) 200px, (min-width:640px) 33vw, 60vw"
            className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="absolute inset-0 transition-transform duration-300 group-hover:scale-[1.03]">
            <CategoryIllustration slug={category.slug} uid={category.id || index} />
          </div>
        )}

        {/* Badge — HOT / NEW / SALE */}
        {badge && (
          <span className={`absolute left-2 top-2 inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[10px] font-bold tracking-wide ${badge.cls}`}>
            {badge.icon}{badge.label}
          </span>
        )}

        {/* Live viewers chip — overlays image, never shifts layout */}
        {viewers != null && (
          <span className="absolute right-2 top-2 flex items-center gap-1.5 rounded-full bg-black/35 px-2 py-0.5 text-[10px] text-white backdrop-blur-sm">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-[var(--mb-success)]" />
            {viewers} viewing
          </span>
        )}
      </div>

      {/* Text */}
      {category.bn_name && (
        <p className="font-bn text-[11px] leading-none text-[var(--mb-ink-3)]">{category.bn_name}</p>
      )}
      <p className="mt-0.5 text-[14px] font-medium leading-snug text-[var(--mb-navy)]">{category.name}</p>
      <p className="mt-1 text-[11px] text-[var(--mb-ink-3)]">
        {category.product_count.toLocaleString()} products
      </p>
    </Link>
  );
}
