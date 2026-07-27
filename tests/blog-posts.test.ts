import fs from "node:fs";
import path from "node:path";
import { afterEach, describe, expect, it, vi } from "vitest";
import {
  blogPosts,
  getNativeBlogPosts,
  getPostByHref,
  getPublishedPosts,
  getSpotlightPosts,
} from "@/data/blog-posts";
import { requirePublishedBlogPost } from "@/lib/require-published-blog-post";
import sitemap from "@/app/sitemap";
import { SITE_URL } from "@/lib/constants";

const notFound = vi.fn(() => {
  throw new Error("NEXT_NOT_FOUND");
});

vi.mock("next/navigation", () => ({
  notFound: () => notFound(),
}));

afterEach(() => {
  notFound.mockClear();
});

describe("blog post accessors", () => {
  it("excludes future native posts from getPublishedPosts", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    const published = getPublishedPosts(now);
    expect(published.some((p) => p.href === "/blog/playwright-on-vercel-hobby")).toBe(
      false,
    );
    expect(
      published.some((p) => p.href === "/blog/catch-broken-flows-before-customers"),
    ).toBe(true);
  });

  it("includes scheduled posts after their IST instant", () => {
    const now = new Date("2026-07-28T09:00:00+05:30");
    const published = getPublishedPosts(now);
    expect(published.some((p) => p.href === "/blog/playwright-on-vercel-hobby")).toBe(
      true,
    );
  });

  it("getNativeBlogPosts returns only published native articles", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    const native = getNativeBlogPosts(now);
    expect(native.every((p) => p.native === true)).toBe(true);
    expect(native.every((p) => !p.href.startsWith("http"))).toBe(true);
    expect(native.length).toBe(2);
  });

  it("getPostByHref adds SEO fields only when published", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    expect(getPostByHref("/blog/playwright-on-vercel-hobby", now)).toBeUndefined();
    const live = getPostByHref("/blog/catch-broken-flows-before-customers", now);
    expect(live?.seoDatePublished).toBe("2026-06-10");
    expect(live?.seoPublishedTime).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("getSpotlightPosts returns published native + DEV + Medium", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    const spotlight = getSpotlightPosts(now);
    expect(spotlight).toHaveLength(3);
    expect(spotlight.some((p) => p.native)).toBe(true);
    expect(spotlight.some((p) => p.source === "dev")).toBe(true);
    expect(spotlight.some((p) => p.source === "medium")).toBe(true);
  });
});

describe("native pages exist", () => {
  it("every native post has a matching app/blog/[slug]/page.tsx", () => {
    const natives = blogPosts.filter((p) => p.native === true);
    for (const post of natives) {
      const slug = post.href.replace(/^\/blog\//, "");
      const pagePath = path.join(
        process.cwd(),
        "src/app/blog",
        slug,
        "page.tsx",
      );
      expect(fs.existsSync(pagePath), `missing page for ${post.href}`).toBe(true);
      const source = fs.readFileSync(pagePath, "utf8");
      expect(source).toContain("requirePublishedBlogPost");
      expect(source).toContain(post.href);
    }
  });
});

describe("requirePublishedBlogPost", () => {
  it("returns live native posts", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    const post = requirePublishedBlogPost(
      "/blog/catch-broken-flows-before-customers",
      now,
    );
    expect(post.title).toMatch(/broken flows/i);
  });

  it("calls notFound for future posts", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    expect(() =>
      requirePublishedBlogPost("/blog/playwright-on-vercel-hobby", now),
    ).toThrow("NEXT_NOT_FOUND");
    expect(notFound).toHaveBeenCalled();
  });

  it("calls notFound for unknown hrefs", () => {
    expect(() => requirePublishedBlogPost("/blog/does-not-exist")).toThrow(
      "NEXT_NOT_FOUND",
    );
  });
});

describe("sitemap", () => {
  it("includes only published native URLs", () => {
    const now = new Date("2026-07-27T12:00:00+05:30");
    vi.setSystemTime(now);
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls).toContain(`${SITE_URL}/blog`);
    expect(urls).toContain(
      `${SITE_URL}/blog/catch-broken-flows-before-customers`,
    );
    expect(urls).not.toContain(`${SITE_URL}/blog/playwright-on-vercel-hobby`);
    vi.useRealTimers();
  });
});
