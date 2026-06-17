import type { WooProduct } from '@/lib/woo/types';

export default function HomepageProductLinks({ products }: { products: Pick<WooProduct, 'slug' | 'name'>[] }) {
  if (!products.length) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <h2 className="mb-4 text-lg font-semibold text-ink/80">Popular Korean Skincare Products in Bangladesh</h2>
      <ul className="columns-2 gap-x-6 text-sm leading-relaxed sm:columns-3">
        {products.map((p) => (
          <li key={p.slug}>
            <a href={`/shop/${p.slug}`} className="text-ink/60 hover:text-accent underline-offset-2 hover:underline">
              {p.name}
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
