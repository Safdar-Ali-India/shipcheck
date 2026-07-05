import { NextRequest, NextResponse } from "next/server";
import { cleanupOldReports, readReportVideo } from "@/lib/reportStorage";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  if (!/^[0-9a-f-]{36}$/i.test(id)) {
    return NextResponse.json({ error: "Invalid report id" }, { status: 400 });
  }

  void cleanupOldReports();

  const buffer = await readReportVideo(id);
  if (!buffer) {
    return NextResponse.json({ error: "Video not found" }, { status: 404 });
  }

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      "Content-Type": "video/webm",
      "Cache-Control": "no-store",
      "Content-Length": String(buffer.length),
    },
  });
}
