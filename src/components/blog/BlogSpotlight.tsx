import Link from "next/link";
import { getSpotlightPosts } from "@/data/blog-posts";

export function BlogSpotlight() {
  const posts = getSpotlightPosts();
  if (posts.length === 0) return null;

  return (
    <section className="mx-auto max-w-7xl px-4 py-12" aria-labelledby="blog-spotlight">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-violet-600 dark:text-violet-400">From the blog</p>
          <h2
            id="blog-spotlight"
            className="mt-1 text-2xl font-bold text-zinc-900 dark:text-zinc-50"
          >
            Recent writing
          </h2>
        </div>
        <Link
          href="/blog"
          className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          All posts →
        </Link>
      </div>
      <ul className="grid gap-6 sm:grid-cols-3">
        {posts.map((post) => {
          const isExternal = !post.native;
          const card = (
            <>
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {post.date}
                {post.minutes ? ` · ${post.minutes} min` : ""}
              </p>
              <h3 className="mt-2 text-base font-semibold text-zinc-900 group-hover:text-violet-700 dark:text-zinc-50 dark:group-hover:text-violet-300">
                {post.title}
              </h3>
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
                  className="group block rounded-xl border border-zinc-200 p-4 transition-colors hover:border-violet-300 dark:border-zinc-800 dark:hover:border-violet-800"
                >
                  {card}
                </a>
              ) : (
                <Link
                  href={post.href}
                  className="group block rounded-xl border border-zinc-200 p-4 transition-colors hover:border-violet-300 dark:border-zinc-800 dark:hover:border-violet-800"
                >
                  {card}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
