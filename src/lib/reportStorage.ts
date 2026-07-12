import fs from "fs/promises";
import path from "path";
import type { BrowserTestHistoryItem, BrowserTestReport } from "@/types/browserTest";

const REPORTS_DIR = path.join(process.cwd(), ".tmp", "reports");

export function getReportsDir() {
  return REPORTS_DIR;
}

export function getReportVideoPath(reportId: string) {
  return path.join(REPORTS_DIR, `${reportId}.webm`);
}

export function getReportJsonPath(reportId: string) {
  return path.join(REPORTS_DIR, `${reportId}.json`);
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

export async function saveReportJson(report: BrowserTestReport): Promise<void> {
  await ensureReportsDir();
  const filePath = getReportJsonPath(report.id);
  await fs.writeFile(filePath, JSON.stringify(report), "utf8");
}

export async function readReportJson(reportId: string): Promise<BrowserTestReport | null> {
  try {
    const filePath = getReportJsonPath(reportId);
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as BrowserTestReport;
  } catch {
    return null;
  }
}

export async function listRecentReports(limit = 20): Promise<BrowserTestHistoryItem[]> {
  try {
    await ensureReportsDir();
    const files = await fs.readdir(REPORTS_DIR);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    const reports = await Promise.all(
      jsonFiles.map(async (file) => {
        try {
          const filePath = path.join(REPORTS_DIR, file);
          const raw = await fs.readFile(filePath, "utf8");
          const report = JSON.parse(raw) as BrowserTestReport;
          const stat = await fs.stat(filePath);
          return {
            id: report.id,
            title: report.title,
            url: report.url,
            status: report.status,
            finishedAt: report.finishedAt,
            durationMs: report.durationMs,
            hasVideo: report.hasVideo,
            mtimeMs: stat.mtimeMs,
          };
        } catch {
          return null;
        }
      }),
    );

    return reports
      .filter((report): report is NonNullable<typeof report> => Boolean(report))
      .sort((a, b) => b.mtimeMs - a.mtimeMs)
      .slice(0, limit)
      .map((item) => ({
        id: item.id,
        title: item.title,
        url: item.url,
        status: item.status,
        finishedAt: item.finishedAt,
        durationMs: item.durationMs,
        hasVideo: item.hasVideo,
      }));
  } catch {
    return [];
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
