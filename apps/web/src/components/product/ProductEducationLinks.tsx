import Link from 'next/link';
import type { WooProduct } from '@/lib/woocommerce';
import { CONCERN_DEFINITIONS, getConcernHref } from '@/lib/concerns';
import { INGREDIENT_DEFINITIONS, getIngredientHref } from '@/lib/ingredients';

type ProductEducationLinksProps = {
  product: WooProduct;
  ingredientsHtml: string;
};

type LinkItem = {
  href: string;
  label: string;
};

const CONCERN_SLUG_ALIASES: Record<string, string> = {
  'acne-blemish': 'acne-blemish-care',
  'hyperpigmentation': 'melasma',
  'pores-blackheads': 'pores-oil-control',
};

function decodeEntities(value: string): string {
  return value
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;|&apos;/gi, "'")
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>');
}

function normalizeText(value: string): string {
  return decodeEntities(value)
    .replace(/<[^>]*>/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function hasTerm(source: string, term: string): boolean {
  const normalizedTerm = normalizeText(term);
  if (!source || !normalizedTerm) return false;

  return new RegExp(`(^|[^a-z0-9])${escapeRegExp(normalizedTerm)}([^a-z0-9]|$)`, 'i').test(source);
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getIngredientSource(product: WooProduct, ingredientsHtml: string): string {
  const attributeText = (product.attributes || [])
    .filter((attribute) => /ingredient/i.test(attribute.name))
    .flatMap((attribute) => attribute.options || [])
    .join(' ');

  return normalizeText(`${ingredientsHtml} ${attributeText}`);
}

function getIngredientLinks(product: WooProduct, ingredientsHtml: string): LinkItem[] {
  const source = getIngredientSource(product, ingredientsHtml);

  return INGREDIENT_DEFINITIONS
    .filter((ingredient) =>
      [ingredient.label, ingredient.slug, ...ingredient.searchKeywords].some((term) => hasTerm(source, term))
    )
    .map((ingredient) => ({
      href: getIngredientHref(ingredient.slug),
      label: ingredient.label,
    }))
    .slice(0, 8);
}

function getConcernLinks(product: WooProduct): LinkItem[] {
  const definitionsBySlug = new Map(CONCERN_DEFINITIONS.map((concern) => [concern.slug, concern]));
  const seen = new Set<string>();

  return (product.concern_terms || [])
    .map((term) => CONCERN_SLUG_ALIASES[term.slug] || term.slug)
    .map((slug) => definitionsBySlug.get(slug))
    .filter((concern): concern is NonNullable<typeof concern> => Boolean(concern))
    .filter((concern) => {
      if (seen.has(concern.slug)) return false;
      seen.add(concern.slug);
      return true;
    })
    .map((concern) => ({
      href: getConcernHref(concern.slug),
      label: concern.label,
    }))
    .slice(0, 6);
}

function LinkGroup({ title, items }: { title: string; items: LinkItem[] }) {
  if (items.length === 0) return null;

  return (
    <div>
      <h3 className="text-sm font-extrabold uppercase tracking-normal text-ink">{title}</h3>
      <div className="mt-3 flex flex-wrap gap-2">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-full border border-hairline bg-white px-3 py-1.5 text-sm font-semibold text-muted transition-colors hover:border-accent/40 hover:bg-accent-soft hover:text-accent"
          >
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}

export function ProductEducationLinks({ product, ingredientsHtml }: ProductEducationLinksProps) {
  const ingredientLinks = getIngredientLinks(product, ingredientsHtml);
  const concernLinks = getConcernLinks(product);

  if (ingredientLinks.length === 0 && concernLinks.length === 0) return null;

  return (
    <section className="rounded-lg border border-hairline bg-bg-alt p-4 sm:p-5" aria-labelledby="product-education-links-title">
      <div className="mb-4">
        <h2 id="product-education-links-title" className="text-base font-extrabold text-ink">
          Learn about this formula
        </h2>
        <p className="mt-1 text-sm text-muted">
          Ingredient and concern guides to help compare this product with your routine.
        </p>
      </div>
      <div className="grid gap-5 md:grid-cols-2">
        <LinkGroup title="Ingredients" items={ingredientLinks} />
        <LinkGroup title="Skin concerns" items={concernLinks} />
      </div>
    </section>
  );
}
