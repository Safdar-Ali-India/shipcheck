import { z } from "zod";
import { VIEWPORTS } from "@/lib/constants";

export const urlSchema = z
  .string()
  .trim()
  .url("Enter a valid URL")
  .refine((url) => {
    try {
      const parsed = new URL(url);
      return ["http:", "https:"].includes(parsed.protocol);
    } catch {
      return false;
    }
  }, "Only HTTP and HTTPS URLs are allowed");

export const screenshotRequestSchema = z.object({
  url: urlSchema,
  viewport: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
});

export const compareUrlsSchema = z.object({
  urlA: urlSchema,
  urlB: urlSchema,
  viewport: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
});

export type ScreenshotRequest = z.infer<typeof screenshotRequestSchema>;
export type CompareUrlsInput = z.infer<typeof compareUrlsSchema>;

export function validateImageFile(file: File): string | null {
  const allowed = ["image/png", "image/jpeg", "image/webp"];
  if (!allowed.includes(file.type)) {
    return "Only PNG, JPEG, and WebP images are supported.";
  }
  if (file.size > 10 * 1024 * 1024) {
    return "Image must be under 10 MB.";
  }
  return null;
}

export function getViewportConfig(viewport: keyof typeof VIEWPORTS) {
  return VIEWPORTS[viewport];
}
