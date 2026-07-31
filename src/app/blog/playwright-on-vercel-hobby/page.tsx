import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { ArticleByline } from "@/components/blog/ArticleByline";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/playwright-on-vercel-hobby";

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

export default function PlaywrightVercelPage() {
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
          Free Vercel functions give you about 1GB of RAM. Full Chromium plus a heavy marketing
          site plus video recording will close the browser mid-run. That is not a flake — it is
          physics.
        </p>
        <p>
          ShipCheck softens the hosted path: shorter timeouts, fewer pages, no video when ffmpeg
          is missing, and blocked image/font media where it is safe. Local runs can still record
          richer sessions.
        </p>
        <p>
          If you are designing public tooling, also read{" "}
          <PublishedBlogLink
            href="/blog/public-quotas-for-free-tools"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            public quotas for free tools
          </PublishedBlogLink>{" "}
          so one IP cannot burn the whole budget.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
