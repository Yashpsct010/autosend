import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { ids } = await request.json();
    if (!Array.isArray(ids)) {
      return Response.json({ error: "ids must be an array" }, { status: 400 });
    }

    const contacts = await db.contact.findMany({
      where: {
        id: { in: ids },
        // assuming we might add userId later, but currently contacts are shared or lack userId? 
        // Wait, looking at upload route, it just inserts. Let's just filter by IDs.
      },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        company: true,
        title: true,
      }
    });

    return Response.json({ contacts });
  } catch (err: any) {
    return Response.json({ error: err?.message || "Error fetching contacts" }, { status: 500 });
  }
}
