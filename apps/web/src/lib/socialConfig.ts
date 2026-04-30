// Social media video config — update these with your real video/post IDs

export type VideoEntry = {
  id: string;
  title: string;
};

export type InstagramEntry = {
  href: string;
  caption: string;
  thumbnail: string; // local /images/ path or WP CDN URL
};

// YouTube — channel handle: @emartbd
// Set YOUTUBE_CHANNEL_ID in .env.local to enable auto-fetch via RSS
// Fallback: these IDs are always shown when RSS fetch fails
export const YOUTUBE_FALLBACK_VIDEOS: VideoEntry[] = [
  { id: 'zgo8F-H3FEI', title: 'K-Beauty Skincare Routine – Emart BD' },
  // Add more YouTube video IDs here
];

// TikTok — channel: @emart_bdofficial
// Get the numeric ID from the video URL:
//   tiktok.com/@emart_bdofficial/video/7123456789  →  id: '7123456789'
export const TIKTOK_VIDEOS: VideoEntry[] = [
  // Add your TikTok video IDs here:
  // { id: '7123456789012345678', title: 'COSRX Snail Mucin unboxing' },
];

// Instagram — channel: @emartbd
// Get shortcode from the post URL:  instagram.com/p/SHORTCODE/
export const INSTAGRAM_POSTS: InstagramEntry[] = [
  {
    href: 'https://www.instagram.com/emartbd/',
    caption: 'K-beauty & global skincare — follow us for daily drops',
    thumbnail: '/images/home-categories/viral-kbeauty.jpg',
  },
  // Add more posts:
  // { href: 'https://www.instagram.com/p/SHORTCODE/', caption: '...', thumbnail: '...' },
];
