import Image from 'next/image';
import Link from 'next/link';
import {
  BadgeCheck,
  Flame,
  PackageSearch,
  Sparkles,
  Sun,
  Tags,
} from 'lucide-react';

interface MobileCategory {
  name: string;
  slug: string;
  href?: string;
  image?: string;
}

interface MobileDiscoveryProps {
  categories: MobileCategory[];
  showChips?: boolean;
  showCategories?: boolean;
  seeAllHref?: string;
}

const QUICK_CHIPS = [
  { label: 'Sale', href: '/sale', icon: Flame },
  { label: 'New', href: '/new-arrivals', icon: Sparkles },
  { label: 'Sunscreen', href: '/category/sunscreen', icon: Sun },
  { label: 'K-Beauty', href: '/category/korean-beauty', icon: BadgeCheck },
  { label: 'Brands', href: '/brands', icon: Tags },
  { label: 'Track Order', href: '/track-order', icon: PackageSearch },
];

export function MobileDiscovery({
  categories,
  showChips = true,
  showCategories = true,
  seeAllHref = '/categories',
}: MobileDiscoveryProps) {
  const visibleCategories = categories.slice(0, 10);

  if (!showChips && (!showCategories || !visibleCategories.length)) return null;

  return (
    <section className="bg-canvas pb-2 pt-3 lg:hidden">
      <div className="max-w-full overflow-hidden">
        {showChips && (
          <div className={`${showCategories ? 'mb-3' : ''} overflow-x-auto px-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden`}>
            <div className="flex w-max gap-2">
              {QUICK_CHIPS.map(({ label, href, icon: Icon }, index) => (
                <Link
                  key={href}
                  href={href}
                  className={`group inline-flex h-10 items-center gap-2 rounded-full border px-4 text-sm font-semibold shadow-sm transition-colors ${
                    index === 0
                      ? 'border-accent/20 bg-accent text-white'
                      : 'border-hairline bg-card text-ink hover:border-accent/30 hover:bg-accent-soft'
                  }`}
                >
                  <span className={`flex h-6 w-6 items-center justify-center rounded-full ${
                    index === 0 ? 'bg-white/20' : 'bg-accent-soft text-accent'
                  }`}>
                    <Icon size={14} />
                  </span>
                  <span className="whitespace-nowrap">{label}</span>
                </Link>
              ))}
            </div>
          </div>
        )}

        {showCategories && visibleCategories.length > 0 && (
          <>
            <div className="px-4 pt-1">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <h2 className="type-section-title text-ink">
                    Top Categories
                  </h2>
                </div>
                <Link
                  href={seeAllHref}
                  className="shrink-0 rounded-full border border-hairline bg-card px-4 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
                >
                  See all
                </Link>
              </div>
            </div>

            <div className="overflow-x-auto px-3 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <div className="flex w-max gap-3.5">
                {visibleCategories.map((category) => (
                  <Link
                    key={category.slug}
                    href={category.href || `/category/${category.slug}`}
                    className="group flex h-[122px] w-[88px] flex-none flex-col items-center text-center"
                  >
                    <div className="mx-auto h-[78px] w-[78px] rounded-full bg-gradient-to-br from-accent-soft via-white to-[#edf7f2] p-1 shadow-sm ring-1 ring-hairline">
                      <div className="relative h-full w-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#fff7fb_55%,#eefcf7_100%)]">
                        {category.image ? (
                          <Image
                            src={category.image}
                            alt={`${category.name} skincare category`}
                            fill
                            sizes="78px"
                            className="object-cover contrast-[1.04] saturate-[1.08] transition-transform duration-300 group-hover:scale-105"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft to-[#edf7f2] text-xl font-black text-accent">
                            {category.name.slice(0, 1)}
                          </div>
                        )}
                      </div>
                    </div>
                    <span className="mt-2 flex min-h-[34px] items-start justify-center text-sm font-bold leading-tight text-ink">
                      {category.name}
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </section>
  );
}

export default MobileDiscovery;
