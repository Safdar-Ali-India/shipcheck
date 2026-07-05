"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { SeoContent } from "@/components/seo/SeoContent";

export function SeoSection() {
  const [open, setOpen] = useState(false);

  return (
    <section className="mx-auto max-w-7xl px-4 pb-8">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900"
      >
        <span>How ShipCheck works &amp; FAQ</span>
        <ChevronDown
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="mt-2 rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
          <SeoContent />
        </div>
      )}
    </section>
  );
}
