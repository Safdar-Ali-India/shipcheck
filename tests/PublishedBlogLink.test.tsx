import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { PublishedBlogLink } from "@/components/blog/PublishedBlogLink";

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    className,
  }: {
    href: string;
    children: React.ReactNode;
    className?: string;
  }) => (
    <a href={href} className={className}>
      {children}
    </a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe("PublishedBlogLink", () => {
  it("renders a link for published native posts", () => {
    vi.setSystemTime(new Date("2026-07-27T12:00:00+05:30"));
    render(
      <PublishedBlogLink href="/blog/catch-broken-flows-before-customers">
        Live post
      </PublishedBlogLink>,
    );
    const link = screen.getByRole("link", { name: "Live post" });
    expect(link.getAttribute("href")).toBe(
      "/blog/catch-broken-flows-before-customers",
    );
  });

  it("renders a span for unpublished scheduled posts", () => {
    vi.setSystemTime(new Date("2026-07-27T12:00:00+05:30"));
    const { container } = render(
      <PublishedBlogLink href="/blog/playwright-on-vercel-hobby">
        Future post
      </PublishedBlogLink>,
    );
    expect(screen.queryByRole("link")).toBeNull();
    expect(container.querySelector("span")?.textContent).toBe("Future post");
  });
});
