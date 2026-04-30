// Social media video config
// YouTube is auto-fetched via RSS (set YOUTUBE_CHANNEL_ID in .env.local)
// TikTok & Facebook: add video IDs/URLs here

export type VideoEntry = {
  id: string;
  title: string;
};

export type FacebookEntry = {
  videoUrl: string; // full facebook.com video URL
  title: string;
};

export type InstagramEntry = {
  href: string;
  caption: string;
  thumbnail: string;
};

// YouTube fallback (shown if RSS fails or YOUTUBE_CHANNEL_ID not set)
export const YOUTUBE_FALLBACK_VIDEOS: VideoEntry[] = [
  { id: 'j7anBWKrzYo', title: 'eMart Skincare Bangladesh' },
  { id: 'XNvxeRLA2No', title: 'Choose the right product for your skin concerns' },
  { id: 'tPlb1vVc08o', title: 'Choose your product – skin concerns' },
  { id: 'mbVkJThHGqQ', title: 'Best Korean skincare for oily skin' },
  { id: 'Y_Gh3L9UrP4', title: 'Retinol & Vitamin C – correct use' },
];

// TikTok — channel: @emart_bdofficial
// These IDs were extracted from the TikTok profile page.
// If a video doesn't play, replace its id with a valid video ID from:
// tiktok.com/@emart_bdofficial → share a video → copy link → paste the number
export const TIKTOK_VIDEOS: VideoEntry[] = [
  { id: '7634471676686714371', title: 'Skincare routine – Emart' },
  { id: '7449298784200212486', title: 'Skincare tips – Emart' },
  { id: '7449693274664730630', title: 'Product demo – Emart' },
  { id: '7435925695869501496', title: 'K-beauty picks – Emart' },
  { id: '7040035152164586522', title: 'Emart skincare unboxing' },
];

// Facebook — page: emartbd.official
// To get a video URL: go to facebook.com/emartbd.official/videos → open a video → copy URL
// Format: https://www.facebook.com/emartbd.official/videos/VIDEO_ID/
export const FACEBOOK_VIDEOS: FacebookEntry[] = [
  // Add your Facebook video URLs here:
  // { videoUrl: 'https://www.facebook.com/emartbd.official/videos/123456789/', title: 'Video title' },
];

// Instagram — @emartbd.official
export const INSTAGRAM_POSTS: InstagramEntry[] = [
  {
    href: 'https://www.instagram.com/emartbd.official/',
    caption: 'K-beauty & global skincare — daily drops, routines & honest reviews',
    thumbnail: '/images/home-categories/viral-kbeauty.jpg',
  },
];
