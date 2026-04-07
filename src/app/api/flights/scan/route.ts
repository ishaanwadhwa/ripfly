import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { flights } from "@/lib/db/schema";
import { eq, count } from "drizzle-orm";
import {
  getGmailClient,
  searchMessages,
  getMessageMetadata,
  getMessageContent,
} from "@/lib/gmail/client";
import { parseAirlineEmail } from "@/lib/parsers";
import type { ScanResult } from "@/types";

const SEARCH_QUERY = [
  "subject:(PNR OR itinerary OR e-ticket OR booking)",
  "(IndiGo OR 6E OR goindigo OR airindia OR Air India)",
].join(" ");

// Metadata patterns that suggest an airline booking email
const AIRLINE_PATTERNS =
  /indigo|goindigo|6e\s*\d|air\s*india|airindia|e-ticket|pnr|itinerary/i;

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  try {
    const gmail = await getGmailClient(userId);
    const db = createDb();

    // 1. Search Gmail with broad query, paginated up to 200
    const messageIds = await searchMessages(gmail, SEARCH_QUERY, 200);
    if (messageIds.length === 0) {
      const [result] = await db
        .select({ value: count() })
        .from(flights)
        .where(eq(flights.userId, userId));
      return NextResponse.json({
        newFlights: 0,
        totalFlights: result.value,
      } satisfies ScanResult);
    }

    // 2. Pre-filter: skip messages we already processed
    const existingMessages = await db
      .select({ emailMessageId: flights.emailMessageId })
      .from(flights)
      .where(eq(flights.userId, userId));

    const existingIds = new Set(
      existingMessages.map((m) => m.emailMessageId).filter(Boolean)
    );
    const newMessageIds = messageIds.filter((id) => !existingIds.has(id));
    // 3. Metadata-first: fetch headers to check relevance
    const relevantIds: string[] = [];

    // Batch metadata fetches in groups of 10
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
    // 4. Full fetch + parse for relevant emails (batches of 5)
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
              rawExtracted: JSON.parse(JSON.stringify(parsed)),
            })
            .onConflictDoNothing();
          newFlightCount++;
        } catch {
          // Duplicate or DB error — skip this flight, continue with others
        }
      }
    }

    const [totalResult] = await db
      .select({ value: count() })
      .from(flights)
      .where(eq(flights.userId, userId));

    return NextResponse.json({
      newFlights: newFlightCount,
      totalFlights: totalResult.value,
    } satisfies ScanResult);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Email scan failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
