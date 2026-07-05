import fs from "fs/promises";
import path from "path";

const REPORTS_DIR = path.join(process.cwd(), ".tmp", "reports");

export function getReportsDir() {
  return REPORTS_DIR;
}

export function getReportVideoPath(reportId: string) {
  return path.join(REPORTS_DIR, `${reportId}.webm`);
}

export async function ensureReportsDir() {
  await fs.mkdir(REPORTS_DIR, { recursive: true });
}

export async function saveReportVideo(reportId: string, sourcePath: string): Promise<boolean> {
  try {
    await ensureReportsDir();
    const dest = getReportVideoPath(reportId);
    await fs.copyFile(sourcePath, dest);
    const stat = await fs.stat(dest);
    return stat.size > 1024;
  } catch {
    return false;
  }
}

export async function readReportVideo(reportId: string): Promise<Buffer | null> {
  try {
    const filePath = getReportVideoPath(reportId);
    const buffer = await fs.readFile(filePath);
    return buffer.length > 0 ? buffer : null;
  } catch {
    return null;
  }
}

export async function cleanupOldReports(maxAgeMs = 60 * 60 * 1000) {
  try {
    await ensureReportsDir();
    const files = await fs.readdir(REPORTS_DIR);
    const now = Date.now();
    await Promise.all(
      files.map(async (file) => {
        const filePath = path.join(REPORTS_DIR, file);
        const stat = await fs.stat(filePath);
        if (now - stat.mtimeMs > maxAgeMs) {
          await fs.unlink(filePath).catch(() => undefined);
        }
      }),
    );
  } catch {
    // ignore cleanup errors
  }
}
