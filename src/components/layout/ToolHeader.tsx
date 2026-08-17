"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Moon, Sun, Ship } from "lucide-react";
import { useTheme } from "next-themes";
import { BRAND } from "@/lib/constants";
import { Button } from "@/components/ui/button";

export function ToolHeader() {
  const { resolvedTheme, setTheme } = useTheme();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const onBlog = pathname.startsWith("/blog");

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200/80 bg-white/80 backdrop-blur-lg dark:border-zinc-800 dark:bg-zinc-950/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold text-zinc-900 dark:text-zinc-50">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white">
            <Ship className="h-4 w-4" />
          </div>
          <span>{BRAND.name}</span>
        </Link>

        <nav className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400 sm:gap-4">
          <Link
            href="/#ai-test"
            className="hidden hover:text-violet-600 dark:hover:text-violet-400 sm:inline"
          >
            AI test
          </Link>
          <Link
            href="/#visual-diff"
            className="hidden hover:text-violet-600 dark:hover:text-violet-400 sm:inline"
          >
            Visual diff
          </Link>
          <Link
            href="/blog"
            aria-current={onBlog ? "page" : undefined}
            className={
              onBlog
                ? "font-medium text-violet-700 dark:text-violet-300"
                : "hover:text-violet-600 dark:hover:text-violet-400"
            }
          >
            Blog
          </Link>
        </nav>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
          aria-label="Toggle theme"
          suppressHydrationWarning
        >
          {!mounted ? (
            <Sun className="h-4 w-4 opacity-0" aria-hidden />
          ) : (
            <>
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </>
          )}
        </Button>
      </div>
    </header>
  );
}
