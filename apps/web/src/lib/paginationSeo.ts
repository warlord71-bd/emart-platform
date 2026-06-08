import { absoluteUrl } from '@/lib/siteUrl';

export type PaginationQueryValue = string | string[] | undefined;

export function getValidPage(value?: PaginationQueryValue): number {
  const rawValue = Array.isArray(value) ? value[0] : value;
  const page = Number.parseInt(rawValue || '1', 10);
  return Number.isFinite(page) && page > 1 ? page : 1;
}

export function getPaginatedPath(basePath: string, page: number): string {
  return page > 1 ? `${basePath}?page=${page}` : basePath;
}

export function getPaginatedCanonical(basePath: string, page: number): string {
  return absoluteUrl(getPaginatedPath(basePath, page));
}

export function getPaginatedTitle(baseTitle: string, page: number): string {
  return page > 1 ? `${baseTitle} - Page ${page}` : baseTitle;
}

export function getPaginationHref(
  basePath: string,
  searchParams: Record<string, PaginationQueryValue> | undefined,
  targetPage: number,
): string {
  const params = new URLSearchParams();

  Object.entries(searchParams || {}).forEach(([key, value]) => {
    if (key === 'page') return;

    const values = Array.isArray(value) ? value : [value];
    values.forEach((entry) => {
      if (entry) params.append(key, entry);
    });
  });

  if (targetPage > 1) params.set('page', String(targetPage));

  const query = params.toString();
  return query ? `${basePath}?${query}` : basePath;
}
