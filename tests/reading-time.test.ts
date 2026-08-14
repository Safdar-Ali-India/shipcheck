import { describe, expect, it } from "vitest";
import { estimateReadingMinutes } from "@/lib/blog-schedule";

describe("estimateReadingMinutes", () => {
  it("rounds a short paragraph up to at least one minute", () => {
    expect(estimateReadingMinutes("one two three")).toBe(1);
  });

  it("uses about 200 words per minute", () => {
    const words = Array.from({ length: 400 }, () => "word").join(" ");
    expect(estimateReadingMinutes(words)).toBe(2);
  });
});
