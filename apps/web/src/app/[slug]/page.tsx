// Root catch-all redirect — ensures products and blog posts are served from
// their canonical URLs (/shop/[slug] and /blog/[slug]) rather than the root path.
// This resolves "Duplicate, Google chose different canonical than user" in GSC.
import { notFound, permanentRedirect } from 'next/navigation';
import { getProduct } from '@/lib/woocommerce';
import { getWordPressPostBySlug } from '@/lib/wordpress-posts';

interface Props {
  params: { slug: string };
}

export const revalidate = 3600;
export const dynamicParams = true;

export async function generateStaticParams() {
  return [];
}

export default async function RootSlugRedirect({ params }: Props) {
  // Products are canonical at /shop/[slug]
  const product = await getProduct(params.slug).catch(() => null);
  if (product) permanentRedirect(`/shop/${product.slug}`);

  // Blog posts are canonical at /blog/[slug]
  const post = await getWordPressPostBySlug(params.slug).catch(() => null);
  if (post) permanentRedirect(`/blog/${post.slug}`);

  notFound();
}
