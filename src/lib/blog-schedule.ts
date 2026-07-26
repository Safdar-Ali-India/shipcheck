/** IST offset used for date-only publish boundaries. */
export const IST_OFFSET = "+05:30";

const DATE_ONLY_RE = /^\d{4}-\d{2}-\d{2}$/;
const SLOT_START_YMD = "2026-06-02"; // first Tue 09:00 IST slot

/**
 * Returns UTC epoch ms when a post becomes visible.
 * - `YYYY-MM-DD` → midnight IST that day
 * - full ISO with offset → that exact instant
 */
export function getPublishInstant(publishedAt: string): number {
  const value = publishedAt.trim();
  if (DATE_ONLY_RE.test(value)) {
    return Date.parse(`${value}T00:00:00${IST_OFFSET}`);
  }
  const ms = Date.parse(value);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid publishedAt: ${publishedAt}`);
  }
  return ms;
}

export function isPublished(
  publishedAt: string,
  now: Date = new Date(),
): boolean {
  return now.getTime() >= getPublishInstant(publishedAt);
}

export function sortByPublishedDesc<T extends { publishedAt: string }>(
  posts: T[],
): T[] {
  return [...posts].sort(
    (a, b) => getPublishInstant(b.publishedAt) - getPublishInstant(a.publishedAt),
  );
}

/** `YYYY-MM-DD` for SEO / JSON-LD datePublished. */
export function publishedAtDateOnly(publishedAt: string): string {
  const value = publishedAt.trim();
  if (DATE_ONLY_RE.test(value)) return value;
  const ms = getPublishInstant(value);
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date(ms));
}

/** ISO-8601 string for Open Graph article:published_time. */
export function toOpenGraphPublishedTime(publishedAt: string): string {
  return new Date(getPublishInstant(publishedAt)).toISOString();
}

/**
 * Tue/Thu 09:00 IST slots starting 2026-06-02.
 * slot 0 = Tue Jun 2, slot 1 = Thu Jun 4, slot 2 = Tue Jun 9, …
 */
export function scheduleSlotAt0900Ist(slotIndex: number): string {
  if (!Number.isInteger(slotIndex) || slotIndex < 0) {
    throw new Error(`slotIndex must be a non-negative integer, got ${slotIndex}`);
  }

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

export function displayMonthYear(publishedAt: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  }).format(new Date(getPublishInstant(publishedAt)));
}
