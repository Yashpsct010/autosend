import { google } from "googleapis";

interface GmailSendOptions {
  accessToken: string;
  to: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName?: string;
}

function makeRawMessage({
  to,
  subject,
  body,
  fromEmail,
  fromName,
}: {
  to: string;
  subject: string;
  body: string;
  fromEmail: string;
  fromName?: string;
}): string {
  const from = fromName ? `${fromName} <${fromEmail}>` : fromEmail;
  const messageParts = [
    `From: ${from}`,
    `To: ${to}`,
    `Subject: ${subject}`,
    `MIME-Version: 1.0`,
    `Content-Type: text/plain; charset=utf-8`,
    ``,
    body,
  ];
  const message = messageParts.join("\n");
  // Encode to base64url
  return Buffer.from(message)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

export async function sendGmailMessage({
  accessToken,
  to,
  subject,
  body,
  fromEmail,
  fromName,
}: GmailSendOptions): Promise<{ messageId: string }> {
  const auth = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  auth.setCredentials({ access_token: accessToken });

  const gmail = google.gmail({ version: "v1", auth });

  const raw = makeRawMessage({ to, subject, body, fromEmail, fromName });

  const response = await gmail.users.messages.send({
    userId: "me",
    requestBody: { raw },
  });

  return { messageId: response.data.id ?? "" };
}
