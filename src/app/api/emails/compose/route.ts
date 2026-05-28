import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { replaceMergeTags } from "@/lib/merge";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId, contactIds } = await request.json();
  if (!templateId || !Array.isArray(contactIds) || contactIds.length === 0) {
    return Response.json({ error: "templateId and contactIds[] are required" }, { status: 400 });
  }

  const template = await db.emailTemplate.findFirst({
    where: { id: templateId, userId: session.user.id },
  });
  if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

  const contacts = await db.contact.findMany({
    where: { id: { in: contactIds } },
  });

  const previews = contacts.map((contact: any) => {
    const personalizedBody = replaceMergeTags(template.body, {
      FirstName: contact.firstName,
      LastName: contact.lastName,
      Company: contact.company,
      Title: contact.title,
      JobTitle: contact.title,
    });
    const personalizedSubject = replaceMergeTags(template.subject, {
      FirstName: contact.firstName,
      LastName: contact.lastName,
      Company: contact.company,
      Title: contact.title,
      JobTitle: contact.title,
    });
    return {
      contactId: contact.id,
      email: contact.email,
      firstName: contact.firstName,
      subject: personalizedSubject,
      body: personalizedBody,
    };
  });

  return Response.json({ previews });
}
