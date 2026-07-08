import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative mx-auto max-w-7xl px-4 pb-6 pt-12 text-center sm:pt-14">
      <div className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-violet-50 px-3 py-1 text-xs font-medium text-violet-700 dark:border-violet-900 dark:bg-violet-950/50 dark:text-violet-300">
        <Sparkles className="h-3.5 w-3.5" />
        Free browser smoke tests — no signup required
      </div>

      <h1 className="mx-auto mt-6 max-w-4xl text-4xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 sm:text-5xl lg:text-6xl">
        Catch broken flows{" "}
        <span className="bg-gradient-to-r from-violet-600 to-indigo-500 bg-clip-text text-transparent">
          before customers do
        </span>
      </h1>

      <p className="mx-auto mt-5 max-w-2xl text-lg text-zinc-500 dark:text-zinc-400">
        Paste any website URL. ShipCheck opens a real browser, explores pages, fills safe
        forms, and returns screenshots plus a clear pass/fail report — free.
      </p>

      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        <Button asChild size="lg">
          <Link href="#ai-test">
            Test a site now
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="secondary" size="lg">
          <Link href="#sample-report">See sample report</Link>
        </Button>
      </div>

      <p className="mt-4 text-sm text-zinc-500">
        One click · No credit card · No account
      </p>
    </section>
  );
}
