import { google, type gmail_v1 } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { eq, and } from "drizzle-orm";
import { createDb } from "@/lib/db";
import { accounts } from "@/lib/db/schema";

// ─── Token retrieval & refresh ──────────────────────────────────────

export async function getGmailClient(userId: string) {
  const db = createDb();

  const [account] = await db
    .select()
    .from(accounts)
    .where(and(eq(accounts.userId, userId), eq(accounts.provider, "google")));

  if (!account?.access_token || !account?.refresh_token) {
    throw new Error("No Google account linked — please reconnect Gmail.");
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token,
  });

  // Refresh if expired (expires_at is epoch seconds)
  const isExpired =
    account.expires_at && account.expires_at * 1000 < Date.now();

  if (isExpired) {
    const { credentials } = await oauth2Client.refreshAccessToken();
    oauth2Client.setCredentials(credentials);

    await db
      .update(accounts)
      .set({
        access_token: credentials.access_token ?? account.access_token,
        expires_at: credentials.expiry_date
          ? Math.floor(credentials.expiry_date / 1000)
          : account.expires_at,
      })
      .where(
        and(eq(accounts.userId, userId), eq(accounts.provider, "google"))
      );
  }

  const gmail = google.gmail({ version: "v1", auth: oauth2Client });
  return gmail;
}

// ─── Search messages with pagination ────────────────────────────────

const MAX_MESSAGES = 200;

export async function searchMessages(
  gmail: gmail_v1.Gmail,
  query: string,
  maxResults: number = MAX_MESSAGES
): Promise<string[]> {
  const messageIds: string[] = [];
  let pageToken: string | undefined;

  while (messageIds.length < maxResults) {
    const res = await gmail.users.messages.list({
      userId: "me",
      q: query,
      maxResults: Math.min(100, maxResults - messageIds.length),
      pageToken,
    });

    const messages = res.data.messages ?? [];
    for (const msg of messages) {
      if (msg.id) messageIds.push(msg.id);
    }

    pageToken = res.data.nextPageToken ?? undefined;
    if (!pageToken || messages.length === 0) break;
  }

  return messageIds;
}

// ─── Fetch message metadata (subject + from) ───────────────────────

export interface MessageMetadata {
  messageId: string;
  subject: string;
  from: string;
}

export async function getMessageMetadata(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<MessageMetadata> {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "metadata",
    metadataHeaders: ["Subject", "From"],
  });

  const headers = res.data.payload?.headers ?? [];
  const subject =
    headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
  const from =
    headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";

  return { messageId, subject, from };
}

// ─── Fetch full message content ─────────────────────────────────────

export interface MessageContent {
  messageId: string;
  subject: string;
  from: string;
  htmlBody: string;
  textBody: string;
}

export async function getMessageContent(
  gmail: gmail_v1.Gmail,
  messageId: string
): Promise<MessageContent> {
  const res = await gmail.users.messages.get({
    userId: "me",
    id: messageId,
    format: "full",
  });

  const headers = res.data.payload?.headers ?? [];
  const subject =
    headers.find((h) => h.name?.toLowerCase() === "subject")?.value ?? "";
  const from =
    headers.find((h) => h.name?.toLowerCase() === "from")?.value ?? "";

  const payload = res.data.payload;
  const htmlBody = payload ? decodeBody(findPart(payload, "text/html")) : "";
  const textBody = payload ? decodeBody(findPart(payload, "text/plain")) : "";

  return { messageId, subject, from, htmlBody, textBody };
}

// ─── MIME helpers ───────────────────────────────────────────────────

function findPart(
  part: gmail_v1.Schema$MessagePart,
  mimeType: string
): gmail_v1.Schema$MessagePart | null {
  if (part.mimeType === mimeType && part.body?.data) {
    return part;
  }
  if (part.parts) {
    for (const child of part.parts) {
      const found = findPart(child, mimeType);
      if (found) return found;
    }
  }
  return null;
}

function decodeBody(part: gmail_v1.Schema$MessagePart | null): string {
  if (!part?.body?.data) return "";
  return Buffer.from(part.body.data, "base64url").toString("utf-8");
}
