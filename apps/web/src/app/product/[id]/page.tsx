import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { getProduct, getProductById } from '@/lib/woocommerce';

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const product = await getLegacyProduct(params.id);
  if (!product) return {};

  return {
    title: `${product.name} | Emart`,
    description:
      product.description?.substring(0, 160) ||
      product.short_description ||
      'Premium authentic global skincare product',
    alternates: {
      canonical: `/shop/${product.slug}`,
    },
    openGraph: {
      title: product.name,
      description: product.short_description || 'Premium skincare product',
      url: `/shop/${product.slug}`,
      images: product.images?.[0]?.src ? [{ url: product.images[0].src }] : [],
    },
  };
}

export const revalidate = 3600;

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getLegacyProduct(params.id);
  if (!product) notFound();

  permanentRedirect(`/shop/${product.slug}`);
}

async function getLegacyProduct(idOrSlug: string) {
  const productId = parseInt(idOrSlug, 10);
  if (!Number.isNaN(productId) && productId.toString() === idOrSlug) {
    return getProductById(productId);
  }

  return getProduct(idOrSlug);
}
