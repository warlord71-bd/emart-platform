import { getProductById } from '@/lib/woocommerce';
import Link from 'next/link';
import Image from 'next/image';

interface ProductPageProps {
  params: { id: string };
}

export async function generateMetadata({ params }: ProductPageProps) {
  const product = await getProductById(parseInt(params.id));
  return {
    title: `${product?.name || 'Product'} | Emart`,
    description: product?.description?.substring(0, 160) || 'Premium K-Beauty product',
  };
}

export const revalidate = 3600;

export default async function ProductPage({ params }: ProductPageProps) {
  const product = await getProductById(parseInt(params.id));

  if (!product) {
    return (
      <div className="min-h-screen bg-lumiere-background py-12 px-4">
        <div className="max-w-7xl mx-auto text-center">
          <h1 className="text-3xl font-bold mb-4">Product Not Found</h1>
          <Link href="/shop" className="text-lumiere-primary hover:underline">Back to Shop</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-sm text-lumiere-text-secondary mb-6">
          <Link href="/shop" className="hover:text-lumiere-primary">Shop</Link> / {product.name}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-lumiere-background rounded-lg p-6">
            {product.images && product.images[0] ? (
              <Image src={product.images[0]} alt={product.name} width={400} height={400} className="w-full" />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center">No image</div>
            )}
          </div>

          <div>
            <p className="text-sm text-lumiere-text-secondary mb-2">{product.brand || 'Brand'}</p>
            <h1 className="text-3xl font-serif font-bold text-lumiere-text-primary mb-4">{product.name}</h1>
            
            <div className="mb-6">
              <p className="text-3xl font-bold text-lumiere-primary">৳{product.price}</p>
              {product.regularPrice && (
                <p className="text-lg text-lumiere-text-secondary line-through">৳{product.regularPrice}</p>
              )}
            </div>

            {product.rating && (
              <div className="mb-6">
                <p className="text-sm">⭐ {product.rating} ({product.reviewCount || 0} reviews)</p>
              </div>
            )}

            {product.description && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold mb-2">About</h2>
                <p className="text-lumiere-text-secondary">{product.description}</p>
              </div>
            )}

            <div className="flex gap-4">
              <button className="flex-1 bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold py-3 rounded-lg transition">
                Add to Cart
              </button>
              <button className="px-6 border-2 border-lumiere-primary text-lumiere-primary hover:bg-lumiere-primary-light rounded-lg transition">
                ♡
              </button>
            </div>

            <div className="mt-8 pt-8 border-t border-lumiere-border-light">
              <p className="text-sm font-semibold text-lumiere-text-primary mb-3">Why Choose Emart?</p>
              <div className="space-y-2 text-sm text-lumiere-text-secondary">
                <p>✅ 100% Authentic</p>
                <p>🚚 Fast Delivery</p>
                <p>💵 COD Available</p>
                <p>↩️ Easy Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
