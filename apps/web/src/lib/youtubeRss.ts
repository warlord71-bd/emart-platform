import { YOUTUBE_FALLBACK_VIDEOS, type VideoEntry } from './socialConfig';

interface RssVideo extends VideoEntry {
  publishedAt: string;
}

export async function getYouTubeVideos(maxResults = 9): Promise<RssVideo[]> {
  const channelId = process.env.YOUTUBE_CHANNEL_ID;
  if (!channelId) return YOUTUBE_FALLBACK_VIDEOS.map(v => ({ ...v, publishedAt: '' }));

  try {
    const rss = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
      { next: { revalidate: 3600 } },
    );
    if (!rss.ok) throw new Error(`RSS ${rss.status}`);
    const xml = await rss.text();

    // Parse <entry> blocks
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
    const videos: RssVideo[] = entries.slice(0, maxResults).map((m) => {
      const block = m[1];
      const id = (block.match(/yt:videoId>(.*?)<\/yt:videoId/) || [])[1] ?? '';
      const title = (block.match(/<title>(.*?)<\/title>/) || [])[1] ?? '';
      const publishedAt = (block.match(/<published>(.*?)<\/published>/) || [])[1] ?? '';
      return { id, title: decodeHtmlEntities(title), publishedAt };
    }).filter(v => v.id);

    return videos.length ? videos : YOUTUBE_FALLBACK_VIDEOS.map(v => ({ ...v, publishedAt: '' }));
  } catch {
    return YOUTUBE_FALLBACK_VIDEOS.map(v => ({ ...v, publishedAt: '' }));
  }
}

function decodeHtmlEntities(str: string): string {
  return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
