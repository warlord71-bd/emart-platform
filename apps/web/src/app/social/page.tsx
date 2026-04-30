import type { Metadata } from 'next';
import { YouTubeCard, TikTokCard, InstagramCard } from '@/components/social/VideoCard';
import { getYouTubeVideos } from '@/lib/youtubeRss';
import { TIKTOK_VIDEOS, INSTAGRAM_POSTS } from '@/lib/socialConfig';
import { COMPANY } from '@/lib/companyProfile';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Watch & Follow | Emart Skincare Bangladesh',
  description: 'Watch our latest skincare tutorials, unboxings, and product demos on YouTube, TikTok, and Instagram.',
  alternates: { canonical: '/social' },
};

export default async function SocialPage() {
  const youtubeVideos = await getYouTubeVideos(9);
  const hasTikTok = TIKTOK_VIDEOS.length > 0;
  const hasInstagram = INSTAGRAM_POSTS.length > 0;

  return (
    <main className="min-h-screen bg-bg pb-16 pt-8">
      <div className="mx-auto max-w-6xl px-4">

        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Watch &amp; Follow</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink lg:text-4xl">Our Social Content</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-500">
            Skincare tutorials, unboxings, and honest product demos — watch without leaving the site.
          </p>
          {/* Follow buttons */}
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <a href={COMPANY.social.youtube} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#FF0000] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#cc0000]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg>
              YouTube
            </a>
            <a href="https://www.tiktok.com/@emart_bdofficial" target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#010101] px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-[#333]">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z"/></svg>
              TikTok
            </a>
            <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743] px-4 py-2 text-sm font-bold text-white shadow-sm">
              <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
              Instagram
            </a>
          </div>
        </div>

        {/* YouTube */}
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#FF0000]" />
              YouTube
            </h2>
            <a href={COMPANY.social.youtube} target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-accent hover:underline">
              View channel →
            </a>
          </div>
          {youtubeVideos.length === 0 ? (
            <p className="py-10 text-center text-sm text-gray-400">Videos coming soon.</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {youtubeVideos.map((v) => (
                <YouTubeCard key={v.id} videoId={v.id} title={v.title} />
              ))}
            </div>
          )}
        </section>

        {/* TikTok */}
        <section className="mb-12">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="text-xl font-extrabold text-ink">
              <span className="mr-2 inline-block h-3 w-3 rounded-full bg-[#010101]" />
              TikTok
            </h2>
            <a href="https://www.tiktok.com/@emart_bdofficial" target="_blank" rel="noopener noreferrer"
              className="text-sm font-semibold text-accent hover:underline">
              Follow us →
            </a>
          </div>
          {!hasTikTok ? (
            <div className="rounded-xl border border-dashed border-hairline bg-card p-10 text-center">
              <p className="text-sm text-gray-400">TikTok videos coming soon.</p>
              <a href="https://www.tiktok.com/@emart_bdofficial" target="_blank" rel="noopener noreferrer"
                className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
                @emart_bdofficial on TikTok →
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {TIKTOK_VIDEOS.map((v) => (
                <TikTokCard key={v.id} videoId={v.id} title={v.title} />
              ))}
            </div>
          )}
        </section>

        {/* Instagram */}
        {hasInstagram && (
          <section className="mb-12">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-xl font-extrabold text-ink">
                <span className="mr-2 inline-block h-3 w-3 rounded-full bg-gradient-to-r from-[#f09433] to-[#dc2743]" />
                Instagram
              </h2>
              <a href={COMPANY.social.instagram} target="_blank" rel="noopener noreferrer"
                className="text-sm font-semibold text-accent hover:underline">
                Follow us →
              </a>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {INSTAGRAM_POSTS.map((p) => (
                <InstagramCard key={p.href} href={p.href} caption={p.caption} thumbnail={p.thumbnail} />
              ))}
            </div>
          </section>
        )}

        {/* Back link */}
        <div className="mt-4 text-center">
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">
            ← Back to shop
          </Link>
        </div>
      </div>
    </main>
  );
}
