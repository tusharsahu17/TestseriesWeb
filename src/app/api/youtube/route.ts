import { NextResponse } from 'next/server';

const CHANNEL_ID = 'UClT7HW23OszZrY8tjuiAFKQ';
const RSS_URL = `https://www.youtube.com/feeds/videos.xml?channel_id=${CHANNEL_ID}`;

export interface YouTubeVideoItem {
  id: string;
  title: string;
  published: string;
  thumbnail: string;
  url: string;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function extractTag(block: string, tag: string): string {
  const match = block.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`));
  return match ? decodeXmlEntities(match[1].trim()) : '';
}

export async function GET() {
  try {
    const res = await fetch(RSS_URL, {
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch YouTube channel feed.' },
        { status: 502 },
      );
    }

    const xml = await res.text();
    const channelTitle = extractTag(xml, 'title') || '@tushar17sahu06';
    const entries = xml.match(/<entry>[\s\S]*?<\/entry>/g) ?? [];

    const videos: YouTubeVideoItem[] = entries
      .map((entry) => {
        const id = extractTag(entry, 'yt:videoId');
        if (!id) return null;
        const title = extractTag(entry, 'title') || 'Untitled video';
        const published = extractTag(entry, 'published');
        const linkMatch = entry.match(/<link[^>]+href="([^"]+)"/);
        const url = linkMatch?.[1] || `https://www.youtube.com/watch?v=${id}`;
        const thumbnail = `https://i.ytimg.com/vi/${id}/hqdefault.jpg`;

        return { id, title, published, thumbnail, url };
      })
      .filter((item): item is YouTubeVideoItem => item !== null);

    return NextResponse.json({ channelTitle, videos });
  } catch {
    return NextResponse.json(
      { error: 'Unable to load YouTube channel videos.' },
      { status: 500 },
    );
  }
}
