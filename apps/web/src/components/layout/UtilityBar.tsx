import Link from 'next/link';

/**
 * Utility Bar Component
 * Sticky announcement bar at the top with trust signals and track order link
 */
export default function UtilityBar() {
  return (
    <div className="sticky top-0 z-[100] bg-navy-950 text-white text-xs md:text-sm py-2 md:py-2.5 overflow-x-auto border-b border-gray-800">
      <div className="max-w-7xl mx-auto px-4 flex items-center justify-center gap-3 md:gap-6 whitespace-nowrap">
        {/* Free Delivery */}
        <span className="flex items-center gap-1">
          <span>🚚</span>
          <span>
            Free delivery above{' '}
            <span className="text-gold-500 font-semibold">৳1,499</span>
          </span>
        </span>

        {/* Divider - hidden on mobile */}
        <span className="hidden md:inline text-gray-500">•</span>

        {/* Authentic Badge */}
        <span className="flex items-center gap-1">
          <span>✓</span>
          <span>100% Authentic</span>
        </span>

        {/* Divider - hidden on mobile */}
        <span className="hidden md:inline text-gray-500">•</span>

        {/* COD Nationwide */}
        <span className="flex items-center gap-1">
          <span>💵</span>
          <span>COD Nationwide</span>
        </span>

        {/* Divider - hidden on mobile */}
        <span className="hidden md:inline text-gray-500">•</span>

        {/* Track Order Link */}
        <Link
          href="/track-order"
          className="flex items-center gap-1 text-pink-400 hover:text-pink-300 transition-colors font-medium"
        >
          <span>📦</span>
          <span>Track Order</span>
        </Link>
      </div>
    </div>
  );
}
