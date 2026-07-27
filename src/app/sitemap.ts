import type { MetadataRoute } from "next";
import { getNativeBlogPosts } from "@/data/blog-posts";
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
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    ...native.map((post) => ({
      url: `${SITE_URL}${post.href}`,
      lastModified: new Date(post.publishedAt),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
