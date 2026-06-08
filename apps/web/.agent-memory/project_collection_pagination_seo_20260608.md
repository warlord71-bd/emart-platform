# Collection Pagination SEO - 2026-06-08

Curated product-list collection pages intentionally self-canonicalize real pagination:

- `/shop?page=N`
- `/category/[slug]?page=N`
- `/sale?page=N`
- `/new-arrivals?page=N`
- `/brands/[slug]?page=N`
- `/concerns/[slug]?page=N`
- `/ingredients/[slug]?page=N`
- `/routine/[step]?page=N`
- `/origins/[country]?page=N`

Use `apps/web/src/lib/paginationSeo.ts` for this behavior. Page 1 links must stay clean, e.g. `/shop`, not `/shop?page=1`.

Do not make filtered/sorted/search variants indexable by default. Filters should remain canonicalized to the parent collection, and `/search` remains `noindex, follow`.
