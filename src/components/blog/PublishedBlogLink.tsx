import Link from "next/link";
import { blogPosts } from "@/data/blog-posts";
import { isPublished } from "@/lib/blog-schedule";

type Props = {
  href: string;
  children: React.ReactNode;
  className?: string;
};

/**
 * Internal cross-links that never point at unpublished scheduled posts.
 */
export function PublishedBlogLink({ href, children, className }: Props) {
  const post = blogPosts.find((p) => p.href === href);
  const live = Boolean(post && post.native && isPublished(post.publishedAt));

  if (!live) {
    return <span className={className}>{children}</span>;
  }

  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}
