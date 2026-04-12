'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface HeroSlide {
  id: number;
  subtitle: string;
  title: string;
  highlight: string;
  description: string;
  primaryCTA: { text: string; href: string };
  secondaryCTA?: { text: string; href: string };
  trustBadges: string[];
  gradient: string;
  emoji: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    emoji: '🇰🇷',
    subtitle: '100% Authentic Korean & Japanese Skincare',
    title: 'Your Skin Deserves',
    highlight: 'The Best',
    description: 'Discover premium skincare from Korea and Japan. Fast delivery across Bangladesh, COD available, 100% authentic products.',
    primaryCTA: { text: 'Shop Now', href: '/shop' },
    secondaryCTA: { text: 'View Sale', href: '/sale' },
    trustBadges: ['✓ 100% Authentic', '💵 COD Available', '🚚 Fast Delivery', '↩️ Easy Returns'],
    gradient: 'from-[#1a1a2e] via-purple-900 to-[#1a1a2e]',
  },
  {
    id: 2,
    emoji: '🌿',
    subtitle: 'Trending in K-Beauty & J-Beauty',
    title: 'Skincare',
    highlight: 'Innovation Starts Here',
    description: 'Explore the latest K-Beauty and J-Beauty trends. COSRX, ISNTREE, Laneige, and more trusted brands.',
    primaryCTA: { text: 'Discover Trends', href: '/shop' },
    secondaryCTA: { text: 'Shop Brands', href: '/brands' },
    trustBadges: ['⭐ Trending Now', '🎯 Expert Picks', '💚 Customer Favorites', '🔥 Limited Stock'],
    gradient: 'from-emerald-900 via-teal-800 to-emerald-900',
  },
  {
    id: 3,
    emoji: '✨',
    subtitle: 'Transform Your Skin',
    title: 'Glow Up with',
    highlight: 'Our Collections',
    description: 'Find solutions for acne, aging, dryness, and more. Curated collections for every skin concern.',
    primaryCTA: { text: 'Shop by Concern', href: '/concerns' },
    secondaryCTA: { text: 'View New Arrivals', href: '/new-arrivals' },
    trustBadges: ['💎 Premium Quality', '🌟 Best Sellers', '✓ Dermatologist Tested', '❤️ Customer Approved'],
    gradient: 'from-pink-900 via-rose-800 to-pink-900',
  },
];

export const HeroCarousel = () => {
  const [current, setCurrent] = useState(0);
  const [autoPlay, setAutoPlay] = useState(true);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [autoPlay]);

  const next = () => {
    setCurrent((prev) => (prev + 1) % HERO_SLIDES.length);
    setAutoPlay(false);
  };

  const prev = () => {
    setCurrent((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
    setAutoPlay(false);
  };

  const goToSlide = (index: number) => {
    setCurrent(index);
    setAutoPlay(false);
  };

  const slide = HERO_SLIDES[current];

  return (
    <section className={`relative bg-gradient-to-br ${slide.gradient} text-white py-12 md:py-20 px-4 overflow-hidden transition-all duration-1000`}>
      {/* Animated background elements */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -mr-48 -mt-48 animate-pulse" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-3xl -ml-48 -mb-48 animate-pulse" />

      {/* Content Container */}
      <div className="relative max-w-4xl mx-auto z-10">
        {/* Slide Content */}
        <div className="text-center min-h-[400px] flex flex-col justify-center">
          {/* Subtitle Badge with Emoji */}
          <div className="inline-flex items-center gap-2 bg-white/10 border border-white/20 px-4 py-2 rounded-full text-sm font-medium mb-6 mx-auto backdrop-blur-sm hover:bg-white/15 transition-colors">
            <span className="text-xl">{slide.emoji}</span>
            <span>{slide.subtitle}</span>
          </div>

          {/* Main Heading with Animation */}
          <h1 className="text-4xl md:text-6xl font-serif font-extrabold leading-tight mb-4 animate-fade-in">
            {slide.title}
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-white via-pink-200 to-white md:inline md:ml-3">
              {slide.highlight}
            </span>
          </h1>

          {/* Description */}
          <p className="text-gray-200 text-base md:text-lg mb-8 mx-auto leading-relaxed max-w-2xl animate-fade-in-delay">
            {slide.description}
          </p>

          {/* CTAs */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center mb-8 animate-fade-in-delay-2">
            <Link
              href={slide.primaryCTA.href}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white font-semibold py-3 px-8 rounded-lg transition-all duration-200 transform hover:scale-105 active:scale-95 text-center shadow-lg hover:shadow-xl"
            >
              {slide.primaryCTA.text} →
            </Link>
            {slide.secondaryCTA && (
              <Link
                href={slide.secondaryCTA.href}
                className="border-2 border-white text-white hover:bg-white hover:text-gray-900 font-semibold py-3 px-8 rounded-lg transition-all duration-200 text-center"
              >
                {slide.secondaryCTA.text}
              </Link>
            )}
          </div>

          {/* Trust Badges */}
          <div className="flex flex-wrap gap-2 justify-center">
            {slide.trustBadges.map((badge) => (
              <span
                key={badge}
                className="flex items-center gap-1.5 text-xs font-medium bg-white/10 px-3 py-1.5 rounded-full text-gray-100 border border-white/20 backdrop-blur-sm"
              >
                {badge}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Navigation Arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-white/20 hover:bg-white/40 text-white p-2 rounded-full transition-all duration-200 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Slide Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2 z-20">
        {HERO_SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`transition-all duration-300 rounded-full ${
              index === current
                ? 'bg-white w-8 h-2'
                : 'bg-white/40 hover:bg-white/60 w-2 h-2'
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Auto-play indicator */}
      <div className="absolute top-6 right-6 flex items-center gap-2 text-sm text-white/60 z-10">
        {autoPlay && <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />}
        <span>{current + 1} / {HERO_SLIDES.length}</span>
      </div>

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-fade-in {
          animation: fadeIn 0.6s ease-out;
        }

        .animate-fade-in-delay {
          animation: fadeIn 0.6s ease-out 0.2s both;
        }

        .animate-fade-in-delay-2 {
          animation: fadeIn 0.6s ease-out 0.4s both;
        }
      `}</style>
    </section>
  );
};

export default HeroCarousel;
