import { auth } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import { createDb } from "@/lib/db";
import { flights, claims } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { Navbar } from "@/components/navbar";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { CopyButton } from "@/components/copy-button";
import { ClaimStatus } from "@/components/claim-status";
import { getClaimDeadline } from "@/components/flight-card";
import Link from "next/link";

// Per-airline claim guides with two-step flow (login first, then claim)
const CLAIM_GUIDES: Record<
  string,
  {
    programName: string;
    loginUrl: string;
    signupUrl: string;
    claimUrl: string;
    loginSteps: string[];
    claimSteps: string[];
    requiredFields: string[];
    notes: string[];
  }
> = {
  "6E": {
    programName: "IndiGo BluChip",
    loginUrl: "https://www.goindigo.in/login.html",
    signupUrl: "https://www.goindigo.in/loyalty/enroll.html",
    claimUrl:
      "https://www.goindigo.in/loyalty/dashboard/retro-claim.html",
    loginSteps: [
      "Go to IndiGo's website and log in (or sign up if you don't have an account)",
      "You'll need to verify with OTP on your email and phone number",
      "Make sure you're enrolled in the BluChip loyalty program",
    ],
    claimSteps: [
      "Once logged in, click the retro-claim link below",
      "Enter your PNR and Last Name (use the copy buttons above)",
      "Submit the claim for review",
      "Come back here and mark your claim as submitted",
    ],
    requiredFields: ["PNR", "Last Name"],
    notes: [
      "You must be logged into IndiGo before clicking the retro-claim link, otherwise you'll be redirected to the homepage",
      "Retro-claims must be made within 90 days of the flight date",
    ],
  },
};

const DEFAULT_GUIDE = {
  programName: "Airline Loyalty Program",
  loginUrl: "",
  signupUrl: "",
  claimUrl: "",
  loginSteps: [
    "Visit the airline's website and sign up for their loyalty program",
    "Log in to your account",
  ],
  claimSteps: [
    "Look for a 'Retro Claim' or 'Claim Missing Miles' option",
    "Enter your booking PNR and passenger details",
    "Submit the claim",
    "Come back here and update the claim status",
  ],
  requiredFields: ["PNR"],
  notes: [],
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const urgencyStyles = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  expired: "bg-muted text-muted-foreground",
} as const;

export default async function FlightDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/");

  const { id } = await params;
  const db = createDb();

  const [flight] = await db
    .select()
    .from(flights)
    .where(and(eq(flights.id, id), eq(flights.userId, session.user.id)));

  if (!flight) notFound();

  // Get existing claim if any
  const [claim] = await db
    .select()
    .from(claims)
    .where(eq(claims.flightId, flight.id));

  const { daysRemaining, urgency } = getClaimDeadline(flight);
  const isEligible = urgency !== "expired";
  const guide = CLAIM_GUIDES[flight.airline] ?? DEFAULT_GUIDE;

  // Extract last name from passenger name for copy
  const lastName = flight.passengerName
    ? flight.passengerName.split(" ").pop() ?? ""
    : "";

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 py-8 max-w-3xl mx-auto w-full">
        <div className="space-y-6">
          {/* Back link */}
          <Link
            href="/dashboard"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            &larr; Back to flights
          </Link>

          {/* Flight details card */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl">
                    {flight.airlineName}
                    {flight.flightNumber && (
                      <span className="ml-2 text-muted-foreground font-normal">
                        {flight.flightNumber}
                      </span>
                    )}
                  </CardTitle>
                  {flight.origin && flight.destination && (
                    <p className="text-2xl font-bold mt-1">
                      {flight.origin}
                      <span className="text-muted-foreground mx-2">
                        &rarr;
                      </span>
                      {flight.destination}
                    </p>
                  )}
                </div>
                <Badge
                  variant="outline"
                  className={`text-sm ${urgencyStyles[urgency]}`}
                >
                  {urgency === "expired"
                    ? "Expired"
                    : `${daysRemaining} days left`}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">PNR</span>
                  <p className="font-mono font-bold text-lg">{flight.pnr}</p>
                </div>
                {flight.flightDate && (
                  <div>
                    <span className="text-muted-foreground">Flight Date</span>
                    <p className="font-medium">{formatDate(flight.flightDate)}</p>
                  </div>
                )}
                {flight.passengerName && (
                  <div>
                    <span className="text-muted-foreground">Passenger</span>
                    <p className="font-medium">{flight.passengerName}</p>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Airline</span>
                  <p className="font-medium">
                    {flight.airlineName} ({flight.airline})
                  </p>
                </div>
              </div>

              {/* Copy buttons + email link */}
              <div className="flex gap-2 mt-4">
                <CopyButton text={flight.pnr} label="PNR" />
                {lastName && <CopyButton text={lastName} label="Last Name" />}
                {flight.emailMessageId && (
                  <a
                    href={`https://mail.google.com/mail/u/0/#inbox/${flight.emailMessageId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={buttonVariants({ variant: "outline", size: "sm" })}
                  >
                    View Email
                  </a>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claim Guide */}
          <Card>
            <CardHeader>
              <CardTitle>
                {isEligible
                  ? `Claim Miles via ${guide.programName}`
                  : "Claim Window Expired"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              {isEligible ? (
                <>
                  <p className="text-sm text-muted-foreground">
                    You&apos;ll need: {guide.requiredFields.join(", ")}.
                    Use the copy buttons above to grab them.
                  </p>

                  {/* Step 1: Login */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      Step 1: Log in to {guide.programName}
                    </h3>
                    <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                      {guide.loginSteps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    <div className="flex gap-2 mt-2">
                      {guide.loginUrl && (
                        <a
                          href={guide.loginUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
                        >
                          Log in to {guide.programName}
                        </a>
                      )}
                      {guide.signupUrl && (
                        <a
                          href={guide.signupUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center rounded-md border border-input bg-background px-3 py-2 text-sm text-muted-foreground hover:bg-accent"
                        >
                          Don&apos;t have an account? Sign up
                        </a>
                      )}
                    </div>
                  </div>

                  <Separator />

                  {/* Step 2: Claim */}
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold">
                      Step 2: Submit Retro Claim
                    </h3>
                    <ol className="list-decimal list-inside space-y-1.5 text-sm text-muted-foreground">
                      {guide.claimSteps.map((step: string, i: number) => (
                        <li key={i}>{step}</li>
                      ))}
                    </ol>
                    {guide.claimUrl && (
                      <a
                        href={guide.claimUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 mt-2"
                      >
                        Go to Retro Claim Page
                      </a>
                    )}
                  </div>

                  {/* Notes */}
                  {guide.notes.length > 0 && (
                    <div className="rounded-md bg-muted p-3 text-sm text-muted-foreground space-y-1">
                      {guide.notes.map((note: string, i: number) => (
                        <p key={i}>&#9432; {note}</p>
                      ))}
                    </div>
                  )}

                  <Separator />

                  {/* Claim tracking */}
                  <div>
                    <h3 className="text-sm font-semibold mb-2">
                      Step 3: Track Your Claim
                    </h3>
                    <ClaimStatus
                      claimId={claim?.id ?? null}
                      currentStatus={claim?.status ?? null}
                      flightId={flight.id}
                      rejectionReason={claim?.rejectionReason}
                    />
                  </div>
                </>
              ) : (
                <p className="text-sm text-muted-foreground">
                  The {flight.claimWindowDays}-day retro-claim window has
                  passed for this flight. Airlines typically require claims
                  within {flight.claimWindowDays} days of the flight date.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </>
  );
}
