import { CompareTool } from "@/components/compare/CompareTool";
import { ToolHeader } from "@/components/layout/ToolHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SeoSection } from "@/components/seo/SeoSection";
import { FeatureCards, UseCasesSection } from "@/components/marketing/FeatureCards";
import { BRAND } from "@/lib/constants";

export function ShipCheckPage() {
  return (
    <div className="tool-shell min-h-screen">
      <ToolHeader />

      <div className="sr-only">
        <h1>ShipCheck — Free Visual Regression Testing Tool</h1>
        <p>{BRAND.tagline}</p>
      </div>

      <section className="mx-auto max-w-7xl px-4 py-8 text-center">
        <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
          Free visual regression testing
        </p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-4xl">
          Compare screenshots. Ship with confidence.
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-base text-zinc-500 dark:text-zinc-400">
          Upload images or paste URLs to detect pixel-level UI differences instantly.
          No signup required.
        </p>
      </section>

      <main className="mx-auto max-w-7xl px-4 py-6">
        <CompareTool />
      </main>

      <FeatureCards />
      <UseCasesSection />
      <SeoSection />
      <SiteFooter />
    </div>
  );
}
