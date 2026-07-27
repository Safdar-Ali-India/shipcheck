/**
 * Assign Tue/Thu 09:00 IST slots to posts in PUBLISH_ORDER.
 * SKIP_HREFS are already live — their publishedAt is never overwritten.
 *
 * Usage: node scripts/reschedule-blog-posts.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const POSTS_FILE = path.join(__dirname, "../src/data/blog-posts.ts");

/** Already live — do not touch publishedAt. */
const SKIP_HREFS = new Set([
  "/blog/catch-broken-flows-before-customers",
  "/blog/visual-diffs-without-flake-tax",
  "https://dev.to/safdarali/plain-english-browser-tests",
  "https://medium.com/@safdarali/smoke-testing-public-sites",
]);

/** Native posts to place on upcoming Tue/Thu 09:00 IST slots (in order). */
const PUBLISH_ORDER = [
  "/blog/playwright-on-vercel-hobby",
  "/blog/safe-form-filling-in-smoke-tests",
  "/blog/shareable-test-reports",
  "/blog/public-quotas-for-free-tools",
];

const IST_OFFSET = "+05:30";
const SLOT_START_YMD = "2026-06-02";

function scheduleSlotAt0900Ist(slotIndex) {
  const [y, m, d] = SLOT_START_YMD.split("-").map(Number);
  const week = Math.floor(slotIndex / 2);
  const isThursday = slotIndex % 2 === 1;
  const dayOffset = week * 7 + (isThursday ? 2 : 0);
  const target = new Date(Date.UTC(y, m - 1, d + dayOffset));
  const yy = target.getUTCFullYear();
  const mm = String(target.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(target.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}T09:00:00${IST_OFFSET}`;
}

function displayMonthYear(publishedAt) {
  const ms = Date.parse(
    /^\d{4}-\d{2}-\d{2}$/.test(publishedAt)
      ? `${publishedAt}T00:00:00${IST_OFFSET}`
      : publishedAt,
  );
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(ms));
}

function nextOpenSlotIndex(now = new Date()) {
  let i = 0;
  while (Date.parse(scheduleSlotAt0900Ist(i)) <= now.getTime()) i += 1;
  return i;
}

let source = fs.readFileSync(POSTS_FILE, "utf8");
let slot = nextOpenSlotIndex();

for (const href of PUBLISH_ORDER) {
  if (SKIP_HREFS.has(href)) continue;
  const publishedAt = scheduleSlotAt0900Ist(slot);
  const date = displayMonthYear(publishedAt);
  slot += 1;

  const hrefEsc = href.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const blockRe = new RegExp(
    `(\\{[^}]*href:\\s*"${hrefEsc}"[^}]*?)publishedAt:\\s*"[^"]*"([^}]*?)date:\\s*"[^"]*"`,
    "s",
  );
  const altRe = new RegExp(
    `(\\{[^}]*href:\\s*"${hrefEsc}"[^}]*?)date:\\s*"[^"]*"([^}]*?)publishedAt:\\s*"[^"]*"`,
    "s",
  );

  if (blockRe.test(source)) {
    source = source.replace(blockRe, `$1publishedAt: "${publishedAt}"$2date: "${date}"`);
  } else if (altRe.test(source)) {
    source = source.replace(altRe, `$1date: "${date}"$2publishedAt: "${publishedAt}"`);
  } else {
    console.warn(`Could not locate post block for ${href}`);
    continue;
  }
  console.log(`${href} → ${publishedAt} (${date})`);
}

fs.writeFileSync(POSTS_FILE, source);
console.log("Updated", POSTS_FILE);
