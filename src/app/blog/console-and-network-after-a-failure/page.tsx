import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { PostNav } from "@/components/blog/PostNav";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/console-and-network-after-a-failure";

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

export default function ConsoleAfterFailurePage() {
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
          A timeout on a click usually means the control never became visible, not that
          Playwright is flaky. Open the console tab for the step first. Hydration errors,
          blocked scripts, and a failed analytics request are common noise — a 500 on the
          document or the API the button calls is the one to trust.
        </p>
        <p>
          The network table is filtered by URL. Search for the path you expected, then check
          status and timing. A request that never left the page means the click did not run
          your handler. A request that returned 404 means the route itself is the bug.
        </p>
        <p>
          Copy the console or network JSON from the report and paste it on the ticket. That
          is more useful than a second screenshot of the same blank state.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
