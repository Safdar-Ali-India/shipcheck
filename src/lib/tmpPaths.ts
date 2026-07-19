import os from "os";
import path from "path";

/**
 * Vercel/Lambda only allow writes under /tmp.
 * Locally we keep files under the project `.tmp` for easier inspection.
 */
export function getWritableRoot(): string {
  if (process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME) {
    return path.join(os.tmpdir(), "shipcheck");
  }
  return path.join(process.cwd(), ".tmp");
}

export function getReportsDir(): string {
  return path.join(getWritableRoot(), "reports");
}

export function getVideoSessionDir(reportId: string): string {
  return path.join(getWritableRoot(), "shipcheck-videos", reportId);
}
