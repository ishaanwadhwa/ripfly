import { NextRequest, NextResponse } from "next/server";
import { createDb } from "@/lib/db";
import { flights, users, reminders } from "@/lib/db/schema";
import { eq, and, notInArray, sql } from "drizzle-orm";
import { sendReminderEmail } from "@/lib/email";

const REMINDER_CHECKPOINTS = [7, 1]; // days before deadline

export async function GET(req: NextRequest) {
  // Verify cron secret (Vercel injects this header for cron jobs)
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createDb();
  let sent = 0;
  let errors = 0;

  // Find flights with upcoming deadlines that haven't been claimed/failed
  const eligibleFlights = await db
    .select({
      flight: flights,
      userEmail: users.email,
    })
    .from(flights)
    .innerJoin(users, eq(users.id, flights.userId))
    .where(
      and(
        notInArray(flights.status, ["credited", "failed"]),
        sql`${flights.flightDate} IS NOT NULL`,
        // Deadline is in the future
        sql`(${flights.flightDate}::date + ${flights.claimWindowDays} * INTERVAL '1 day') > CURRENT_DATE`,
        // Deadline is within 7 days
        sql`(${flights.flightDate}::date + ${flights.claimWindowDays} * INTERVAL '1 day' - CURRENT_DATE) <= 7`
      )
    );

  for (const { flight, userEmail } of eligibleFlights) {
    const deadlineDate = new Date(flight.flightDate!);
    deadlineDate.setDate(deadlineDate.getDate() + flight.claimWindowDays);
    const daysRemaining = Math.ceil(
      (deadlineDate.getTime() - Date.now()) / 86_400_000
    );

    for (const checkpoint of REMINDER_CHECKPOINTS) {
      // Only send if we're at or past this checkpoint
      if (daysRemaining > checkpoint) continue;

      // Check if this reminder was already sent
      const [existing] = await db
        .select()
        .from(reminders)
        .where(
          and(
            eq(reminders.flightId, flight.id),
            eq(reminders.daysBeforeDeadline, checkpoint),
            eq(reminders.sent, true)
          )
        );

      if (existing) continue;

      // Send email
      try {
        await sendReminderEmail(
          userEmail,
          {
            id: flight.id,
            airlineName: flight.airlineName,
            flightNumber: flight.flightNumber,
            origin: flight.origin,
            destination: flight.destination,
            pnr: flight.pnr,
            flightDate: flight.flightDate,
            daysRemaining,
          },
          checkpoint === 1 // urgent for 1-day reminder
        );

        // Record the reminder
        await db.insert(reminders).values({
          flightId: flight.id,
          userId: flight.userId,
          daysBeforeDeadline: checkpoint,
          sent: true,
          sentAt: new Date(),
        });

        sent++;
      } catch {
        errors++;
      }
    }
  }

  return NextResponse.json({ sent, errors, checked: eligibleFlights.length });
}
