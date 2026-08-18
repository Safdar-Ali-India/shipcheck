import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/visual-diffs-without-flake-tax";

export const dynamic = "force-dynamic";

export function generateMetadata(): Metadata {
  const post = getPostByHref(POST_HREF);
  if (!post) return { title: BRAND.name };
  return {
    title: `${post.title} — ${BRAND.name}`,
    description: post.excerpt,
    alternates: { canonical: `${SITE_URL}${POST_HREF}` },
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: "article",
      publishedTime: post.seoPublishedTime,
      url: `${SITE_URL}${POST_HREF}`,
    },
  };
}

export default function VisualDiffsPage() {
  const post = requirePublishedBlogPost(POST_HREF);
  const seo = getPostByHref(POST_HREF)!;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: post.title,
    datePublished: seo.seoDatePublished,
    description: post.excerpt,
    author: { "@type": "Person", name: BRAND.author },
    publisher: { "@type": "Organization", name: BRAND.name, url: SITE_URL },
    mainEntityOfPage: `${SITE_URL}${POST_HREF}`,
  };

  return (
    <article>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <p className="text-sm text-zinc-500">{post.date}</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>

      <div className="mt-8 space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>
          Pixel-perfect compares are only useful if they fail for the right reasons. Font
          hinting, sub-pixel antialiasing, and lazy-loaded heroes will light up a 0.0 threshold
          every time — and trains the team to ignore the alert.
        </p>
        <p>
          ShipCheck’s visual diff lets you raise tolerance just enough to absorb noise while
          still catching real layout shifts. Prefer comparing stable viewports, hide known
          dynamic regions when you can, and treat diffs as evidence — not the only gate.
        </p>
        <p>
          For “is the checkout path still clickable?”, start with{" "}
          <PublishedBlogLink
            href="/blog/catch-broken-flows-before-customers"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            browser smoke tests
          </PublishedBlogLink>{" "}
          instead of screenshots alone.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
