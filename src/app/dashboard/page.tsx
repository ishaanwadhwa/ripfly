import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createDb } from "@/lib/db";
import { flights, claims, linkedAccounts } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Navbar } from "@/components/navbar";
import { FlightCard, getClaimDeadline } from "@/components/flight-card";
import { ScanButton } from "@/components/scan-button";
import { AutoScan } from "@/components/auto-scan";
import { LinkedAccounts } from "@/components/linked-accounts";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const db = createDb();
  const userLinkedAccounts = await db
    .select({ id: linkedAccounts.id, email: linkedAccounts.email })
    .from(linkedAccounts)
    .where(eq(linkedAccounts.userId, session.user.id));

  const userFlightsWithClaims = await db
    .select({
      flight: flights,
      claimStatus: claims.status,
    })
    .from(flights)
    .leftJoin(claims, eq(claims.flightId, flights.id))
    .where(eq(flights.userId, session.user.id))
    .orderBy(desc(flights.flightDate));

  const userFlights = userFlightsWithClaims.map((r) => r.flight);
  const claimStatusMap = Object.fromEntries(
    userFlightsWithClaims.map((r) => [r.flight.id, r.claimStatus])
  );

  const doneStatuses = ["credited", "failed"];
  const eligible = userFlights
    .filter((f) => getClaimDeadline(f).urgency !== "expired" && !doneStatuses.includes(f.status))
    .sort((a, b) => {
      const da = getClaimDeadline(a).daysRemaining ?? Infinity;
      const db_ = getClaimDeadline(b).daysRemaining ?? Infinity;
      return da - db_;
    });

  const expired = userFlights.filter(
    (f) => getClaimDeadline(f).urgency === "expired" || doneStatuses.includes(f.status)
  );

  const firstName = session.user.name?.split(" ")[0] ?? "there";

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">
                  Hey {firstName}
                </h1>
                {userFlights.length > 0 ? (
                  <p className="text-muted-foreground mt-1">
                    {eligible.length > 0 ? (
                      <>
                        You have{" "}
                        <span className="text-foreground font-semibold">
                          {eligible.length} flight{eligible.length > 1 ? "s" : ""}
                        </span>{" "}
                        eligible for retro-claim miles.
                      </>
                    ) : (
                      <>
                        All caught up — no eligible flights right now.
                      </>
                    )}
                  </p>
                ) : (
                  <p className="text-muted-foreground mt-1">
                    Scan your email to find flights eligible for miles.
                  </p>
                )}
              </div>
              <ScanButton />
            </div>

            {/* Linked accounts — subtle row */}
            <LinkedAccounts
              primaryEmail={session.user.email ?? ""}
              linkedAccounts={userLinkedAccounts}
            />
          </div>

          {/* Eligible flights */}
          {eligible.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" />
                <h2 className="text-sm font-semibold uppercase tracking-wide">
                  Eligible for Miles
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({eligible.length})
                </span>
              </div>
              <div className="space-y-3">
                {eligible.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} claimStatus={claimStatusMap[flight.id]} />
                ))}
              </div>
            </section>
          )}

          {/* Closed flights */}
          {expired.length > 0 && (
            <section className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-muted-foreground/40" />
                <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Closed
                </h2>
                <span className="text-xs text-muted-foreground">
                  ({expired.length})
                </span>
              </div>
              <div className="space-y-2 opacity-75">
                {expired.map((flight) => (
                  <FlightCard key={flight.id} flight={flight} claimStatus={claimStatusMap[flight.id]} />
                ))}
              </div>
            </section>
          )}

          {/* Empty state */}
          {userFlights.length === 0 && <AutoScan />}
        </div>
      </main>
    </>
  );
}
