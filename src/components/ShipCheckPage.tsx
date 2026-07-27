import { CompareTool } from "@/components/compare/CompareTool";
import { BrowserTestTool } from "@/components/browser-test/BrowserTestTool";
import { BlogSpotlight } from "@/components/blog/BlogSpotlight";
import { ToolHeader } from "@/components/layout/ToolHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SeoSection } from "@/components/seo/SeoSection";
import { FeatureCards, UseCasesSection } from "@/components/marketing/FeatureCards";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";

export function ShipCheckPage() {
  return (
    <div className="tool-shell min-h-screen">
      <ToolHeader />

      <HeroSection />

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-8">
        <section id="ai-test" className="scroll-mt-20">
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Primary tool
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Paste a URL — ShipCheck tests it for you
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              Auto-explores pages, fills safe forms, and returns a step report with
              screenshots. Optional plain-English instructions in Advanced.
            </p>
          </div>
          <BrowserTestTool />
        </section>

        <HowItWorks />

        <section id="visual-diff" className="scroll-mt-20">
          <details className="rounded-2xl border border-zinc-200 bg-white open:pb-6 dark:border-zinc-800 dark:bg-zinc-950">
            <summary className="cursor-pointer list-none px-6 py-5 sm:px-8">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
                    Optional · Visual regression
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-2xl">
                    Compare screenshots pixel by pixel
                  </h2>
                  <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                    Upload images or paste URLs when you need a UI diff — expand to open.
                  </p>
                </div>
                <span className="mt-3 text-sm font-medium text-violet-600 dark:text-violet-400 sm:mt-0">
                  Open visual diff →
                </span>
              </div>
            </summary>
            <div className="border-t border-zinc-200 px-4 pt-6 dark:border-zinc-800 sm:px-6">
              <CompareTool />
            </div>
          </details>
        </section>
      </main>

      <BlogSpotlight />
      <FeatureCards />
      <UseCasesSection />
      <SeoSection />
      <SiteFooter />
    </div>
  );
}
