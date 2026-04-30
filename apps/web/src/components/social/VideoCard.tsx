'use client';

import { useState } from 'react';
import Image from 'next/image';

// ── YouTube ──────────────────────────────────────────────────────────────────

interface YouTubeCardProps {
  videoId: string;
  title: string;
}

export function YouTubeCard({ videoId, title }: YouTubeCardProps) {
  const [playing, setPlaying] = useState(false);
  const thumbnail = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-black shadow-card">
      <div className="relative aspect-[9/16] w-full">
        {playing ? (
          <iframe
            src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="autoplay; encrypted-media; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 w-full"
            aria-label={`Play: ${title}`}
          >
            <Image
              src={thumbnail}
              alt={title}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
            />
            <div className="absolute inset-0 bg-black/30 transition-colors group-hover:bg-black/20" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#FF0000] shadow-lg transition-transform group-hover:scale-110">
                <svg viewBox="0 0 24 24" className="h-6 w-6 fill-white pl-0.5">
                  <path d="M8 5v14l11-7z" />
                </svg>
              </div>
              <span className="max-w-[80%] text-center text-xs font-semibold text-white drop-shadow">
                {title}
              </span>
            </div>
            <div className="absolute left-3 top-3 rounded-full bg-[#FF0000] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
              YouTube
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── TikTok ───────────────────────────────────────────────────────────────────

interface TikTokCardProps {
  videoId: string;
  title: string;
}

export function TikTokCard({ videoId, title }: TikTokCardProps) {
  const [playing, setPlaying] = useState(false);

  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-black shadow-card">
      <div className="relative aspect-[9/16] w-full">
        {playing ? (
          <iframe
            src={`https://www.tiktok.com/embed/v2/${videoId}`}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="encrypted-media"
            allowFullScreen
          />
        ) : (
          <button
            onClick={() => setPlaying(true)}
            className="group absolute inset-0 flex w-full flex-col items-center justify-center gap-3 bg-gradient-to-br from-[#010101] to-[#161616]"
            aria-label={`Play TikTok: ${title}`}
          >
            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-lg transition-transform group-hover:scale-110">
              {/* TikTok logo */}
              <svg viewBox="0 0 24 24" className="h-7 w-7 fill-[#010101]">
                <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z" />
              </svg>
            </div>
            <span className="max-w-[80%] text-center text-xs font-semibold text-white/80">
              {title}
            </span>
            <div className="absolute left-3 top-3 rounded-full bg-[#010101] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white/90 ring-1 ring-white/20">
              TikTok
            </div>
          </button>
        )}
      </div>
    </div>
  );
}

// ── Instagram ─────────────────────────────────────────────────────────────────

interface InstagramCardProps {
  href: string;
  caption: string;
  thumbnail: string;
}

export function InstagramCard({ href, caption, thumbnail }: InstagramCardProps) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="group block overflow-hidden rounded-xl border border-hairline bg-black shadow-card"
    >
      <div className="relative aspect-[9/16] w-full overflow-hidden">
        <Image
          src={thumbnail}
          alt={caption}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
        {/* Instagram gradient badge */}
        <div className="absolute left-3 top-3 rounded-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
          Instagram
        </div>
        <div className="absolute inset-x-0 bottom-0 p-4">
          <p className="line-clamp-3 text-xs font-semibold leading-5 text-white">{caption}</p>
          <div className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5 fill-white">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" />
            </svg>
            Open on Instagram
          </div>
        </div>
      </div>
    </a>
  );
}
