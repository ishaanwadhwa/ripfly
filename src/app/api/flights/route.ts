import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { flights } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = createDb();
  const userFlights = await db
    .select()
    .from(flights)
    .where(eq(flights.userId, session.user.id))
    .orderBy(desc(flights.flightDate));

  return NextResponse.json(userFlights);
}
