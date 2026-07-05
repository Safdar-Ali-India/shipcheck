import { CompareTool } from "@/components/compare/CompareTool";
import { BrowserTestTool } from "@/components/browser-test/BrowserTestTool";
import { ToolHeader } from "@/components/layout/ToolHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SeoSection } from "@/components/seo/SeoSection";
import { FeatureCards, UseCasesSection } from "@/components/marketing/FeatureCards";
import { HeroSection } from "@/components/marketing/HeroSection";
import { HowItWorks } from "@/components/marketing/HowItWorks";
import { BRAND } from "@/lib/constants";

export function ShipCheckPage() {
  return (
    <div className="tool-shell min-h-screen">
      <ToolHeader />

      <div className="sr-only">
        <h1>ShipCheck — Free AI Browser Testing Tool</h1>
        <p>{BRAND.tagline}</p>
      </div>

      <HeroSection />
      <HowItWorks />

      <main className="mx-auto max-w-7xl space-y-16 px-4 py-8">
        <section id="ai-test" className="scroll-mt-20">
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
              AI browser testing
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Test your app in plain English
            </h2>
          </div>
          <BrowserTestTool />
        </section>

        <section id="visual-diff" className="scroll-mt-20">
          <div className="mb-6 text-center">
            <p className="text-sm font-medium text-violet-600 dark:text-violet-400">
              Visual regression
            </p>
            <h2 className="mt-2 text-2xl font-bold text-zinc-900 dark:text-zinc-50 sm:text-3xl">
              Compare screenshots pixel by pixel
            </h2>
            <p className="mx-auto mt-2 max-w-xl text-sm text-zinc-500 dark:text-zinc-400">
              Upload images or paste URLs to detect UI differences instantly.
            </p>
          </div>
          <CompareTool />
        </section>
      </main>

      <FeatureCards />
      <UseCasesSection />
      <SeoSection />
      <SiteFooter />
    </div>
  );
}
