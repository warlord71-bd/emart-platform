export default function ProductCardSkeleton() {
  return (
    <div className="card flex h-full flex-col p-2 sm:p-3">
      {/* Image — matches aspect-square product-img-wrap */}
      <div className="aspect-square w-full animate-pulse rounded-[14px] bg-bg-stone" />

      <div className="flex flex-1 flex-col px-1 pb-1 pt-3">
        {/* Eyebrow / brand */}
        <div className="h-2.5 w-14 animate-pulse rounded bg-bg-stone" />
        {/* Product name — 2 lines */}
        <div className="mt-2 h-3.5 w-full animate-pulse rounded bg-bg-stone" />
        <div className="mt-1.5 h-3.5 w-4/5 animate-pulse rounded bg-bg-stone" />
        {/* Price */}
        <div className="mt-auto pt-4">
          <div className="h-5 w-20 animate-pulse rounded bg-bg-stone" />
        </div>
      </div>

      {/* Add to cart button */}
      <div className="px-1 pb-1 pt-2">
        <div className="h-10 w-full animate-pulse rounded-xl bg-bg-stone" />
      </div>
    </div>
  );
}
