import Link from "next/link";
import { ToolHeader } from "@/components/layout/ToolHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default function NotFound() {
  return (
    <div className="tool-shell min-h-screen">
      <ToolHeader />
      <main className="mx-auto max-w-xl px-4 py-24 text-center">
        <p className="text-sm font-medium text-violet-600 dark:text-violet-400">404</p>
        <h1 className="mt-2 text-3xl font-bold text-zinc-900 dark:text-zinc-50">
          That page is not live
        </h1>
        <p className="mt-3 text-zinc-600 dark:text-zinc-400">
          It may be scheduled, removed, or mistyped. Published writing is on the blog.
        </p>
        <div className="mt-8 flex justify-center gap-3">
          <Link
            href="/"
            className="rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white hover:bg-violet-700"
          >
            Home
          </Link>
          <Link
            href="/blog"
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-800 hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-100 dark:hover:bg-zinc-900"
          >
            Blog
          </Link>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}
