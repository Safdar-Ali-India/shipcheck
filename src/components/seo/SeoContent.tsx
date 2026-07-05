import { FAQ_ITEMS } from "@/lib/constants";

export function SeoContent() {
  return (
    <div className="space-y-10 p-6 text-zinc-600 dark:text-zinc-400">
      <article>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          How to compare screenshots with ShipCheck
        </h2>
        <ol className="mt-4 list-decimal space-y-3 pl-5 text-base leading-relaxed">
          <li>
            <strong>Choose your input mode</strong> — upload two PNG, JPEG, or WebP
            images, or paste two live webpage URLs to capture screenshots automatically.
          </li>
          <li>
            <strong>Configure comparison</strong> — select a viewport for URL mode
            (desktop, tablet, or mobile) and adjust the tolerance threshold to ignore
            minor anti-aliasing differences.
          </li>
          <li>
            <strong>Run the visual diff</strong> — ShipCheck compares images
            pixel-by-pixel using the Canvas API and highlights changed areas in red.
          </li>
          <li>
            <strong>Review and export</strong> — switch between side-by-side, overlay,
            diff-only, and split views. Download the diff as PNG or a JSON report.
          </li>
        </ol>
      </article>

      <article>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-50">
          Why use ShipCheck for visual regression testing?
        </h2>
        <ul className="mt-4 list-disc space-y-2 pl-5 text-base leading-relaxed">
          <li>100% free — no signup, no watermarks, no usage caps for standard comparisons</li>
          <li>Uploads processed in-browser — your images never leave your device</li>
          <li>URL mode captures full-page screenshots with Playwright</li>
          <li>Precise diff percentage and changed pixel count for CI-friendly reports</li>
          <li>Works on desktop, tablet, and mobile viewports</li>
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
