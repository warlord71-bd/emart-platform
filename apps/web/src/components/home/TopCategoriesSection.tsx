import Image from 'next/image';
import Link from 'next/link';

interface TopCategory {
  name: string;
  slug: string;
  href?: string;
  image?: string;
}

interface TopCategoriesSectionProps {
  categories: TopCategory[];
  className?: string;
  seeAllHref?: string;
  title?: string | null;
}

export function TopCategoriesSection({
  categories,
  className = '',
  seeAllHref = '/categories',
  title = 'Top Categories',
}: TopCategoriesSectionProps) {
  if (!categories.length) return null;

  return (
    <section className={`bg-canvas px-3 py-5 sm:px-4 sm:py-6 md:py-7 ${className}`}>
      <div className="mx-auto max-w-6xl">
        {(title || seeAllHref) && (
          <div className={`mb-5 flex items-end gap-4 ${title ? 'justify-between' : 'justify-end'}`}>
            {title && (
              <h2 className="type-section-title text-ink">
                {title}
              </h2>
            )}
            {seeAllHref && (
              <Link
                href={seeAllHref}
                className="rounded-full border border-hairline bg-card px-5 py-2 text-sm font-semibold text-ink shadow-sm transition-colors hover:border-accent/30 hover:bg-accent-soft hover:text-accent"
              >
                See all
              </Link>
            )}
          </div>
        )}

        <div className="flex items-start justify-start gap-2.5 overflow-x-auto pb-1 [scrollbar-width:none] sm:gap-7 xl:gap-8 [&::-webkit-scrollbar]:hidden">
          {categories.map((category) => (
            <Link
              key={category.slug}
              href={category.href || `/category/${category.slug}`}
              className="group flex h-[122px] w-[84px] flex-none flex-col items-center text-center sm:h-[156px] sm:w-[120px]"
            >
              <div className="mx-auto h-[76px] w-[76px] rounded-full bg-gradient-to-br from-accent-soft via-white to-[#edf7f2] p-1 shadow-sm ring-1 ring-hairline transition-transform duration-300 group-hover:-translate-y-1 sm:h-[112px] sm:w-[112px]">
                <div className="relative h-full w-full overflow-hidden rounded-full bg-[radial-gradient(circle_at_50%_42%,#ffffff_0%,#fff7fb_55%,#eefcf7_100%)]">
                  {category.image ? (
                    <div className="absolute inset-2 sm:inset-2.5">
                      <Image
                        src={category.image}
                        alt={`${category.name} skincare category`}
                        fill
                        sizes="(min-width: 640px) 112px, 76px"
                        className="object-contain contrast-[1.04] saturate-[1.08] transition-transform duration-300 group-hover:scale-[1.03]"
                      />
                    </div>
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-soft to-[#edf7f2] text-2xl font-black text-accent sm:text-3xl">
                      {category.name.slice(0, 1)}
                    </div>
                  )}
                </div>
              </div>
              <span className="mt-2 flex min-h-[34px] items-start justify-center text-[13px] font-bold leading-tight text-ink sm:mt-3 sm:min-h-[40px] sm:text-[15px]">
                {category.name}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

export default TopCategoriesSection;
