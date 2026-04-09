import { getProductById } from '@/lib/woocommerce';
import Link from 'next/link';

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

  const imageUrl = product.images && product.images[0] ? (typeof product.images[0] === 'string' ? product.images[0] : product.images[0].src) : null;

  return (
    <div className="min-h-screen bg-white py-8 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-sm text-lumiere-text-secondary mb-6">
          <Link href="/shop" className="hover:text-lumiere-primary">Shop</Link> / {product.name}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-lumiere-background rounded-lg p-6">
            {imageUrl ? (
              <img src={imageUrl} alt={product.name} className="w-full rounded-lg" />
            ) : (
              <div className="w-full h-96 bg-gray-200 rounded flex items-center justify-center">No image</div>
            )}
          </div>

          <div>
            <p className="text-sm text-lumiere-text-secondary mb-2">'Brand'</p>
            <h1 className="text-2xl font-bold text-lumiere-text-primary mb-2">{product.name}</h1>
            <p className="text-3xl font-bold text-lumiere-primary mb-4">${product.price}</p>
            <p className="text-gray-600 mb-6">{product.description}</p>
            <button className="w-full bg-lumiere-primary text-white py-3 rounded-lg font-semibold hover:bg-lumiere-primary-hover transition">
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
