'use client';

interface SectionHeaderProps {
  title: string;
  icon?: string;
  seeAllLink?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  icon = '⭐',
  seeAllLink = '/shop',
}) => {
  return (
    <div className="mb-8">
      <div className="relative">
        {/* Curved banner background */}
        <div className="bg-gradient-to-r from-yellow-300 to-yellow-200 rounded-full px-6 py-3 flex items-center justify-between shadow-sm">
          {/* Left: Title with icon */}
          <h2 className="text-xl md:text-2xl font-bold text-gray-900 flex items-center gap-3">
            <span className="text-2xl">{icon}</span>
            {title}
          </h2>

          {/* Right: View All link */}
          <a
            href={seeAllLink}
            className="text-gray-800 hover:text-gray-900 font-semibold text-sm md:text-base flex items-center gap-1 whitespace-nowrap"
          >
            View All →
          </a>
        </div>
      </div>
    </div>
  );
};
