import { FAQ_ITEMS } from "@/lib/constants";

export function SeoContent() {
  return (
    <div className="space-y-10 p-6 text-zinc-600 dark:text-zinc-400">
      <article>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          How to test your website with ShipCheck
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed">
          <li>
            <strong>Paste your URL</strong> — enter any public site. ShipCheck opens it in a
            real headless browser and auto-explores safe pages.
          </li>
          <li>
            <strong>Run auto test (or add instructions)</strong> — one click explores pages
            and forms. For specific flows, add plain-English steps in Advanced.
          </li>
          <li>
            <strong>Review the report</strong> — get a pass/fail verdict, step timeline,
            screenshots, and a downloadable JSON report.
          </li>
        </ol>
      </article>

      <article>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Why use ShipCheck?
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>100% free — no signup, no credit card, no watermarks</li>
          <li>Plain English tests — no Playwright scripts to write or maintain</li>
          <li>Real browser automation with Playwright</li>
          <li>Visual diff tool for pixel-perfect screenshot comparison</li>
          <li>Desktop, tablet, and mobile viewports</li>
        </ul>
      </article>

      <article>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
          Frequently Asked Questions
        </h2>
        <dl className="mt-4 space-y-6">
          {FAQ_ITEMS.map((item) => (
            <div key={item.question}>
              <dt className="font-semibold text-zinc-900 dark:text-zinc-100">
                {item.question}
              </dt>
              <dd className="mt-2 text-base leading-relaxed">{item.answer}</dd>
            </div>
          ))}
        </dl>
      </article>
    </div>
  );
}
