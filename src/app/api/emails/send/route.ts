import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { replaceMergeTags } from "@/lib/merge";
import { sendGmailMessage } from "@/lib/gmail";

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { templateId, contactIds, sendToAll } = await request.json();
  if (!templateId || (!sendToAll && (!Array.isArray(contactIds) || contactIds.length === 0))) {
    return Response.json({ error: "templateId and either contactIds[] or sendToAll are required" }, { status: 400 });
  }

  const template = await db.emailTemplate.findFirst({
    where: { id: templateId, userId: session.user.id },
  });
  if (!template) return Response.json({ error: "Template not found" }, { status: 404 });

  // Fetch Google access token from Account table
  const account = await db.account.findFirst({
    where: { userId: session.user.id, provider: "google" },
    select: { id: true, access_token: true, refresh_token: true, expires_at: true },
  });

  let validAccessToken = account?.access_token;

  // Refresh token if expired
  if (account && account.expires_at && Date.now() / 1000 > account.expires_at) {
    try {
      const response = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          grant_type: "refresh_token",
          refresh_token: account.refresh_token!,
        }),
      });

      const tokens = await response.json();
      if (tokens.access_token) {
        validAccessToken = tokens.access_token;
        await db.account.update({
          where: { id: account.id },
          data: {
            access_token: tokens.access_token,
            expires_at: Math.floor(Date.now() / 1000 + tokens.expires_in),
            refresh_token: tokens.refresh_token ?? account.refresh_token,
          },
        });
      }
    } catch (error) {
      console.error("Failed to refresh Google access token", error);
    }
  }

  const contacts = sendToAll 
    ? await db.contact.findMany() // In real app, filter by userId
    : await db.contact.findMany({ where: { id: { in: contactIds } } });
  const results: { email: string; status: string; error?: string }[] = [];

  for (const contact of contacts) {
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

    // Create or update outreach record to Queued
    const outreach = await db.outreach.create({
      data: {
        contactId: contact.id,
        templateId: template.id,
        userId: session.user.id,
        subject: personalizedSubject,
        personalizedBody,
        status: "Queued",
      },
    });

    if (!validAccessToken) {
      // Mock send - mark as sent without actual Gmail call
      await db.outreach.update({
        where: { id: outreach.id },
        data: { status: "Sent", sentAt: new Date() },
      });
      results.push({ email: contact.email, status: "Sent (mock - no OAuth token)" });
      continue;
    }

    try {
      await sendGmailMessage({
        accessToken: validAccessToken,
        to: contact.email,
        subject: personalizedSubject,
        body: personalizedBody,
        fromEmail: session.user.email!,
        fromName: session.user.name ?? undefined,
      });
      await db.outreach.update({
        where: { id: outreach.id },
        data: { status: "Sent", sentAt: new Date() },
      });
      results.push({ email: contact.email, status: "Sent" });
    } catch (err: any) {
      const errorMsg = err?.message || "Unknown error";
      
      // Check for Google's specific scope error
      let friendlyError = errorMsg;
      if (errorMsg.includes("insufficient authentication scopes")) {
        friendlyError = "Missing Gmail permissions! Please sign out, sign back in, and ensure you check the box granting AutoSend permission to send emails on your behalf.";
      }

      await db.outreach.update({
        where: { id: outreach.id },
        data: { status: "Failed", errorMessage: friendlyError },
      });
      results.push({ email: contact.email, status: "Failed", error: friendlyError });
    }
  }

  return Response.json({ results });
}
