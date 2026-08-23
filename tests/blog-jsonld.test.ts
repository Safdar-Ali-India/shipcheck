import { describe, expect, it } from "vitest";
import { blogIndexJsonLd } from "@/lib/blogJsonLd";
import { SITE_URL } from "@/lib/constants";

describe("blogIndexJsonLd", () => {
  it("lists only the posts it is given, in order", () => {
    const json = blogIndexJsonLd([
      {
        title: "First",
        href: "/blog/first",
        excerpt: "a",
        date: "Aug 2026",
        publishedAt: "2026-08-04",
        native: true,
      },
    ]);
    expect(json["@type"]).toBe("ItemList");
    expect(json.itemListElement).toHaveLength(1);
    expect(json.itemListElement[0]?.url).toBe(`${SITE_URL}/blog/first`);
    expect(json.itemListElement[0]?.position).toBe(1);
  });
});
