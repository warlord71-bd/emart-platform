import type { Metadata } from 'next';
import Link from 'next/link';
import { INGREDIENT_DEFINITIONS } from '@/lib/ingredients';
import { absoluteUrl } from '@/lib/siteUrl';
import { BrowseHubNav } from '@/components/navigation/BrowseHubNav';

export const metadata: Metadata = {
  title: { absolute: 'Shop By Star Ingredient | Emart Skincare Bangladesh' },
  description: 'Browse authentic skincare by star ingredient — Niacinamide, Retinol, Hyaluronic Acid, Vitamin C, Snail Mucin and more. Original products, COD available.',
  alternates: { canonical: absoluteUrl('/ingredients') },
  robots: { index: true, follow: true },
};

export default function IngredientsPage() {
  return (
    <div className="min-h-screen bg-bg">
      <BrowseHubNav active="ingredients" />

      <div className="border-b border-hairline bg-card">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <p className="mb-1 text-xs font-semibold uppercase tracking-[0.2em] text-accent">Shop By</p>
          <h1 className="text-3xl font-extrabold text-ink md:text-4xl">Star Ingredients</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Find skincare products by the active ingredients that matter most — from K-beauty staples
            like snail mucin and centella to science-backed actives like niacinamide and retinol.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {INGREDIENT_DEFINITIONS.map((ing) => (
            <Link
              key={ing.slug}
              href={`/ingredients/${ing.slug}`}
              className="group flex flex-col rounded-xl border border-hairline bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-accent/30 hover:shadow-card"
            >
              <span className="mb-3 text-2xl">{ing.icon}</span>
              <span className="text-sm font-bold text-ink group-hover:text-accent">{ing.label}</span>
              <span className="mt-1 line-clamp-2 text-xs leading-5 text-muted">{ing.description}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
