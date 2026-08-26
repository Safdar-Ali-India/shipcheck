import Link from "next/link";
import { getAdjacentPosts } from "@/data/blog-posts";

export function PostNav({ href }: { href: string }) {
  const { newer, older } = getAdjacentPosts(href);
  if (!newer && !older) return null;

  return (
    <nav
      aria-label="More posts"
      className="mt-12 grid gap-4 border-t border-zinc-200 pt-6 text-sm dark:border-zinc-800 sm:grid-cols-2"
    >
      {older ? (
        <Link href={older.href} className="group block">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Older</span>
          <span className="mt-1 block font-medium text-zinc-900 group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-300">
            {older.title}
          </span>
        </Link>
      ) : (
        <span />
      )}
      {newer ? (
        <Link href={newer.href} className="group block sm:text-right">
          <span className="text-xs uppercase tracking-wide text-zinc-500">Newer</span>
          <span className="mt-1 block font-medium text-zinc-900 group-hover:text-violet-700 dark:text-zinc-100 dark:group-hover:text-violet-300">
            {newer.title}
          </span>
        </Link>
      ) : null}
    </nav>
  );
}
