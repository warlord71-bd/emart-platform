import { getCategories } from '@/lib/woocommerce';
import Link from 'next/link';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Shop By Brands | Emart Skincare Bangladesh',
  description: 'Browse all Korean & Japanese beauty brands at Emart. COSRX, Laneige, ISNTREE, and more authentic K-beauty brands.',
};

export const revalidate = 3600;

// Mock brands data - in production this would come from WooCommerce
const BRANDS = [
  'ACWELL', 'ANUA', 'AESENCIA', 'APLE', 'ABR', 'AROMATICA', 'ATOMY', 'AMKEY',
  'BANILA CO', 'BEAUTY OF JOSEON', 'BENTON', 'BY WISHTREND',
  'CARENEL', 'CELMAX', 'COXII', 'COSRX', 'CERMAPAH', 'COMMOGLABS', 'COSDE BEMA',
  'DERMA E', 'DR.ALTHEA', 'DECURACILE', 'DE.JART+',
  'ESQIULBERRY', 'ERUDE HOUSE',
  'FARM STAY',
  'GOODAL', 'GLOW RECIPE',
  'HABIBUHU WACHIER', 'HADA LABO',
  'ISNTREE', 'IOPE',
  'JMSOLUTION',
  'KEENWELL',
  'LANEIGE', 'LAVER',
  'MIZON', 'MAYBELLINE',
  'NEOGEN',
  'PURITO',
  'ROUNDLAB',
  'SKIN1004',
  'SOONJUNG',
  'TORREBLUEE',
  'UNNYUL',
  'VICHY',
  'WISH FORMULA',
  'YESSTYLE',
  'SOME BY MI',
];

function groupBrandsByLetter(brands: string[]): Record<string, string[]> {
  const grouped: Record<string, string[]> = {};

  brands.sort().forEach((brand) => {
    const letter = brand.charAt(0).toUpperCase();
    if (!grouped[letter]) {
      grouped[letter] = [];
    }
    grouped[letter].push(brand);
  });

  return grouped;
}

export default function BrandsPage() {
  const groupedBrands = groupBrandsByLetter(BRANDS);
  const letters = Object.keys(groupedBrands).sort();

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-pink-50 to-purple-50 py-8 px-4">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl md:text-4xl font-bold text-navy-950 mb-2">
            Shop by Brands
          </h1>
          <p className="text-gray-600">
            Browse {BRANDS.length}+ authentic Korean & Japanese beauty brands
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-12">
        {/* Quick Index Grid */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-navy-950 mb-4">Quick Index</h2>
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
            {letters.map((letter) => (
              <a
                key={letter}
                href={`#section-${letter}`}
                className="bg-gray-100 hover:bg-pink-500 hover:text-white text-center py-3 px-2 rounded-lg font-semibold text-sm transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>

        {/* Alphabetical Listing */}
        <div className="space-y-8">
          {letters.map((letter) => (
            <div
              key={letter}
              id={`section-${letter}`}
              className="border-b border-gray-200 pb-8 last:border-b-0"
            >
              {/* Letter Header */}
              <h3 className="text-xl font-bold text-navy-950 mb-4 flex items-center gap-2">
                <span className="w-8 h-8 bg-pink-500 text-white rounded-full flex items-center justify-center text-sm">
                  {letter}
                </span>
              </h3>

              {/* Brands Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {groupedBrands[letter].map((brand) => (
                  <Link
                    key={brand}
                    href={`/shop?brand=${encodeURIComponent(brand)}`}
                    className="bg-white border border-gray-200 hover:border-pink-500 hover:shadow-md rounded-lg p-4 text-center transition-all group"
                  >
                    <div className="text-sm font-semibold text-navy-950 group-hover:text-pink-500 transition-colors line-clamp-2">
                      {brand}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Total Brands Section */}
        <div className="mt-12 bg-gradient-to-r from-pink-50 to-purple-50 rounded-lg p-8 text-center">
          <div className="text-sm font-semibold text-gray-600 mb-2">Total Brands</div>
          <div className="text-4xl font-bold text-pink-500 mb-4">{BRANDS.length}+</div>
          <p className="text-gray-600 mb-6">
            Authentic Korean & Japanese skincare brands curated for Bangladesh
          </p>
          <Link
            href="/shop"
            className="inline-block bg-pink-500 hover:bg-pink-600 text-white font-semibold py-3 px-8 rounded-lg transition-colors"
          >
            Shop All Brands →
          </Link>
        </div>
      </div>
    </div>
  );
}
