import type { MetadataRoute } from "next";
import { getNativeBlogPosts } from "@/data/blog-posts";
import { getPublishInstant } from "@/lib/blog-schedule";
import { SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export default function sitemap(): MetadataRoute.Sitemap {
  const native = getNativeBlogPosts();

  return [
    {
      url: SITE_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${SITE_URL}/blog`,
      lastModified: native[0]
        ? new Date(getPublishInstant(native[0].publishedAt))
        : new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...native.map((post) => ({
      url: `${SITE_URL}${post.href}`,
      lastModified: new Date(getPublishInstant(post.publishedAt)),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
