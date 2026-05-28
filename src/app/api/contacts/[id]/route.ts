import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const contact = await db.contact.findUnique({
    where: { id },
    include: { outreaches: { include: { template: true }, orderBy: { createdAt: "desc" } } },
  });

  if (!contact) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(contact);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await request.json();
  const { firstName, lastName, company, title, email } = body;

  const contact = await db.contact.update({
    where: { id },
    data: { firstName, lastName, company, title, email },
  });

  return Response.json(contact);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  await db.contact.delete({ where: { id } });
  return Response.json({ success: true });
}
