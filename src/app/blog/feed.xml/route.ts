import { buildPublishedBlogRss } from "@/lib/blogFeed";

export const dynamic = "force-dynamic";

export function GET() {
  const xml = buildPublishedBlogRss();
  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}
