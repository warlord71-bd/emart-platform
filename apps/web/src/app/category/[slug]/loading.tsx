import ProductCardSkeleton from '@/components/product/ProductCardSkeleton';

function FilterBarSkeleton() {
  return (
    <div className="mb-4 flex flex-wrap gap-2 lg:hidden">
      {[80, 64, 72, 56].map((w) => (
        <div
          key={w}
          style={{ width: `${w}px` }}
          className="h-8 animate-pulse rounded-full bg-bg-stone"
        />
      ))}
    </div>
  );
}

function SidebarSkeleton() {
  return (
    <aside className="hidden w-56 flex-shrink-0 space-y-4 lg:block">
      {[120, 88, 96, 104].map((w) => (
        <div key={w} className="space-y-2">
          <div style={{ width: `${w}px` }} className="h-3 animate-pulse rounded bg-bg-stone" />
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-7 animate-pulse rounded-lg bg-bg-stone" />
          ))}
        </div>
      ))}
    </aside>
  );
}

export default function CategoryLoading() {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto max-w-7xl px-4 py-8">
        {/* Breadcrumb */}
        <div className="mb-3 flex items-center gap-2">
          <div className="h-3 w-10 animate-pulse rounded bg-bg-stone" />
          <div className="h-3 w-1 animate-pulse rounded bg-bg-stone" />
          <div className="h-3 w-10 animate-pulse rounded bg-bg-stone" />
          <div className="h-3 w-1 animate-pulse rounded bg-bg-stone" />
          <div className="h-3 w-24 animate-pulse rounded bg-bg-stone" />
        </div>

        {/* Category title + description */}
        <div className="mb-6 border-b border-hairline pb-5">
          <div className="h-8 w-48 animate-pulse rounded bg-bg-stone" />
          <div className="mt-2 h-4 w-full max-w-xl animate-pulse rounded bg-bg-stone" />
          <div className="mt-1.5 h-4 w-3/4 max-w-lg animate-pulse rounded bg-bg-stone" />
          <div className="mt-3 h-4 w-24 animate-pulse rounded bg-bg-stone" />
        </div>

        <FilterBarSkeleton />

        <div className="flex gap-6">
          <SidebarSkeleton />

          {/* Product grid — matches grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 */}
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
              {[...Array(12)].map((_, i) => (
                <ProductCardSkeleton key={i} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
