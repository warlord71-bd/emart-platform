import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LayoutGrid, Sparkles } from 'lucide-react';
import type { Metadata } from 'next';
import { getCategories } from '@/lib/woocommerce';
import { MENU_CATEGORY_GROUPS, TOP_CATEGORY_IMAGE_OVERRIDES } from '@/lib/category-navigation';
import { canonicalPath } from '@/lib/canonicalUrl';

export function generateMetadata({ searchParams }: { searchParams?: Record<string, string | string[]> }): Metadata {
  return {
    title: 'All Categories — Emart Skincare Bangladesh',
    description: 'Browse all Emart skincare, hair care, body care, makeup, and skin concern categories from one easy page.',
    alternates: { canonical: canonicalPath('/categories', searchParams) },
  };
}

export const dynamic = 'force-dynamic';
export const revalidate = 3600;

export default async function CategoriesPage() {
  let allCategories: Awaited<ReturnType<typeof getCategories>> = [];
  try {
    allCategories = await getCategories({ per_page: 100, hide_empty: true });
  } catch {
    // WooCommerce API unreachable — render page structure without live category data
  }
  const categoriesBySlug = new Map(allCategories.map((category) => [category.slug, category]));

  const categoryCount = MENU_CATEGORY_GROUPS.reduce((total, group) => total + group.items.length, 0);

  return (
    <main className="bg-canvas">
      <section className="border-b border-hairline bg-gradient-to-br from-accent-soft via-white to-[#edf7f2] px-4 py-10">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-3xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-card px-4 py-2 text-sm font-bold text-accent shadow-sm ring-1 ring-hairline">
              <LayoutGrid size={16} />
              {categoryCount} menu categories
            </div>
            <h1 className="text-3xl font-extrabold tracking-wide text-ink md:text-5xl">
              Shop All Categories
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-muted md:text-base">
              Find every category from the main menu in one place. Tap a category to open its product page directly.
            </p>
          </div>

          <nav className="mt-7 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden" aria-label="Category groups">
            {MENU_CATEGORY_GROUPS.map((group) => (
              <a
                key={group.anchor}
                href={`#${group.anchor}`}
                className="shrink-0 rounded-full border border-hairline bg-card px-4 py-2 text-sm font-bold text-ink shadow-sm transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
              >
                {group.title}
              </a>
            ))}
          </nav>
        </div>
      </section>

      <section className="px-4 py-8">
        <div className="mx-auto grid max-w-7xl gap-9">
          {MENU_CATEGORY_GROUPS.map((group) => (
            <div key={group.anchor} id={group.anchor} className="scroll-mt-28">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.22em] text-accent">
                    <Sparkles size={14} />
                    {group.items.length} categories
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-ink md:text-3xl">
                    {group.title}
                  </h2>
                  <p className="mt-1 text-sm text-muted">{group.description}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                {group.items.map((item) => {
                  const category = categoriesBySlug.get(item.slug);
                  const image = TOP_CATEGORY_IMAGE_OVERRIDES[item.slug] || category?.image?.src;
                  const count = category?.count || 0;

                  return (
                    <Link
                      key={item.slug}
                      href={`/category/${item.slug}`}
                      className="group min-w-0 rounded-2xl border border-hairline bg-card p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/25 hover:shadow-card"
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-accent-soft via-white to-[#edf7f2] p-1 ring-1 ring-hairline">
                          <div className="relative h-full w-full overflow-hidden rounded-full bg-[#fbf7f1]">
                            {image ? (
                              <Image
                                src={image}
                                alt={`${item.name} category`}
                                fill
                                sizes="56px"
                                className="object-cover transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center text-lg font-black text-accent">
                                {item.name.slice(0, 1)}
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="line-clamp-2 text-sm font-extrabold leading-snug text-ink">
                            {item.name}
                          </h3>
                          <p className="mt-1 text-xs text-muted">
                            {count > 0 ? `${count} products` : 'Browse category'}
                          </p>
                        </div>
                        <ArrowRight size={16} className="shrink-0 text-gray-300 transition-colors group-hover:text-accent" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
