import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { linkedAccounts } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { linkedAccountId } = await req.json();
  if (!linkedAccountId) {
    return NextResponse.json(
      { error: "linkedAccountId is required" },
      { status: 400 }
    );
  }

  const db = createDb();

  await db
    .delete(linkedAccounts)
    .where(
      and(
        eq(linkedAccounts.id, linkedAccountId),
        eq(linkedAccounts.userId, session.user.id)
      )
    );

  return NextResponse.json({ success: true });
}
