import type { Metadata } from "next";
import Link from "next/link";
import { getNativeBlogPosts, getPublishedPosts } from "@/data/blog-posts";
import { blogIndexJsonLd } from "@/lib/blogJsonLd";
import { estimateReadingMinutes } from "@/lib/blog-schedule";
import { BRAND, SITE_URL } from "@/lib/constants";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: `Blog — ${BRAND.name}`,
  description:
    "Notes on free browser smoke tests, visual diffs, and shipping safer releases with ShipCheck.",
  alternates: { canonical: `${SITE_URL}/blog` },
};

export default function BlogIndexPage() {
  const posts = getPublishedPosts();
  const native = getNativeBlogPosts();

  const itemList = blogIndexJsonLd(native);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemList) }}
      />
      <p className="text-sm font-medium text-violet-600 dark:text-violet-400">Blog</p>
      <h1 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Shipping safer releases
      </h1>
      <p className="mt-3 text-zinc-600 dark:text-zinc-400">
        Practical notes on browser smoke tests, visual diffs, and free public tooling —
        published on a Tue/Thu cadence.{" "}
        <a href="/blog/feed.xml" className="font-medium text-violet-700 hover:underline dark:text-violet-400">
          RSS
        </a>
      </p>

      <ul className="mt-10 space-y-8">
        {posts.map((post) => {
          const isExternal = !post.native;
          const body = (
            <>
              <p className="text-xs font-medium uppercase tracking-wide text-zinc-500">
                {post.date}
                {` · ${post.minutes ?? estimateReadingMinutes(post.excerpt)} min`}
                {post.source === "dev"
                  ? " · DEV"
                  : post.source === "medium"
                    ? " · Medium"
                    : ""}
              </p>
              <h2 className="mt-1 text-xl font-semibold text-zinc-900 group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">{post.excerpt}</p>
            </>
          );

          return (
            <li key={post.href}>
              {isExternal ? (
                <a
                  href={post.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  {body}
                </a>
              ) : (
                <Link href={post.href} className="group block">
                  {body}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      {posts.length === 0 && (
        <p className="mt-10 text-sm text-zinc-500">No posts published yet.</p>
      )}
    </>
  );
}
