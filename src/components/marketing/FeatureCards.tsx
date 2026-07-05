import { Scan, Globe, Layout, Download, Bot } from "lucide-react";
import { FEATURE_CARDS, USE_CASES } from "@/lib/constants";

const ICONS = {
  scan: Scan,
  globe: Globe,
  layout: Layout,
  download: Download,
  bot: Bot,
} as const;

export function FeatureCards() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-center text-2xl font-bold text-zinc-900 dark:text-zinc-50">
        Bring your testing to another level
      </h2>
      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {FEATURE_CARDS.map((feature) => {
          const Icon = ICONS[feature.icon];
          return (
            <div
              key={feature.title}
              className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-violet-100 text-violet-600 dark:bg-violet-950 dark:text-violet-400">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-semibold text-zinc-900 dark:text-zinc-50">
                {feature.title}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function UseCasesSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">Use cases</h2>
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {USE_CASES.map((item) => (
          <li
            key={item}
            className="rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm text-zinc-600 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-400"
          >
            {item}
          </li>
        ))}
      </ul>
    </section>
  );
}
