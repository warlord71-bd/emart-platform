import Link from 'next/link';
import { getPaginationHref, type PaginationQueryValue } from '@/lib/paginationSeo';

type NumberedPaginationProps = {
  basePath: string;
  currentPage: number;
  totalPages: number;
  searchParams?: Record<string, PaginationQueryValue>;
};

type PaginationItem = number | 'ellipsis-start' | 'ellipsis-end';

function getPaginationItems(currentPage: number, totalPages: number): PaginationItem[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  const pages = new Set<number>([1, totalPages, currentPage - 1, currentPage, currentPage + 1]);

  if (currentPage <= 4) {
    pages.add(2);
    pages.add(3);
    pages.add(4);
    pages.add(5);
  }

  if (currentPage >= totalPages - 3) {
    pages.add(totalPages - 4);
    pages.add(totalPages - 3);
    pages.add(totalPages - 2);
    pages.add(totalPages - 1);
  }

  const sortedPages = Array.from(pages)
    .filter((page) => page >= 1 && page <= totalPages)
    .sort((a, b) => a - b);

  const items: PaginationItem[] = [];
  sortedPages.forEach((page, index) => {
    const previous = sortedPages[index - 1];
    if (previous && page - previous > 1) {
      items.push(previous === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(page);
  });

  return items;
}

export function NumberedPagination({
  basePath,
  currentPage,
  totalPages,
  searchParams,
}: NumberedPaginationProps) {
  if (totalPages <= 1) return null;

  const safeCurrentPage = Math.min(Math.max(currentPage, 1), totalPages);
  const items = getPaginationItems(safeCurrentPage, totalPages);
  const buttonBase =
    'inline-flex h-10 min-w-10 items-center justify-center rounded-md border px-3 text-sm font-semibold transition-colors';
  const inactiveClass =
    'border-hairline bg-white text-ink hover:border-accent/40 hover:bg-accent-soft hover:text-accent';
  const activeClass = 'border-ink bg-ink text-white';

  return (
    <nav className="mt-10 flex justify-center" aria-label="Product list pagination">
      <div className="flex max-w-full flex-wrap items-center justify-center gap-1.5">
        {safeCurrentPage > 1 && (
          <Link
            href={getPaginationHref(basePath, searchParams, safeCurrentPage - 1)}
            className={`${buttonBase} ${inactiveClass}`}
            rel="prev"
          >
            Previous
          </Link>
        )}

        {items.map((item) =>
          typeof item === 'number' ? (
            item === safeCurrentPage ? (
              <span
                key={item}
                className={`${buttonBase} ${activeClass}`}
                aria-current="page"
              >
                {item}
              </span>
            ) : (
              <Link
                key={item}
                href={getPaginationHref(basePath, searchParams, item)}
                className={`${buttonBase} ${inactiveClass}`}
                aria-label={`Go to page ${item}`}
              >
                {item}
              </Link>
            )
          ) : (
            <span key={item} className="inline-flex h-10 min-w-8 items-center justify-center text-sm font-semibold text-muted">
              ...
            </span>
          )
        )}

        {safeCurrentPage < totalPages && (
          <Link
            href={getPaginationHref(basePath, searchParams, safeCurrentPage + 1)}
            className={`${buttonBase} ${inactiveClass}`}
            rel="next"
          >
            Next
          </Link>
        )}
      </div>
    </nav>
  );
}
