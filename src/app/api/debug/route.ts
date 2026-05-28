import { db } from "@/lib/db";
import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Not signed in" });
  
  const account = await db.account.findFirst({
    where: { userId: session.user.id, provider: "google" }
  });
  
  return Response.json({
    email: session.user.email,
    scopes_in_db: account?.scope,
    has_gmail_send: account?.scope?.includes("gmail.send"),
    expires_at: account?.expires_at,
    has_access_token: !!account?.access_token,
    has_refresh_token: !!account?.refresh_token
  });
}
