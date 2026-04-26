import Link from 'next/link';

/**
 * Utility Bar Component
 * Sticky announcement bar at the top with trust signals and track order link
 */
export default function UtilityBar() {
  return (
    <>
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .marquee {
          animation: marquee 20s linear infinite;
        }
      `}</style>
      <div className="sticky top-0 z-[100] bg-ink text-white text-xs md:text-sm py-2.5 md:py-3 overflow-hidden border-b border-white/10 shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 whitespace-nowrap marquee">
        {/* Free Delivery */}
        <span className="flex items-center gap-1">
          <span>🚚</span>
          <span>
            Free delivery above{' '}
            <span className="text-gold-500 font-semibold">৳1,499</span>
          </span>
        </span>

        {/* Divider */}
        <span className="text-gray-600">•</span>

        {/* Authentic Badge */}
        <span className="flex items-center gap-1">
          <span>✓</span>
          <span>Authentic</span>
        </span>

        {/* Divider */}
        <span className="text-gray-600">•</span>

        {/* COD Nationwide */}
        <span className="flex items-center gap-1">
          <span>💵</span>
          <span>COD</span>
        </span>

        {/* Divider */}
        <span className="text-gray-600">•</span>

        {/* Track Order Link */}
        <Link
          href="/track-order"
          className="flex items-center gap-1 text-accent-light hover:text-white transition-colors font-medium"
        >
          <span>📦</span>
          <span>Track Order</span>
        </Link>
        </div>
      </div>
    </>
  );
}
