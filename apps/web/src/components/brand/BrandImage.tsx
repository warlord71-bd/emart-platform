'use client';

const EXTS = ['.svg', '.png', '.jpg', '.jpeg', '.webp'];

interface Props {
  slug: string;
  name: string;
  bgColor?: string;
  textColor?: string;
  abbr?: string;
  className?: string;
}

export default function BrandImage({ slug, name, bgColor = '#eff6ff', textColor = '#1e40af', abbr, className = 'w-full h-20 object-contain p-2' }: Props) {
  const initial = abbr || name.charAt(0).toUpperCase();

  // Try each extension in order; on error advance to next
  function tryNext(el: HTMLImageElement, extIndex: number) {
    const next = extIndex + 1;
    if (next < EXTS.length) {
      el.src = `/images/brands/${slug}${EXTS[next]}`;
      el.dataset.extIndex = String(next);
    } else {
      el.style.display = 'none';
      const fallback = document.getElementById(`brand-fallback-${slug}`);
      if (fallback) fallback.style.display = 'flex';
    }
  }

  return (
    <div className="relative w-full h-20 overflow-hidden rounded-t-xl bg-white flex items-center justify-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`/images/brands/${slug}${EXTS[0]}`}
        alt={name}
        data-ext-index="0"
        className={className}
        onError={(e) => {
          const el = e.currentTarget;
          const idx = parseInt(el.dataset.extIndex || '0', 10);
          tryNext(el, idx);
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
