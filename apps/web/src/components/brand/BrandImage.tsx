'use client';

interface Props {
  slug: string;
  name: string;
  bgColor?: string;
  textColor?: string;
  abbr?: string;
  className?: string;
}

export default function BrandImage({ slug, name, bgColor = '#eff6ff', textColor = '#1e40af', abbr, className = 'w-full h-20 object-cover' }: Props) {
  const initial = abbr || name.charAt(0).toUpperCase();

  return (
    <div className="relative w-full h-20 overflow-hidden rounded-t-xl">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/brands/${slug}.svg`}
        alt={name}
        className={className}
        onError={(e) => {
          const el = e.currentTarget;
          el.style.display = 'none';
          const fallback = document.getElementById(`brand-fallback-${slug}`);
          if (fallback) fallback.style.display = 'flex';
        }}
      />
      <div
        id={`brand-fallback-${slug}`}
        className="absolute inset-0 items-center justify-center font-extrabold text-xl"
        style={{ background: bgColor, color: textColor, display: 'none' }}
      >
        {initial}
      </div>
    </div>
  );
}
