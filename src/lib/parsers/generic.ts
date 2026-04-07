import type { ParsedFlight } from "@/types";

/**
 * Generic parser that works across airlines and OTA emails.
 * Detects the airline from content, then extracts flight details.
 */
export function parseGenericEmail(
  subject: string,
  htmlBody: string
): ParsedFlight | null {
  const text = stripHtml(htmlBody || subject);
  const combined = `${subject} ${text}`;

  const pnr = extractPnr(combined, subject);
  if (!pnr) return null;

  const airline = detectAirline(combined);
  if (!airline) return null;

  const route = extractRoute(combined);

  return {
    airline: airline.code,
    airlineName: airline.name,
    pnr,
    flightNumber: extractFlightNumber(combined, airline.code),
    passengerName: extractPassengerName(combined),
    origin: route?.origin ?? null,
    destination: route?.destination ?? null,
    flightDate: extractDate(combined),
  };
}

// ─── Airline detection ──────────────────────────────────────────────

const AIRLINES = [
  { code: "6E", name: "IndiGo", patterns: [/indigo/i, /goindigo/i, /\b6E\s*\d/] },
  { code: "AI", name: "Air India", patterns: [/air\s*india(?!\s*express)/i, /\bairindia\b/i, /\bAI\s*\d{3,4}\b/] },
  { code: "IX", name: "Air India Express", patterns: [/air\s*india\s*express/i, /airindiaexpress/i, /\bIX\s*\d{3,4}\b/] },
  { code: "SG", name: "SpiceJet", patterns: [/spicejet/i, /\bSG\s*\d{3,4}\b/] },
  { code: "UK", name: "Vistara", patterns: [/vistara/i, /\bUK\s*\d{3,4}\b/] },
] as const;

function detectAirline(
  text: string
): { code: string; name: string } | null {
  for (const airline of AIRLINES) {
    for (const pattern of airline.patterns) {
      if (pattern.test(text)) {
        return { code: airline.code, name: airline.name };
      }
    }
  }
  return null;
}

// ─── PNR extraction ─────────────────────────────────────────────────

function extractPnr(text: string, subject: string): string | null {
  // "PNR: XXXXXX" or "PNR XXXXXX" or "PNR - XXXXXX"
  const explicit = text.match(/PNR\s*[:\-–]?\s*([A-Z0-9]{6})\b/i);
  if (explicit) return explicit[1].toUpperCase();

  // "Your IndiGo Itinerary - AY6JSR" or "Booking - H5U8SE"
  const subjectMatch = subject.match(
    /(?:Itinerary|Booking)\s*[-–:]\s*([A-Z0-9]{6})\b/i
  );
  if (subjectMatch) return subjectMatch[1].toUpperCase();

  return null;
}

// ─── Flight number extraction ───────────────────────────────────────

function extractFlightNumber(text: string, airlineCode: string): string | null {
  const regex = new RegExp(`\\b(${airlineCode})\\s*(\\d{2,4})\\b`, "i");
  const match = text.match(regex);
  return match ? `${match[1].toUpperCase()} ${match[2]}` : null;
}

// ─── Passenger name extraction ──────────────────────────────────────

function extractPassengerName(text: string): string | null {
  // "Dear Mr/Ms/Mrs FIRSTNAME LASTNAME"
  const dearMatch = text.match(
    /Dear\s+(?:Mr\.?|Ms\.?|Mrs\.?|Mx\.?)?\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/
  );
  if (dearMatch) return dearMatch[1].trim();

  // "for Mr. Ishaan Wadhwa" or "for MR. WADHWA"
  const forMatch = text.match(
    /for\s+(?:Mr\.?|Ms\.?|Mrs\.?|MR\.?|MS\.?|MRS\.?)\s+([A-Z][A-Za-z]+(?:\s+[A-Z][A-Za-z]+)*)/
  );
  if (forMatch) return forMatch[1].trim();

  // "Passenger Name: FIRSTNAME LASTNAME"
  const passengerMatch = text.match(
    /Passenger(?:\s+Name)?\s*[:\-]\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/
  );
  if (passengerMatch) return passengerMatch[1].trim();

  return null;
}

// ─── Route extraction ───────────────────────────────────────────────

function extractRoute(
  text: string
): { origin: string; destination: string } | null {
  // "DEL-BOM", "GOI - BLR", "DEL → BOM", "DEL to BOM"
  const match = text.match(
    /\b([A-Z]{3})\s*(?:to|→|->|-|–)\s*([A-Z]{3})\b/
  );
  if (match) return { origin: match[1], destination: match[2] };

  // "New Delhi (DEL)" ... "Mumbai (BOM)"
  const codes = text.match(/\(([A-Z]{3})\)/g);
  if (codes && codes.length >= 2) {
    return {
      origin: codes[0].replace(/[()]/g, ""),
      destination: codes[1].replace(/[()]/g, ""),
    };
  }

  return null;
}

// ─── Date extraction ────────────────────────────────────────────────

function extractDate(text: string): string | null {
  const monthNames: Record<string, string> = {
    jan: "01", feb: "02", mar: "03", apr: "04",
    may: "05", jun: "06", jul: "07", aug: "08",
    sep: "09", oct: "10", nov: "11", dec: "12",
  };

  // "15 Apr 2026", "23-May-25", "15 April 2026"
  const match = text.match(
    /\b(\d{1,2})[\s\-]+(Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)[\s\-]+(\d{2,4})\b/i
  );
  if (match) {
    const day = match[1].padStart(2, "0");
    const month = monthNames[match[2].slice(0, 3).toLowerCase()];
    let year = match[3];
    if (year.length === 2) year = `20${year}`;
    return `${year}-${month}-${day}`;
  }

  // "27-05-2025" or "15/04/2026"
  const numMatch = text.match(/\b(\d{2})[\/\-](\d{2})[\/\-](\d{4})\b/);
  if (numMatch) {
    return `${numMatch[3]}-${numMatch[2]}-${numMatch[1]}`;
  }

  return null;
}

// ─── HTML stripper ──────────────────────────────────────────────────

function stripHtml(html: string): string {
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#?\w+;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
