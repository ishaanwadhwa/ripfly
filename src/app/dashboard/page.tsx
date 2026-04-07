import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createDb } from "@/lib/db";
import { flights } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { Navbar } from "@/components/navbar";
import { FlightCard, getClaimDeadline } from "@/components/flight-card";
import { ScanButton } from "@/components/scan-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/");
  }

  const db = createDb();
  const userFlights = await db
    .select()
    .from(flights)
    .where(eq(flights.userId, session.user.id))
    .orderBy(desc(flights.flightDate));

  // Split into eligible (sorted by urgency — expiring soon first) and expired
  const eligible = userFlights
    .filter((f) => getClaimDeadline(f).urgency !== "expired")
    .sort((a, b) => {
      const da = getClaimDeadline(a).daysRemaining ?? Infinity;
      const db_ = getClaimDeadline(b).daysRemaining ?? Infinity;
      return da - db_;
    });

  const expired = userFlights.filter(
    (f) => getClaimDeadline(f).urgency === "expired"
  );

  return (
    <>
      <Navbar />
      <main className="flex-1 px-6 py-8 max-w-4xl mx-auto w-full">
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Flights Found</h1>
              {userFlights.length > 0 ? (
                <p className="text-muted-foreground">
                  We found {userFlights.length} flight
                  {userFlights.length > 1 ? "s" : ""} in your email
                  {eligible.length > 0 && (
                    <>
                      {" "}&middot;{" "}
                      <span className="text-foreground font-medium">
                        {eligible.length} still eligible for miles
                      </span>
                    </>
                  )}
                </p>
              ) : (
                <p className="text-muted-foreground">
                  Scan your email to find flights eligible for miles.
                </p>
              )}
            </div>
            <ScanButton />
          </div>

          {/* Eligible flights */}
          {eligible.length > 0 && (
            <div className="space-y-3">
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Eligible for Miles ({eligible.length})
              </h2>
              {eligible.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          )}

          {/* Expired flights */}
          {expired.length > 0 && (
            <div className="space-y-3">
              {eligible.length > 0 && <Separator />}
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Expired ({expired.length})
              </h2>
              {expired.map((flight) => (
                <FlightCard key={flight.id} flight={flight} />
              ))}
            </div>
          )}

          {/* Empty state */}
          {userFlights.length === 0 && (
            <Card>
              <CardHeader>
                <CardTitle>No flights found yet</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We scan your email for booking confirmations and show flights
                  eligible for miles. Click &quot;Find More Miles&quot; to get
                  started.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </>
  );
}
