import { deleteExpiredDeadlines } from "@/features/deadlines/deadline-cleanup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const result = await deleteExpiredDeadlines();
    return Response.json({ ok: true, ...result });
  } catch (error) {
    console.error("Deadline cleanup failed", error);
    return Response.json({ error: "Deadline cleanup failed" }, { status: 500 });
  }
}
