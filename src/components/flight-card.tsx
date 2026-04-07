import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import type { flights } from "@/lib/db/schema";

type Flight = typeof flights.$inferSelect;

export function getClaimDeadline(flight: Flight) {
  if (!flight.flightDate)
    return { daysRemaining: null, urgency: "expired" as const };

  const flightDateMs = new Date(flight.flightDate).getTime();
  const deadlineMs = flightDateMs + flight.claimWindowDays * 86_400_000;
  const daysRemaining = Math.ceil((deadlineMs - Date.now()) / 86_400_000);

  let urgency: "green" | "yellow" | "red" | "expired";
  if (daysRemaining <= 0) urgency = "expired";
  else if (daysRemaining < 30) urgency = "red";
  else if (daysRemaining < 60) urgency = "yellow";
  else urgency = "green";

  return { daysRemaining, urgency };
}

const urgencyStyles = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
  expired: "bg-muted text-muted-foreground",
} as const;

function urgencyLabel(daysRemaining: number | null, urgency: string) {
  if (urgency === "expired" || daysRemaining === null) {
    if (daysRemaining !== null && daysRemaining < 0) {
      const months = Math.floor(Math.abs(daysRemaining) / 30);
      if (months > 0) return `Expired ${months}mo ago`;
      return `Expired ${Math.abs(daysRemaining)}d ago`;
    }
    return "Expired";
  }
  if (daysRemaining <= 7) return `Expires in ${daysRemaining}d`;
  return `${daysRemaining} days left`;
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function FlightCard({ flight }: { flight: Flight }) {
  const { daysRemaining, urgency } = getClaimDeadline(flight);
  const isEligible = urgency !== "expired";

  return (
    <Link href={`/flights/${flight.id}`} className="block">
    <Card className={`${!isEligible ? "opacity-60" : ""} hover:border-foreground/20 transition-colors`}>
      <CardHeader>
        <div>
          <CardTitle className="text-base">
            {flight.airlineName}
            {flight.flightNumber && (
              <span className="ml-2 text-muted-foreground font-normal">
                {flight.flightNumber}
              </span>
            )}
          </CardTitle>
          {flight.origin && flight.destination && (
            <p className="text-lg font-semibold mt-0.5">
              {flight.origin}
              <span className="text-muted-foreground mx-1.5">&rarr;</span>
              {flight.destination}
              {flight.flightDate && (
                <span className="text-sm font-normal text-muted-foreground ml-3">
                  {formatDate(flight.flightDate)}
                </span>
              )}
            </p>
          )}
          {!flight.origin && flight.flightDate && (
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatDate(flight.flightDate)}
            </p>
          )}
        </div>
        <CardAction>
          <Badge variant="outline" className={urgencyStyles[urgency]}>
            {urgencyLabel(daysRemaining, urgency)}
          </Badge>
        </CardAction>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
            <span>
              PNR <span className="font-mono font-medium text-foreground">{flight.pnr}</span>
            </span>
            {flight.passengerName && (
              <span>{flight.passengerName}</span>
            )}
          </div>
          {isEligible && (
            <span className="text-sm font-medium text-primary">
              Claim Miles &rarr;
            </span>
          )}
        </div>
      </CardContent>
    </Card>
    </Link>
  );
}
