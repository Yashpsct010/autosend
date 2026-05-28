import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const status = searchParams.get("status");
  const search = searchParams.get("search") ?? "";
  const page = parseInt(searchParams.get("page") ?? "1");
  const pageSize = parseInt(searchParams.get("pageSize") ?? "50");
  const skip = (page - 1) * pageSize;

  const where = {
    AND: [
      search
        ? {
            OR: [
              { email: { contains: search, mode: "insensitive" } },
              { firstName: { contains: search, mode: "insensitive" } },
              { lastName: { contains: search, mode: "insensitive" } },
              { company: { contains: search, mode: "insensitive" } },
              { title: { contains: search, mode: "insensitive" } },
            ],
          }
        : {},
    ],
  };

  const [contacts, total] = await Promise.all([
    db.contact.findMany({
      where,
      include: {
        outreaches: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { status: true, sentAt: true, template: { select: { name: true } } },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
    }),
    db.contact.count({ where }),
  ]);

  const filtered = status
    ? contacts.filter((c) => c.outreaches[0]?.status === status)
    : contacts;

  return Response.json({ contacts: filtered, total, page, pageSize });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = await request.json();
    const { email, firstName, lastName, company, title } = data;

    if (!email) {
      return Response.json({ error: "Email is required" }, { status: 400 });
    }

    // Check if contact already exists
    const existing = await db.contact.findUnique({ where: { email } });
    if (existing) {
      return Response.json({ error: "A contact with this email already exists" }, { status: 409 });
    }

    const contact = await db.contact.create({
      data: {
        email,
        firstName,
        lastName,
        company,
        title,
      },
    });

    return Response.json({ contact }, { status: 201 });
  } catch (error: any) {
    console.error("Failed to create contact:", error);
    return Response.json({ error: "Failed to create contact" }, { status: 500 });
  }
}
