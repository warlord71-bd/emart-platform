import Link from 'next/link';

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

interface BreadcrumbsProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
  const visibleItems = items.filter((item) => item.label?.trim());

  if (visibleItems.length === 0) return null;

  return (
    <nav aria-label="Breadcrumb" className="mb-5 overflow-x-auto text-xs font-semibold text-muted">
      <ol className="flex min-w-0 items-center gap-2 whitespace-nowrap">
        {visibleItems.map((item, index) => {
          const isLast = index === visibleItems.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex min-w-0 items-center gap-2">
              {item.href && !isLast ? (
                <Link href={item.href} className="text-muted transition-colors hover:text-accent">
                  {item.label}
                </Link>
              ) : (
                <span className={isLast ? 'max-w-[58vw] truncate text-ink md:max-w-md' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast && <span className="text-gray-300" aria-hidden="true">→</span>}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
