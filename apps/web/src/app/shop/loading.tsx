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

export default function ShopLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      {/* Header */}
      <div className="mb-6 border-b border-hairline pb-5">
        <div className="h-7 w-56 animate-pulse rounded bg-bg-stone" />
        <div className="mt-2 h-4 w-32 animate-pulse rounded bg-bg-stone" />
      </div>

      <FilterBarSkeleton />

      <div className="flex gap-6">
        <SidebarSkeleton />

        {/* Product grid — matches grid-cols-2 on mobile, 3 on sm, 4 on xl */}
        <div className="flex-1">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <ProductCardSkeleton key={i} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
