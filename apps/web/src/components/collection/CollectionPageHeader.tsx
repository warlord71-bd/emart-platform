import Link from 'next/link';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface CollectionPageHeaderProps {
  type: 'brand' | 'category' | 'origin';
  breadcrumbs: Breadcrumb[];
  title: string;
  description?: string;
  icon?: React.ReactNode;
  productCount: number;
  showCod?: boolean;
  showAuthentic?: boolean;
}

const TYPE_LABEL: Record<CollectionPageHeaderProps['type'], string> = {
  brand: 'Brand',
  category: 'Category',
  origin: 'Origin',
};

export default function CollectionPageHeader({
  type,
  breadcrumbs,
  title,
  description,
  icon,
  productCount,
  showCod = true,
  showAuthentic = true,
}: CollectionPageHeaderProps) {
  return (
    <section className="border-b border-hairline pb-5 mb-5">
      {/* Breadcrumb */}
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-sm text-muted" aria-label="Breadcrumb">
        {breadcrumbs.map((crumb, i) => (
          <span key={i} className="flex items-center gap-1.5">
            {i > 0 && <span aria-hidden="true" className="text-muted-2">/</span>}
            {crumb.href ? (
              <Link href={crumb.href} className="transition-colors hover:text-accent">
                {crumb.label}
              </Link>
            ) : (
              <span className="font-medium text-ink">{crumb.label}</span>
            )}
          </span>
        ))}
      </nav>

      {/* Type label */}
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-accent">
        {TYPE_LABEL[type]}
      </p>

      {/* Main header row */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        {/* Left: icon + title + description */}
        <div className="flex items-start gap-4">
          {icon && (
            <div className="flex-shrink-0 mt-0.5">
              {icon}
            </div>
          )}
          <div className="min-w-0">
            <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {title}
            </h1>
            {description && (
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {description}
              </p>
            )}
          </div>
        </div>

        {/* Right: stat + trust chips */}
        <div className="flex flex-shrink-0 flex-wrap items-center gap-2 text-xs font-semibold text-muted">
          {productCount > 0 && (
            <span className="rounded-full border border-hairline bg-bg-alt px-3 py-1.5">
              {productCount.toLocaleString()} product{productCount === 1 ? '' : 's'}
            </span>
          )}
          {showAuthentic && (
            <span className="rounded-full border border-hairline bg-bg-alt px-3 py-1.5">
              Authentic
            </span>
          )}
          {showCod && (
            <span className="rounded-full border border-hairline bg-bg-alt px-3 py-1.5">
              COD
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
