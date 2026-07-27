import Link from "next/link";
import { EXTERNAL_LINKS, FOOTER_LINKS } from "@/lib/links";
import { BRAND } from "@/lib/constants";

export function SiteFooter() {
  return (
    <footer className="mt-8 border-t border-zinc-200/80 py-8 dark:border-zinc-800">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            {BRAND.name}
          </span>
          <span className="mx-2 text-zinc-300 dark:text-zinc-700">|</span>
          Built by{" "}
          <a
            href={EXTERNAL_LINKS.portfolio}
            className="font-medium text-violet-700 hover:underline dark:text-violet-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Safdar Ali
          </a>
          {" — "}
          <a
            href={EXTERNAL_LINKS.portfolio}
            className="text-zinc-500 hover:underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            safdarali.in
          </a>
        </p>

        <nav
          className="mt-4 flex flex-wrap items-center justify-center gap-4"
          aria-label="Footer links"
        >
          <Link
            href="/blog"
            className="text-sm text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400"
          >
            Blog
          </Link>
          {FOOTER_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400"
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <p className="mt-4 text-xs text-zinc-400">
          © {new Date().getFullYear()} {BRAND.name}. Free AI browser testing.
        </p>
      </div>
    </footer>
  );
}
