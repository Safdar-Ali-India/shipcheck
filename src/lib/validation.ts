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

export const browserTestRequestSchema = z
  .object({
    url: urlSchema.optional(),
    instructions: z.string().trim().max(4000).optional(),
    viewport: z.enum(["desktop", "tablet", "mobile"]).default("desktop"),
    preset: z.enum(["portfolio-full", "auto"]).optional(),
    mode: z.enum(["auto"]).optional(),
    notifyWebhook: urlSchema.optional(),
  })
  .refine(
    (data) => {
      if (data.preset === "portfolio-full") return true;
      if (data.preset === "auto" || data.mode === "auto") return Boolean(data.url);
      return Boolean(data.url) && Boolean(data.instructions) && data.instructions!.length >= 3;
    },
    { message: "Provide a URL (for auto test) or URL + instructions, or choose a preset." },
  );

export type ScreenshotRequest = z.infer<typeof screenshotRequestSchema>;
export type CompareUrlsInput = z.infer<typeof compareUrlsSchema>;
export type BrowserTestRequest = z.infer<typeof browserTestRequestSchema>;

export const ciMetadataSchema = z
  .object({
    provider: z.string().trim().max(100).optional(),
    project: z.string().trim().max(200).optional(),
    branch: z.string().trim().max(200).optional(),
    commit: z.string().trim().max(200).optional(),
    buildUrl: urlSchema.optional(),
    actor: z.string().trim().max(120).optional(),
  })
  .optional();

export const ciHookRequestSchema = browserTestRequestSchema.extend({
  ci: ciMetadataSchema,
});

export type CiHookRequest = z.infer<typeof ciHookRequestSchema>;

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
