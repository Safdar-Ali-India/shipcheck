import { notFound } from "next/navigation";
import { blogPosts, type BlogPost } from "@/data/blog-posts";
import { isPublished } from "@/lib/blog-schedule";

/**
 * Guard for native article pages. Missing, external, or unpublished → 404.
 */
export function requirePublishedBlogPost(
  href: string,
  now: Date = new Date(),
): BlogPost {
  const post = blogPosts.find((p) => p.href === href);
  if (!post || post.native !== true || !isPublished(post.publishedAt, now)) {
    notFound();
  }
  return post;
}
