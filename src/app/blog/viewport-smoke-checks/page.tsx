import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/viewport-smoke-checks";

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

export default function ViewportSmokeChecksPage() {
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
          Desktop is the viewport most people check before a deploy. The production failures
          that show up in support are often a nav item that drops into a menu, a sticky bar
          covering the submit button, or a form that only fits when the keyboard is closed.
        </p>
        <p>
          ShipCheck can rerun the same URL at desktop (1280×720), tablet (768×1024), and
          mobile (390×844). Keep the first run on desktop to see the happy path, then switch
          viewport and look for steps that fail only at the narrow width.
        </p>
        <p>
          Pair that with{" "}
          <PublishedBlogLink
            href="/blog/visual-diffs-without-flake-tax"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            visual diffs
          </PublishedBlogLink>{" "}
          when the layout moved but the clicks still succeeded. A pass without a screenshot is
          a weaker signal on mobile.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
