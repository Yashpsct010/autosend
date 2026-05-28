import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const templates = await db.emailTemplate.findMany({
    where: { userId: session.user.id },
    orderBy: { updatedAt: "desc" },
  });
  return Response.json(templates);
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { name, subject, body } = await request.json();
  if (!name || !subject || !body) {
    return Response.json({ error: "name, subject, and body are required" }, { status: 400 });
  }

  const template = await db.emailTemplate.create({
    data: { name, subject, body, userId: session.user.id },
  });
  return Response.json(template, { status: 201 });
}
