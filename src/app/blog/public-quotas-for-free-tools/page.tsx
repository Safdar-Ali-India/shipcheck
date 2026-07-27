import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/public-quotas-for-free-tools";

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

export default function PublicQuotasPage() {
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
          A free browser tool without quotas will be used as someone else’s CI farm by lunch.
          Burst limits stop hammering; daily limits keep costs predictable. Return clear 429s
          with Retry-After so honest clients can back off.
        </p>
        <p>
          Validate request bodies before you burn a slot — bad JSON should not count against
          the daily budget. That small reorder matters more than another marketing banner.
        </p>
        <p>
          For the runtime side of the same free-tier story, see{" "}
          <PublishedBlogLink
            href="/blog/playwright-on-vercel-hobby"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            Playwright on Vercel Hobby
          </PublishedBlogLink>
          .
        </p>
      </div>
    </article>
  );
}
