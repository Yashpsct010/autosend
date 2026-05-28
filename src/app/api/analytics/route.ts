import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { subDays, format } from "date-fns";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const userId = session.user.id;

  const [totalContacts, outreachStats, recentOutreaches, templateStats] = await Promise.all([
    db.contact.count(),
    db.outreach.groupBy({
      by: ["status"],
      where: { userId },
      _count: { id: true },
    }),
    // Last 30 days daily sent counts
    db.outreach.findMany({
      where: {
        userId,
        status: "Sent",
        sentAt: { gte: subDays(new Date(), 30) },
      },
      select: { sentAt: true },
    }),
    // Top templates
    db.outreach.groupBy({
      by: ["templateId"],
      where: { userId },
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 5,
    }),
  ]);

  // Build status map
  const statusMap: Record<string, number> = {};
  for (const s of outreachStats) {
    statusMap[s.status] = s._count.id;
  }

  // Build daily chart data
  const dailyMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = format(subDays(new Date(), i), "MMM d");
    dailyMap[d] = 0;
  }
  for (const o of recentOutreaches) {
    if (o.sentAt) {
      const d = format(o.sentAt, "MMM d");
      if (d in dailyMap) dailyMap[d]++;
    }
  }
  const chartData = Object.entries(dailyMap).map(([date, sent]) => ({ date, sent }));

  // Resolve template names
  const templateIds = templateStats.map((t: any) => t.templateId).filter(Boolean) as string[];
  const templates = await db.emailTemplate.findMany({
    where: { id: { in: templateIds } },
    select: { id: true, name: true },
  });
  const templateMap = Object.fromEntries(templates.map((t) => [t.id, t.name]));

  const topTemplates = templateStats.map((t: any) => ({
    name: t.templateId ? (templateMap[t.templateId] ?? "Unknown") : "No Template",
    count: t._count.id,
  }));

  const totalSent = statusMap["Sent"] ?? 0;
  const totalQueued = statusMap["Queued"] ?? 0;
  const totalFailed = statusMap["Failed"] ?? 0;
  const totalDraft = statusMap["Draft"] ?? 0;

  return Response.json({
    totalContacts,
    totalSent,
    totalQueued,
    totalFailed,
    totalDraft,
    chartData,
    topTemplates,
  });
}
