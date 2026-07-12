import Link from "next/link";
import { notFound } from "next/navigation";
import { TestReportViewer } from "@/components/browser-test/TestReportViewer";
import { readReportJson } from "@/lib/reportStorage";

export const runtime = "nodejs";

export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const report = await readReportJson(id);

  if (!report) {
    notFound();
  }

  return (
    <main className="mx-auto min-h-screen w-full max-w-7xl px-4 py-8">
      <div className="mb-4">
        <Link
          href="/"
          className="text-sm font-medium text-violet-600 hover:underline dark:text-violet-400"
        >
          ← Back to ShipCheck
        </Link>
      </div>
      <TestReportViewer report={report} shareUrl={`/reports/${report.id}`} />
    </main>
  );
}
