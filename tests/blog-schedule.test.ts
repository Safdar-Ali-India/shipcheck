import { describe, expect, it, vi } from "vitest";
import {
  getPublishInstant,
  isPublished,
  publishedAtDateOnly,
  scheduleSlotAt0900Ist,
  sortByPublishedDesc,
  toOpenGraphPublishedTime,
} from "@/lib/blog-schedule";

describe("getPublishInstant", () => {
  it("parses date-only as midnight IST, not UTC", () => {
    // 2026-07-01 00:00 IST == 2026-06-30 18:30 UTC
    expect(getPublishInstant("2026-07-01")).toBe(
      Date.parse("2026-07-01T00:00:00+05:30"),
    );
    expect(getPublishInstant("2026-07-01")).toBe(
      Date.parse("2026-06-30T18:30:00.000Z"),
    );
  });

  it("parses full IST datetime at the exact instant", () => {
    expect(getPublishInstant("2026-07-28T09:00:00+05:30")).toBe(
      Date.parse("2026-07-28T03:30:00.000Z"),
    );
  });
});

describe("isPublished", () => {
  it("is false before the publish instant", () => {
    const before = new Date("2026-07-27T23:59:59+05:30");
    expect(isPublished("2026-07-28", before)).toBe(false);
    expect(isPublished("2026-07-28T09:00:00+05:30", before)).toBe(false);
  });

  it("is true at and after the publish instant", () => {
    expect(isPublished("2026-07-28", new Date("2026-07-28T00:00:00+05:30"))).toBe(
      true,
    );
    expect(
      isPublished(
        "2026-07-28T09:00:00+05:30",
        new Date("2026-07-28T09:00:00+05:30"),
      ),
    ).toBe(true);
    expect(
      isPublished(
        "2026-07-28T09:00:00+05:30",
        new Date("2026-07-28T09:00:01+05:30"),
      ),
    ).toBe(true);
  });
});

describe("sortByPublishedDesc", () => {
  it("orders newest publishedAt first", () => {
    const posts = [
      { id: "a", publishedAt: "2026-06-10" },
      { id: "b", publishedAt: "2026-07-28T09:00:00+05:30" },
      { id: "c", publishedAt: "2026-06-17" },
    ];
    expect(sortByPublishedDesc(posts).map((p) => p.id)).toEqual(["b", "c", "a"]);
  });
});

describe("SEO helpers", () => {
  it("publishedAtDateOnly keeps date-only and converts datetimes in IST", () => {
    expect(publishedAtDateOnly("2026-06-10")).toBe("2026-06-10");
    expect(publishedAtDateOnly("2026-07-28T09:00:00+05:30")).toBe("2026-07-28");
  });

  it("toOpenGraphPublishedTime returns ISO UTC", () => {
    expect(toOpenGraphPublishedTime("2026-07-01")).toBe(
      "2026-06-30T18:30:00.000Z",
    );
  });
});

describe("scheduleSlotAt0900Ist", () => {
  it("starts Tue/Thu 09:00 IST from 2026-06-02", () => {
    expect(scheduleSlotAt0900Ist(0)).toBe("2026-06-02T09:00:00+05:30");
    expect(scheduleSlotAt0900Ist(1)).toBe("2026-06-04T09:00:00+05:30");
    expect(scheduleSlotAt0900Ist(2)).toBe("2026-06-09T09:00:00+05:30");
    expect(scheduleSlotAt0900Ist(16)).toBe("2026-07-28T09:00:00+05:30");
  });
});
