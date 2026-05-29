import type { ProductFaqItem } from '@/lib/seo/product';

export function ProductFaqSection({ items }: { items: ProductFaqItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm md:p-6">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-ink">Frequently Asked Questions</h2>
      </div>

      <div className="space-y-3">
        {items.map((item, index) => (
          <details
            key={`${item.question}-${index}`}
            className="rounded-xl border border-hairline bg-[#faf8f5] px-4 py-3"
          >
            <summary className="cursor-pointer list-none text-sm font-semibold text-ink">
              {item.question}
            </summary>
            <p className="mt-3 text-sm leading-7 text-muted">{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
