import { SITE_URL } from "@/lib/constants";
import type { BrowserTestReport } from "@/types/browserTest";

export interface CiNotificationMeta {
  provider?: string;
  project?: string;
  branch?: string;
  commit?: string;
  buildUrl?: string;
  actor?: string;
}

export interface NotificationOptions {
  webhookUrl?: string;
  report: BrowserTestReport;
  shareUrl: string;
  source: "manual" | "ci";
  ci?: CiNotificationMeta;
}

function getBaseUrl() {
  return process.env.NEXT_PUBLIC_APP_URL?.trim() || SITE_URL;
}

export function formatNotificationText(options: NotificationOptions) {
  const statusWord = options.report.status === "pass" ? "PASSED" : "FAILED";
  const sourceLabel = options.source === "ci" ? "CI" : "Manual";
  const details =
    options.source === "ci" && options.ci
      ? ` · ${options.ci.provider ?? "ci"}${options.ci.branch ? `/${options.ci.branch}` : ""}`
      : "";

  return `ShipCheck ${sourceLabel} run ${statusWord}${details}: ${options.report.title}`;
}

export function buildNotificationPayload(options: NotificationOptions) {
  const absoluteShareUrl = options.shareUrl.startsWith("http")
    ? options.shareUrl
    : `${getBaseUrl()}${options.shareUrl}`;

  return {
    text: formatNotificationText(options),
    shipcheck: {
      source: options.source,
      reportId: options.report.id,
      status: options.report.status,
      summary: options.report.summary,
      url: options.report.url,
      durationMs: options.report.durationMs,
      shareUrl: absoluteShareUrl,
      ci: options.ci,
    },
  };
}

export async function sendNotification(options: NotificationOptions): Promise<void> {
  const webhook = options.webhookUrl?.trim();
  if (!webhook) return;

  const payload = buildNotificationPayload(options);
  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Notification webhook failed with status ${response.status}`);
  }
}
