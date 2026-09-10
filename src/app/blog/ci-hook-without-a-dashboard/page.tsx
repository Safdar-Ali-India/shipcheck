import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/ci-hook-without-a-dashboard";

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

export default function CiHookPage() {
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
          The browser UI is for a human pasting a URL. A pipeline wants the same run with a
          token and a status code. POST /api/browser-test/ci accepts a URL, optional mode and
          viewport, and returns ok, shareUrl, and the summary. A bad token is 401 and does not
          start Chromium.
        </p>
        <p>
          Put CI_HOOK_TOKEN in the project secrets, send it as x-ci-token, and fail the job
          when ok is false. Pass notifyWebhook if Slack should see the share link. The quota
          on the hook is separate from the public browser-test limit, so a noisy deploy does
          not lock you out of the website.
        </p>
        <p>
          Invalid JSON does not burn a quota slot. That detail is the same idea as{" "}
          <PublishedBlogLink
            href="/blog/public-quotas-for-free-tools"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            public quotas
          </PublishedBlogLink>
          : count the runs that actually cost a browser, not the typos.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
