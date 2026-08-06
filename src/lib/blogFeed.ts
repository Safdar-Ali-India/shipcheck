import { getNativeBlogPosts, type BlogPost } from "@/data/blog-posts";
import { toOpenGraphPublishedTime } from "@/lib/blog-schedule";
import { BRAND, SITE_URL } from "@/lib/constants";

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderBlogRss(posts: BlogPost[], now: Date = new Date()): string {
  const items = posts
    .map((post) => {
      const url = `${SITE_URL}${post.href}`;
      return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${escapeXml(url)}</link>
      <guid>${escapeXml(url)}</guid>
      <pubDate>${new Date(toOpenGraphPublishedTime(post.publishedAt)).toUTCString()}</pubDate>
      <description>${escapeXml(post.excerpt)}</description>
    </item>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(BRAND.name)} blog</title>
    <link>${SITE_URL}/blog</link>
    <description>Notes on free browser smoke tests and visual diffs.</description>
    <lastBuildDate>${now.toUTCString()}</lastBuildDate>
${items}
  </channel>
</rss>
`;
}

export function buildPublishedBlogRss(now: Date = new Date()): string {
  return renderBlogRss(getNativeBlogPosts(now), now);
}
