import type { Metadata } from "next";
import type { ReactNode } from "react";
import { ToolHeader } from "@/components/layout/ToolHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  alternates: {
    types: {
      "application/rss+xml": "/blog/feed.xml",
    },
  },
};

export default function BlogLayout({ children }: { children: ReactNode }) {
  return (
    <div className="tool-shell min-h-screen">
      <ToolHeader />
      <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">{children}</main>
      <SiteFooter />
    </div>
  );
}
