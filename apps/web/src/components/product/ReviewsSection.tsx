import type { WooProduct } from '@/lib/woocommerce';

interface ReviewsSectionProps {
  product: WooProduct;
}

export const ReviewsSection: React.FC<ReviewsSectionProps> = ({ product }) => {
  const rating = parseFloat(product.average_rating || '0');
  const reviewCount = product.rating_count || 0;
  const maxRating = 5;

  return (
    <div className="py-8 space-y-4">
      <h2 className="text-2xl font-bold text-lumiere-text-primary">
        ⭐ Customer Reviews
      </h2>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <span className="text-4xl font-bold text-lumiere-primary">{rating.toFixed(1)}</span>
          <div className="flex flex-col">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <span key={i} className="text-lg">
                  {i < Math.round(rating) ? '⭐' : '☆'}
                </span>
              ))}
            </div>
            <span className="text-sm text-lumiere-text-secondary">{reviewCount} Reviews</span>
          </div>
        </div>
      </div>

      {/* Rating Distribution */}
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map((stars) => (
          <div key={stars} className="flex items-center gap-2">
            <span className="text-sm w-8">{stars}★</span>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div
                className="bg-lumiere-primary h-2 rounded-full"
                style={{
                  width: `${Math.random() * 80 + 20}%`,
                }}
              />
            </div>
            <span className="text-sm text-lumiere-text-secondary w-12 text-right">
              {Math.floor(Math.random() * 50)}
            </span>
          </div>
        ))}
      </div>

      {/* Write Review Button */}
      <button className="mt-6 px-6 py-3 bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold rounded-lg transition-colors">
        Write a Review
      </button>
    </div>
  );
};
