import Link from 'next/link';
import { CollectionDescription } from './CollectionDescription';

export interface Breadcrumb {
  label: string;
  href?: string;
}

interface CollectionPageHeaderProps {
  type: 'brand' | 'category' | 'origin' | 'concern' | 'ingredient' | 'routine';
  breadcrumbs: Breadcrumb[];
  title: string;
  description?: string;
  icon?: React.ReactNode;
  productCount: number;
  showCod?: boolean;
  showAuthentic?: boolean;
}

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

      {/* Main header row */}
      <div className="flex items-start gap-4">
        {icon && (
          <div className="flex-shrink-0 mt-0.5">
            {icon}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <h1 className="text-2xl font-bold leading-tight text-ink sm:text-3xl">
              {title}
            </h1>
            <div className="flex flex-wrap items-center gap-2 text-xs font-semibold text-muted">
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
          {description && <CollectionDescription text={description} />}
        </div>
      </div>
    </section>
  );
}
