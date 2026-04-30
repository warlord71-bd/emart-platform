'use client';

import Image from 'next/image';
import Link from 'next/link';
import { YOUTUBE_FALLBACK_VIDEOS, TIKTOK_VIDEOS } from '@/lib/socialConfig';

export function SocialChannelGrid() {
  const ytId    = YOUTUBE_FALLBACK_VIDEOS[0]?.id    ?? 'j7anBWKrzYo';
  const ytTitle = YOUTUBE_FALLBACK_VIDEOS[0]?.title ?? 'Skincare tutorials & demos';
  const ttTitle = TIKTOK_VIDEOS[0]?.title           ?? 'Unboxings & product demos';

  return (
    <div className="mt-8">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-sm font-extrabold text-ink">See routines in action</p>
        <Link href="/social" className="flex items-center gap-1 text-sm font-semibold text-accent hover:underline">
          <svg viewBox="0 0 24 24" className="h-4 w-4 fill-accent"><path d="M8 5v14l11-7z" /></svg>
          Watch all videos
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">

        {/* YouTube: real thumbnail */}
        <SocialCard href="/social" aria-label="Watch YouTube content">
          <Image
            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
            alt={ytTitle}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-[1.08]"
            unoptimized
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <PlatformBadge color="bg-[#FF0000]" icon={<YTIcon />} label="YouTube" />
          <CardFooter handle="@emartbd.official" title={ytTitle} />
        </SocialCard>

        {/* TikTok: brand gradient */}
        <SocialCard href="/social" aria-label="Watch TikTok content">
          <div className="absolute inset-0 bg-gradient-to-br from-[#010101] via-[#1a0a0f] to-[#2d1321]" />
          <div className="absolute inset-0 flex items-center justify-center opacity-[0.07]">
            <div className="h-48 w-48 rounded-full border-2 border-white" />
            <div className="absolute h-32 w-32 rounded-full border border-white" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z" />
              </svg>
            </div>
          </div>
          <PlatformBadge color="bg-[#010101] ring-1 ring-white/20" icon={<TTIcon />} label="TikTok" />
          <CardFooter handle="@emart_bdofficial" title={ttTitle} />
        </SocialCard>

        {/* Facebook: brand gradient */}
        <SocialCard href="/social" aria-label="Watch Facebook content">
          <div className="absolute inset-0 bg-gradient-to-br from-[#1877F2] via-[#1468d6] to-[#0a5dc2]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <svg viewBox="0 0 24 24" className="h-8 w-8 fill-white">
                <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
              </svg>
            </div>
          </div>
          <PlatformBadge color="bg-[#1877F2] ring-1 ring-white/30" icon={<FBIcon />} label="Facebook" />
          <CardFooter handle="emartbd.official" title="Product drops & reels" />
        </SocialCard>

        {/* Instagram: brand gradient */}
        <SocialCard href="/social" aria-label="Watch Instagram content">
          <div className="absolute inset-0 bg-gradient-to-br from-[#833ab4] via-[#fd1d1d] to-[#fcb045]" />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white/15 ring-1 ring-white/25">
              <IGIcon className="h-8 w-8 fill-white" />
            </div>
          </div>
          <PlatformBadge color="bg-gradient-to-r from-[#833ab4] to-[#fd1d1d]" icon={<IGIcon className="h-3 w-3 fill-white" />} label="Instagram" />
          <CardFooter handle="@emartbd.official" title="Skincare looks & shelf shots" />
        </SocialCard>

      </div>
    </div>
  );
}

// Shared sub-components

function SocialCard({ href, children, 'aria-label': ariaLabel }: { href: string; children: React.ReactNode; 'aria-label': string }) {
  return (
    <Link
      href={href}
      className="group relative block overflow-hidden rounded-2xl shadow-card"
      aria-label={ariaLabel}
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden">
        {children}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 transition-opacity duration-300 group-hover:opacity-100">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 backdrop-blur-sm ring-2 ring-white/50">
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-white pl-0.5"><path d="M8 5v14l11-7z" /></svg>
          </div>
        </div>
      </div>
    </Link>
  );
}

function PlatformBadge({ color, icon, label }: { color: string; icon: React.ReactNode; label: string }) {
  return (
    <div className={`absolute left-2.5 top-2.5 flex items-center gap-1 rounded-full px-2 py-1 ${color}`}>
      {icon}
      <span className="text-[9px] font-extrabold tracking-wide text-white">{label}</span>
    </div>
  );
}

function CardFooter({ handle, title }: { handle: string; title: string }) {
  return (
    <div className="absolute inset-x-0 bottom-0 p-3">
      <p className="text-[11px] font-bold text-white/60">{handle}</p>
      <p className="mt-0.5 line-clamp-2 text-xs font-semibold leading-4 text-white">{title}</p>
      <p className="mt-2 text-[10px] font-bold text-white/50 transition-colors group-hover:text-white/90">Tap to watch</p>
    </div>
  );
}

// Platform icons

function YTIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
      <path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z" />
    </svg>
  );
}

function TTIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
      <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z" />
    </svg>
  );
}

function FBIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3 w-3 fill-white">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
    </svg>
  );
}

function IGIcon({ className = 'h-3 w-3 fill-white' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className}>
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
    </svg>
  );
}
