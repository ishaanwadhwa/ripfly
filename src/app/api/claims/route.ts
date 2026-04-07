import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { claims, flights } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

// POST /api/claims — create a claim for a flight
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { flightId } = await req.json();
  if (!flightId) {
    return NextResponse.json(
      { error: "flightId is required" },
      { status: 400 }
    );
  }

  const db = createDb();

  // Verify flight belongs to user
  const [flight] = await db
    .select()
    .from(flights)
    .where(and(eq(flights.id, flightId), eq(flights.userId, session.user.id)));

  if (!flight) {
    return NextResponse.json({ error: "Flight not found" }, { status: 404 });
  }

  // Check if claim already exists
  const [existing] = await db
    .select()
    .from(claims)
    .where(eq(claims.flightId, flightId));

  if (existing) {
    return NextResponse.json(existing);
  }

  // Create claim
  const [claim] = await db
    .insert(claims)
    .values({
      flightId,
      userId: session.user.id,
      method: "guided",
      status: "initiated",
    })
    .returning();

  // Update flight status
  await db
    .update(flights)
    .set({ status: "claim_started", updatedAt: new Date() })
    .where(eq(flights.id, flightId));

  return NextResponse.json(claim);
}

// PATCH /api/claims — update claim status
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { claimId, status, notes } = await req.json();
  if (!claimId || !status) {
    return NextResponse.json(
      { error: "claimId and status are required" },
      { status: 400 }
    );
  }

  const validStatuses = [
    "initiated",
    "submitted",
    "pending",
    "credited",
    "rejected",
    "expired",
  ];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const db = createDb();

  const [claim] = await db
    .select()
    .from(claims)
    .where(
      and(eq(claims.id, claimId), eq(claims.userId, session.user.id))
    );

  if (!claim) {
    return NextResponse.json({ error: "Claim not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = {
    status,
    updatedAt: new Date(),
  };
  if (notes !== undefined) updates.notes = notes;
  if (status === "submitted") updates.submittedAt = new Date();
  if (status === "credited" || status === "rejected")
    updates.resolvedAt = new Date();

  const [updated] = await db
    .update(claims)
    .set(updates)
    .where(eq(claims.id, claimId))
    .returning();

  // Sync flight status
  const flightStatus =
    status === "credited"
      ? "credited"
      : status === "rejected"
        ? "failed"
        : "claim_started";

  await db
    .update(flights)
    .set({ status: flightStatus, updatedAt: new Date() })
    .where(eq(flights.id, claim.flightId));

  return NextResponse.json(updated);
}
