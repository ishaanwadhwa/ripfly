import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import { createDb } from "@/lib/db";
import { linkedAccounts } from "@/lib/db/schema";

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const userId = url.searchParams.get("state");

  if (!code || !userId) {
    return NextResponse.redirect(
      `${process.env.AUTH_URL}/dashboard?error=missing_params`
    );
  }

  const oauth2Client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.AUTH_URL}/api/gmail/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Get the linked account's email and Google ID
    const res = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );
    const userInfo = await res.json();
    const email = userInfo.email as string;
    const googleAccountId = userInfo.id as string;

    if (!email || !googleAccountId) {
      return NextResponse.redirect(
        `${process.env.AUTH_URL}/dashboard?error=no_email`
      );
    }

    const db = createDb();

    await db
      .insert(linkedAccounts)
      .values({
        userId,
        email,
        googleAccountId,
        accessToken: tokens.access_token ?? null,
        refreshToken: tokens.refresh_token ?? null,
        expiresAt: tokens.expiry_date
          ? Math.floor(tokens.expiry_date / 1000)
          : null,
      })
      .onConflictDoNothing();

    return NextResponse.redirect(
      `${process.env.AUTH_URL}/dashboard?linked=${encodeURIComponent(email)}`
    );
  } catch {
    return NextResponse.redirect(
      `${process.env.AUTH_URL}/dashboard?error=link_failed`
    );
  }
}
