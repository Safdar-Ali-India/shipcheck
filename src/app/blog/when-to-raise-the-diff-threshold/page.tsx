import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { ArticleByline } from "@/components/blog/ArticleByline";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/when-to-raise-the-diff-threshold";

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

export default function DiffThresholdPage() {
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
      <ArticleByline date={post.date} minutes={post.minutes} />
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        {post.title}
      </h1>
      <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
      <div className="mt-8 space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>
          ShipCheck’s visual diff starts at a 0.10 tolerance. That ignores a little
          anti-aliasing and still flags a shifted hero or a missing button. If two screenshots
          of the same page fail only on font edges, nudge the slider up and rerun before you
          treat it as a regression.
        </p>
        <p>
          Do not raise the threshold to hide a real layout change. If the diff concentrates on
          one region — a nav, a price, a banner — that is the bug. Crop or compare that region
          instead of flattening the whole page into a pass.
        </p>
        <p>
          For “does the control still work?”, use{" "}
          <PublishedBlogLink
            href="/blog/catch-broken-flows-before-customers"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            a browser smoke test
          </PublishedBlogLink>
          . Pixels will not tell you the form submitted.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
