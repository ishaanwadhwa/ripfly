import type { ParsedFlight } from "@/types";
import { parseGenericEmail } from "./generic";

/**
 * Parse an airline booking email into structured flight data.
 * Uses a single generic parser that detects the airline from content —
 * works across airline direct emails and OTA emails (MakeMyTrip, Cleartrip, etc.)
 */
export function parseAirlineEmail(
  _from: string,
  subject: string,
  htmlBody: string
): ParsedFlight | null {
  return parseGenericEmail(subject, htmlBody);
}
