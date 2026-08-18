import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/catch-broken-flows-before-customers";

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

export default function CatchBrokenFlowsPage() {
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

      <div className="prose-ship mt-8 space-y-4 text-zinc-700 dark:text-zinc-300">
        <p>
          Most “it worked on my machine” bugs are flow bugs: a button that never navigates, a
          form that submits into an empty state, a redirect that only fails on mobile. Waiting
          for a customer to open a support ticket is the expensive way to find them.
        </p>
        <p>
          ShipCheck’s free browser smoke test opens a real Chromium session, walks a few pages,
          fills safe forms, and returns a step report with screenshots. No signup, no SDK, no
          CI project to babysit for a quick check.
        </p>
        <p>
          Pair that with{" "}
          <PublishedBlogLink
            href="/blog/visual-diffs-without-flake-tax"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            careful visual diffs
          </PublishedBlogLink>{" "}
          when the risk is layout, not just navigation. Use smoke for “does it work?” and pixels
          for “does it still look right?”
        </p>
        <p>
          Upcoming deep-dives cover{" "}
          <PublishedBlogLink
            href="/blog/playwright-on-vercel-hobby"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            running Playwright on Vercel Hobby
          </PublishedBlogLink>{" "}
          and{" "}
          <PublishedBlogLink
            href="/blog/safe-form-filling-in-smoke-tests"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            safe form filling
          </PublishedBlogLink>
          — those go live on our Tue/Thu schedule.
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
