'use client';

interface ChatProduct {
  name: string;
  slug: string;
  price: string;
  brand?: string;
  image?: string;
  stock_status?: string;
}

export default function ChatProductCard({ product }: { product: ChatProduct }) {
  const outOfStock = product.stock_status === 'outofstock';

  return (
    <a
      href={`/shop/${product.slug}`}
      className="flex gap-3 rounded-xl border border-gray-200 bg-white p-2 transition-colors hover:border-primary-500/40"
    >
      {product.image ? (
        <img
          src={product.image}
          alt={product.name}
          width={56}
          height={56}
          className="h-14 w-14 shrink-0 rounded-lg object-cover"
          loading="lazy"
        />
      ) : (
        <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-xs text-gray-400">
          No img
        </span>
      )}

      <div className="flex min-w-0 flex-1 flex-col justify-center">
        <p className="truncate text-xs font-medium text-gray-800">{product.name}</p>
        {product.brand && (
          <p className="truncate text-[11px] text-gray-400">{product.brand}</p>
        )}
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-xs font-semibold text-primary-500">{product.price}</span>
          {outOfStock && (
            <span className="rounded bg-red-50 px-1.5 py-0.5 text-[10px] text-red-500">
              Out of stock
            </span>
          )}
        </div>
      </div>
    </a>
  );
}
