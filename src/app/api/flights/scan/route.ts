import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { flights } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import {
  getAllGmailClients,
  searchMessages,
  getMessageMetadata,
  getMessageContent,
} from "@/lib/gmail/client";
import type { gmail_v1 } from "googleapis";
import { parseAirlineEmail } from "@/lib/parsers";
import type { ScanResult } from "@/types";

const SEARCH_QUERY = [
  "subject:(PNR OR itinerary OR e-ticket OR booking)",
  "(IndiGo OR 6E OR goindigo OR airindia OR Air India)",
].join(" ");

// Metadata patterns that suggest an airline booking email
const AIRLINE_PATTERNS =
  /indigo|goindigo|6e\s*\d|air\s*india|airindia|e-ticket|pnr|itinerary/i;

async function scanOneInbox(
  gmail: gmail_v1.Gmail,
  userId: string,
  sourceEmail: string,
  existingIds: Set<string>,
  db: ReturnType<typeof createDb>
): Promise<number> {
  const messageIds = await searchMessages(gmail, SEARCH_QUERY, 200);
  if (messageIds.length === 0) return 0;

  const newMessageIds = messageIds.filter((id) => !existingIds.has(id));

  // Metadata-first: fetch headers to check relevance
  const relevantIds: string[] = [];

  for (let i = 0; i < newMessageIds.length; i += 10) {
    const batch = newMessageIds.slice(i, i + 10);
    const metadataResults = await Promise.all(
      batch.map((id) => getMessageMetadata(gmail, id))
    );

    for (const meta of metadataResults) {
      const combined = `${meta.from} ${meta.subject}`;
      if (AIRLINE_PATTERNS.test(combined)) {
        relevantIds.push(meta.messageId);
      }
    }
  }

  // Full fetch + parse (batches of 5)
  let newFlightCount = 0;

  for (let i = 0; i < relevantIds.length; i += 5) {
    const batch = relevantIds.slice(i, i + 5);
    const contents = await Promise.all(
      batch.map((id) => getMessageContent(gmail, id))
    );

    for (const msg of contents) {
      const parsed = parseAirlineEmail(msg.from, msg.subject, msg.htmlBody);
      if (!parsed) continue;

      try {
        await db
          .insert(flights)
          .values({
            userId,
            airline: parsed.airline,
            airlineName: parsed.airlineName,
            pnr: parsed.pnr,
            flightNumber: parsed.flightNumber,
            passengerName: parsed.passengerName,
            origin: parsed.origin,
            destination: parsed.destination,
            flightDate: parsed.flightDate,
            emailMessageId: msg.messageId,
            sourceEmail,
            rawExtracted: JSON.parse(JSON.stringify(parsed)),
          })
          .onConflictDoNothing();
        newFlightCount++;
      } catch {
        // Duplicate or DB error — skip this flight, continue with others
      }
    }
  }

  return newFlightCount;
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const db = createDb();
    const gmailClients = await getAllGmailClients(userId);

    if (gmailClients.length === 0) {
      return NextResponse.json(
        { error: "No Gmail accounts linked" },
        { status: 400 }
      );
    }

    // Pre-fetch existing message IDs once for all inboxes
    const existingMessages = await db
      .select({ emailMessageId: flights.emailMessageId })
      .from(flights)
      .where(eq(flights.userId, userId));

    const existingIds = new Set(
      existingMessages.map((m) => m.emailMessageId).filter((id): id is string => id != null)
    );

    // Scan each inbox
    let totalNewFlights = 0;
    for (const client of gmailClients) {
      const found = await scanOneInbox(
        client.gmail,
        userId,
        client.email,
        existingIds,
        db
      );
      totalNewFlights += found;
    }

    const [totalResult] = await db
      .select({ value: count() })
      .from(flights)
      .where(eq(flights.userId, userId));

    return NextResponse.json({
      newFlights: totalNewFlights,
      totalFlights: totalResult.value,
    } satisfies ScanResult);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
