import Link from 'next/link';

interface HeroBannerProps {
  title: string;
  subtitle: string;
  description: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  trustBadges: string[];
}

/**
 * Emart Hero Banner Component
 * Premium hero section with gradient background
 */
export const HeroBanner: React.FC<HeroBannerProps> = ({
  title,
  subtitle,
  description,
  primaryCTA,
  secondaryCTA,
  trustBadges,
}) => {
  return (
    <section className="bg-gradient-to-br from-lumiere-text-primary via-purple-900 to-lumiere-text-primary text-white py-12 md:py-20 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Content */}
        <div className="text-center">
        {/* Subtitle Badge */}
        <div className="inline-flex items-center gap-2 bg-lumiere-primary/20 border border-lumiere-primary/40 px-4 py-2 rounded-full text-sm font-medium text-lumiere-primary mb-4">
          <span>🇰🇷</span> {subtitle}
        </div>

        {/* Main Heading */}
        <h1 className="text-4xl md:text-5xl font-serif font-extrabold leading-tight mb-4">
          {title}
          <span className="text-lumiere-primary block md:inline"> The Best</span>
        </h1>

        {/* Description */}
        <p className="text-gray-300 text-base md:text-lg mb-8 mx-auto leading-relaxed">
          {description}
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8">
          <Link
            href={primaryCTA.href}
            className="bg-lumiere-primary hover:bg-lumiere-primary-hover text-white font-semibold py-3 px-6 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-center"
          >
            {primaryCTA.text} →
          </Link>
          {secondaryCTA && (
            <Link
              href={secondaryCTA.href}
              className="border-2 border-white text-white hover:bg-white hover:text-lumiere-text-primary font-semibold py-3 px-6 rounded-lg transition-all duration-200 text-center"
            >
              {secondaryCTA.text}
            </Link>
          )}
        </div>

        {/* Trust Badges */}
        <div className="flex flex-wrap gap-2 justify-center">
          {trustBadges.map((badge) => (
            <span
              key={badge}
              className="flex items-center gap-1.5 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full text-gray-200 border border-white/10"
            >
              <span className="w-1.5 h-1.5 bg-lumiere-primary rounded-full" />
              {badge}
            </span>
          ))}
        </div>
      </div>
      </div>
    </section>
  );
};

export default HeroBanner;
