import type { Metadata } from 'next';
import { YouTubeCard, TikTokCard, FacebookCard, InstagramCard } from '@/components/social/VideoCard';
import { getYouTubeVideos } from '@/lib/youtubeRss';
import { TIKTOK_VIDEOS, FACEBOOK_VIDEOS, INSTAGRAM_POSTS } from '@/lib/socialConfig';
import { COMPANY } from '@/lib/companyProfile';
import Link from 'next/link';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Watch & Follow | Emart Skincare Bangladesh',
  description: 'Watch our latest skincare tutorials, unboxings, and demos on YouTube, TikTok, Facebook, and Instagram. All playable without leaving Emart.',
  alternates: { canonical: '/social' },
};

const PLATFORM_LINKS = [
  { label: 'YouTube', href: COMPANY.social.youtube, bg: 'bg-[#FF0000]', icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M19.615 3.184c-3.604-.246-11.631-.245-15.23 0-3.897.266-4.356 2.62-4.385 8.816.029 6.185.484 8.549 4.385 8.816 3.6.245 11.626.246 15.23 0 3.897-.266 4.356-2.62 4.385-8.816-.029-6.185-.484-8.549-4.385-8.816zm-10.615 12.816v-8l8 3.993-8 4.007z"/></svg> },
  { label: 'TikTok', href: COMPANY.social.tiktok, bg: 'bg-[#010101]', icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.89a8.18 8.18 0 0 0 4.78 1.52V7a4.85 4.85 0 0 1-1.01-.31z"/></svg> },
  { label: 'Facebook', href: COMPANY.social.facebook, bg: 'bg-[#1877F2]', icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg> },
  { label: 'Instagram', href: COMPANY.social.instagram, bg: 'bg-gradient-to-r from-[#f09433] via-[#e6683c] to-[#dc2743]', icon: <svg viewBox="0 0 24 24" className="h-4 w-4 fill-white"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg> },
];

function SectionHeader({ title, color, followHref, followLabel }: { title: string; color: string; followHref: string; followLabel: string }) {
  return (
    <div className="mb-5 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-xl font-extrabold text-ink">
        <span className={`inline-block h-3 w-3 rounded-full ${color}`} />
        {title}
      </h2>
      <a href={followHref} target="_blank" rel="noopener noreferrer"
        className="text-sm font-semibold text-accent hover:underline">
        {followLabel} →
      </a>
    </div>
  );
}

function EmptyPlatform({ platform, href }: { platform: string; href: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-hairline bg-card p-10 text-center">
      <p className="text-sm text-gray-400">No {platform} videos configured yet.</p>
      <a href={href} target="_blank" rel="noopener noreferrer"
        className="mt-3 inline-block text-sm font-semibold text-accent hover:underline">
        Visit our {platform} page →
      </a>
    </div>
  );
}

export default async function SocialPage() {
  const youtubeVideos = await getYouTubeVideos(10);

  return (
    <main className="min-h-screen bg-bg pb-16 pt-8">
      <div className="mx-auto max-w-6xl px-4">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-accent">Watch &amp; Follow</p>
          <h1 className="mt-2 text-3xl font-extrabold text-ink lg:text-4xl">Our Social Content</h1>
          <p className="mx-auto mt-3 max-w-lg text-sm leading-7 text-gray-500">
            Tutorials, unboxings, texture demos &amp; honest reviews — watch directly without leaving Emart.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            {PLATFORM_LINKS.map((p) => (
              <a key={p.label} href={p.href} target="_blank" rel="noopener noreferrer"
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold text-white shadow-sm transition-opacity hover:opacity-90 ${p.bg}`}>
                {p.icon}{p.label}
              </a>
            ))}
          </div>
        </div>

        {/* YouTube */}
        <section className="mb-14">
          <SectionHeader title="YouTube" color="bg-[#FF0000]"
            followHref={COMPANY.social.youtube} followLabel="Subscribe" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {youtubeVideos.map((v) => (
              <YouTubeCard key={v.id} videoId={v.id} title={v.title} />
            ))}
          </div>
        </section>

        {/* TikTok */}
        <section className="mb-14">
          <SectionHeader title="TikTok" color="bg-[#010101]"
            followHref={COMPANY.social.tiktok} followLabel="Follow" />
          {TIKTOK_VIDEOS.length === 0 ? (
            <EmptyPlatform platform="TikTok" href={COMPANY.social.tiktok} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {TIKTOK_VIDEOS.map((v) => (
                <TikTokCard key={v.id} videoId={v.id} title={v.title} />
              ))}
            </div>
          )}
        </section>

        {/* Facebook */}
        <section className="mb-14">
          <SectionHeader title="Facebook" color="bg-[#1877F2]"
            followHref={COMPANY.social.facebook} followLabel="Follow" />
          {FACEBOOK_VIDEOS.length === 0 ? (
            <EmptyPlatform platform="Facebook" href={COMPANY.social.facebook} />
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {FACEBOOK_VIDEOS.map((v) => (
                <FacebookCard key={v.videoUrl} videoUrl={v.videoUrl} title={v.title} />
              ))}
            </div>
          )}
        </section>

        {/* Instagram */}
        <section className="mb-14">
          <SectionHeader title="Instagram" color="bg-gradient-to-r from-[#f09433] to-[#dc2743]"
            followHref={COMPANY.social.instagram} followLabel="Follow" />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {INSTAGRAM_POSTS.map((p) => (
              <InstagramCard key={p.href} href={p.href} caption={p.caption} thumbnail={p.thumbnail} />
            ))}
          </div>
        </section>

        <div className="mt-4 text-center">
          <Link href="/" className="text-sm font-semibold text-accent hover:underline">← Back to shop</Link>
        </div>
      </div>
    </main>
  );
}
