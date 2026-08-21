import { describe, expect, it } from "vitest";
import { getAdjacentPosts } from "@/data/blog-posts";
import { buildPublishedBlogRss } from "@/lib/blogFeed";

describe("blog RSS", () => {
  it("includes native posts that are already published", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    const xml = buildPublishedBlogRss(now);
    expect(xml).toContain("/blog/catch-broken-flows-before-customers");
    expect(xml).toContain("/blog/visual-diffs-without-flake-tax");
    expect(xml).toContain('rel="self"');
    expect(xml).toContain("4 min read");
    expect(xml).not.toContain("/blog/playwright-on-vercel-hobby");
    expect(xml).not.toContain("dev.to");
  });

  it("adds a post after its IST publish instant", () => {
    const xml = buildPublishedBlogRss(new Date("2026-08-20T09:00:00+05:30"));
    expect(xml).toContain("/blog/viewport-smoke-checks");
    expect(xml).toContain("Thu, 20 Aug 2026");
  });

  it("lists a self link and the minute estimate when a post has one", () => {
    const xml = buildPublishedBlogRss(new Date("2026-08-20T09:00:00+05:30"));
    expect(xml).toContain('rel="self"');
    expect(xml).toContain("min read");
  });
});

describe("getAdjacentPosts", () => {
  it("only returns neighbors that are published", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    const { newer, older } = getAdjacentPosts(
      "/blog/catch-broken-flows-before-customers",
      now,
    );
    expect(older).toBeUndefined();
    expect(newer?.href).toBe("/blog/visual-diffs-without-flake-tax");
  });
});
