import { Bot, Globe2, ScanSearch, ShieldCheck } from "lucide-react";
import { HOW_IT_WORKS_STEPS } from "@/lib/constants";

const STEP_ICONS = [Globe2, Bot, ScanSearch, ShieldCheck];

export function HowItWorks() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <p className="text-center text-sm font-medium uppercase tracking-wider text-violet-600 dark:text-violet-400">
        How it works
      </p>
      <h2 className="mt-2 text-center text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
        Catch bugs before your users do
      </h2>
      <p className="mx-auto mt-3 max-w-2xl text-center text-zinc-500 dark:text-zinc-400">
        No test scripts. No signup. Paste a URL — ShipCheck auto-explores your site in a real
        browser and returns a clear report.
      </p>

      <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {HOW_IT_WORKS_STEPS.map((step, index) => {
          const Icon = STEP_ICONS[index] ?? Bot;
          return (
            <div
              key={step.title}
              className="relative rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <span className="text-xs font-semibold uppercase tracking-wider text-violet-600 dark:text-violet-400">
                {String(index + 1).padStart(2, "0")}
              </span>
              <div className="mt-4 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-zinc-900 dark:text-zinc-50">
                {step.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {step.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}
