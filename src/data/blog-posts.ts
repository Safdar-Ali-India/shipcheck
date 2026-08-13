import {
  displayMonthYear,
  isPublished,
  publishedAtDateOnly,
  sortByPublishedDesc,
  toOpenGraphPublishedTime,
} from "@/lib/blog-schedule";

export type BlogPost = {
  title: string;
  href: string;
  excerpt: string;
  /** Display label, e.g. "Jun 2026" */
  date: string;
  /** Controls visibility — date-only or full IST datetime */
  publishedAt: string;
  /** On-site article when true; otherwise external Medium/DEV/etc. */
  native?: boolean;
  source?: "shipcheck" | "medium" | "dev";
  /** Rough reading time in minutes for native posts. */
  minutes?: number;
};

/**
 * Central catalog. Live posts use date-only publishedAt.
 * Future posts use Tue/Thu 09:00 IST datetimes — they appear automatically
 * at request time (force-dynamic), no redeploy.
 */
export const blogPosts: BlogPost[] = [
  {
    title: "Catch broken flows before customers do",
    href: "/blog/catch-broken-flows-before-customers",
    excerpt:
      "Why a free, no-signup browser smoke test beats hoping staging equals production.",
    date: "Jun 2026",
    publishedAt: "2026-06-10",
    native: true,
    source: "shipcheck",
    minutes: 4,
  },
  {
    title: "Visual diffs without the flake tax",
    href: "/blog/visual-diffs-without-flake-tax",
    excerpt:
      "Pixel compares that stay useful: thresholds, anti-aliasing, and when not to fail the build.",
    date: "Jun 2026",
    publishedAt: "2026-06-17",
    native: true,
    source: "shipcheck",
    minutes: 4,
  },
  {
    title: "Plain-English browser tests on ShipCheck",
    href: "https://dev.to/safdarali/plain-english-browser-tests",
    excerpt:
      "How ShipCheck turns short instructions into real Chromium clicks and asserts.",
    date: "Jun 2026",
    publishedAt: "2026-06-12",
    native: false,
    source: "dev",
  },
  {
    title: "Smoke-testing public sites without a CI bill",
    href: "https://medium.com/@safdarali/smoke-testing-public-sites",
    excerpt:
      "Paste a URL, get screenshots and a pass/fail report — no runners to babysit.",
    date: "Jun 2026",
    publishedAt: "2026-06-19",
    native: false,
    source: "medium",
  },
  {
    title: "Playwright on Vercel Hobby without OOM kills",
    href: "/blog/playwright-on-vercel-hobby",
    excerpt:
      "Memory caps, video skip, and lighter crawls so serverless Chromium survives 1GB.",
    date: "Jul 2026",
    publishedAt: "2026-07-28T09:00:00+05:30",
    native: true,
    source: "shipcheck",
    minutes: 4,
  },
  {
    title: "Safe form filling in automated smoke tests",
    href: "/blog/safe-form-filling-in-smoke-tests",
    excerpt:
      "Skip login and payment, fill the rest, and keep public tools from doing harm.",
    date: "Jul 2026",
    publishedAt: "2026-07-30T09:00:00+05:30",
    native: true,
    source: "shipcheck",
    minutes: 4,
  },
  {
    title: "Shareable test reports without accounts",
    href: "/blog/shareable-test-reports",
    excerpt:
      "Ephemeral share links, JSON export, and why bug reports should travel light.",
    date: "Aug 2026",
    publishedAt: "2026-08-04T09:00:00+05:30",
    native: true,
    source: "shipcheck",
    minutes: 3,
  },
  {
    title: "Public quotas for free browser testing tools",
    href: "/blog/public-quotas-for-free-tools",
    excerpt:
      "Burst + daily limits that protect the free tier without killing honest use.",
    date: "Aug 2026",
    publishedAt: "2026-08-06T09:00:00+05:30",
    native: true,
    source: "shipcheck",
    minutes: 4,
  },
];

export type SeoBlogPost = BlogPost & {
  seoDatePublished: string;
  seoPublishedTime: string;
};

export function getPublishedPosts(now: Date = new Date()): BlogPost[] {
  return sortByPublishedDesc(
    blogPosts.filter((post) => isPublished(post.publishedAt, now)),
  );
}

export function getNativeBlogPosts(now: Date = new Date()): BlogPost[] {
  return getPublishedPosts(now).filter((post) => post.native === true);
}

export function getPostByHref(
  href: string,
  now: Date = new Date(),
): SeoBlogPost | undefined {
  const post = blogPosts.find((p) => p.href === href);
  if (!post || !isPublished(post.publishedAt, now)) return undefined;
  return {
    ...post,
    seoDatePublished: publishedAtDateOnly(post.publishedAt),
    seoPublishedTime: toOpenGraphPublishedTime(post.publishedAt),
  };
}

/** Newer and older native posts that are already published. */
export function getAdjacentPosts(href: string, now: Date = new Date()) {
  const native = getNativeBlogPosts(now);
  const index = native.findIndex((post) => post.href === href);
  if (index < 0) return { newer: undefined, older: undefined };
  return {
    newer: native[index - 1],
    older: native[index + 1],
  };
}

/** Homepage: one native + one DEV + one Medium when each is published. */
export function getSpotlightPosts(now: Date = new Date()): BlogPost[] {
  const published = getPublishedPosts(now);
  const native = published.find((p) => p.native === true);
  const dev = published.find((p) => p.source === "dev");
  const medium = published.find((p) => p.source === "medium");
  return [native, dev, medium].filter((p): p is BlogPost => Boolean(p));
}

export function syncDisplayDate(post: BlogPost): BlogPost {
  return { ...post, date: displayMonthYear(post.publishedAt) };
}
