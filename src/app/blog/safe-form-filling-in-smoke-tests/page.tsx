import type { Metadata } from "next";
import { getPostByHref } from "@/data/blog-posts";
import { ArticleByline } from "@/components/blog/ArticleByline";
import { PostNav } from "@/components/blog/PostNav";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";
import { articleJsonLd } from "@/lib/blogJsonLd";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import { BRAND, SITE_URL } from "@/lib/constants";

const POST_HREF = "/blog/safe-form-filling-in-smoke-tests";

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

export default function SafeFormFillingPage() {
  const post = requirePublishedBlogPost(POST_HREF);
  const seo = getPostByHref(POST_HREF)!;

  const jsonLd = articleJsonLd(seo);

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
          Auto-explore that submits every form it finds is a liability. Login, payment, and
          password fields must be skipped. Everything else can use boring test values —
          shipcheck-test@example.com, +15555550100 — and still prove the UI accepts input.
        </p>
        <p>
          On the free hosted tier we also skip the actual submit click when sites stall
          (search engines are a common offender). Fill-only keeps the smoke useful without a
          12s timeout tanking the whole run.
        </p>
        <p>
          Related:{" "}
          <PublishedBlogLink
            href="/blog/catch-broken-flows-before-customers"
            className="font-medium text-violet-700 underline-offset-2 hover:underline dark:text-violet-400"
          >
            catching broken flows early
          </PublishedBlogLink>
          .
        </p>
      </div>
      <PostNav href={POST_HREF} />
    </article>
  );
}
