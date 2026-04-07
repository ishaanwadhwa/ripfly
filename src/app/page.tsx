import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { SignInButton } from "@/components/sign-in-button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardAction,
} from "@/components/ui/card";
import { Mail, Plane, Bell } from "lucide-react";

const MOCK_FLIGHTS = [
  {
    airline: "IndiGo",
    flightNumber: "6E 2142",
    origin: "DEL",
    destination: "BLR",
    pnr: "AY6JSR",
    date: "28 Mar 2026",
    passenger: "Anirudh B.",
    daysLeft: 3,
    urgency: "red" as const,
  },
  {
    airline: "Air India",
    flightNumber: "AI 802",
    origin: "BOM",
    destination: "DEL",
    pnr: "K7M2PQ",
    date: "18 Feb 2026",
    passenger: "Anirudh B.",
    daysLeft: 47,
    urgency: "yellow" as const,
  },
  {
    airline: "IndiGo",
    flightNumber: "6E 517",
    origin: "HYD",
    destination: "BOM",
    pnr: "R4NX8W",
    date: "15 Jan 2026",
    passenger: "Anirudh B.",
    daysLeft: 82,
    urgency: "green" as const,
  },
];

const urgencyStyles = {
  green: "bg-green-100 text-green-800",
  yellow: "bg-yellow-100 text-yellow-800",
  red: "bg-red-100 text-red-800",
};

const STEPS = [
  {
    icon: Mail,
    title: "Connect Gmail",
    description:
      "Read-only access. We scan for airline booking emails — nothing else.",
  },
  {
    icon: Plane,
    title: "We Detect Flights",
    description:
      "PNR, route, dates, airline — all extracted automatically from your inbox.",
  },
  {
    icon: Bell,
    title: "Claim Before Deadline",
    description:
      "Step-by-step guides with deep links. Never lose miles to an expired window again.",
  },
];

export default async function Home() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="flex flex-col">
      {/* Nav */}
      <nav className="flex items-center justify-between px-4 sm:px-6 py-4 border-b">
        <span className="text-lg font-bold tracking-tight">RipFly</span>
        <SignInButton variant="outline" />
      </nav>

      {/* Stats bar */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-x-6 gap-y-1 px-4 sm:px-6 py-2.5 bg-muted/50 text-xs sm:text-sm text-muted-foreground border-b">
        <span>
          <span className="font-semibold text-foreground">$30B+</span> in miles
          go unclaimed every year
        </span>
        <span className="hidden sm:inline text-border">|</span>
        <span>
          Indian airlines give you only{" "}
          <span className="font-semibold text-foreground">90 days</span> to
          retro-claim
        </span>
        <span className="hidden sm:inline text-border">|</span>
        <span>
          <span className="font-semibold text-foreground">10-20%</span> of all
          earned miles expire unused
        </span>
      </div>

      {/* Hero */}
      <section className="flex flex-col items-center justify-center px-4 sm:px-6 pt-16 pb-12 md:pt-28 md:pb-24">
        <div className="max-w-2xl text-center space-y-5 md:space-y-6 animate-fade-in-up">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1]">
            Your miles are
            <span className="block text-red-600">expiring.</span>
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-lg mx-auto">
            RipFly finds flights buried in your inbox and reminds you to claim
            loyalty miles before the retro-claim window closes.
          </p>
          <div className="pt-2">
            <SignInButton />
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground">
            Read-only Gmail access. We never store your emails.
          </p>
        </div>
      </section>

      {/* Mock Dashboard */}
      <section className="px-4 sm:px-6 pb-16 md:pb-28">
        <div className="max-w-xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          <div className="rounded-xl border bg-card shadow-2xl shadow-black/10 overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-3xl hover:shadow-black/15">
            {/* Mock header */}
            <div className="px-4 sm:px-5 py-3 sm:py-4 border-b bg-muted/30">
              <p className="text-xs sm:text-sm text-muted-foreground">
                We found{" "}
                <span className="font-semibold text-foreground">3 flights</span>{" "}
                &middot; all still eligible for miles
              </p>
            </div>

            {/* Mock flight cards */}
            <div className="p-3 sm:p-4 space-y-3">
              {MOCK_FLIGHTS.map((flight) => (
                <Card
                  key={flight.pnr}
                  className={`transition-all duration-200 hover:scale-[1.02] hover:shadow-md cursor-pointer ${
                    flight.urgency === "red" ? "border-red-200" : ""
                  }`}
                >
                  <CardHeader>
                    <div className="min-w-0">
                      <CardTitle className="text-sm sm:text-base">
                        {flight.airline}
                        <span className="ml-1.5 sm:ml-2 text-muted-foreground font-normal">
                          {flight.flightNumber}
                        </span>
                      </CardTitle>
                      <p className="text-base sm:text-lg font-semibold mt-0.5">
                        {flight.origin}
                        <span className="text-muted-foreground mx-1 sm:mx-1.5">
                          &rarr;
                        </span>
                        {flight.destination}
                        <span className="hidden sm:inline text-sm font-normal text-muted-foreground ml-3">
                          {flight.date}
                        </span>
                      </p>
                    </div>
                    <CardAction>
                      <Badge
                        variant="outline"
                        className={`text-xs sm:text-sm ${urgencyStyles[flight.urgency]}`}
                      >
                        {flight.urgency === "red"
                          ? `${flight.daysLeft}d left`
                          : `${flight.daysLeft}d left`}
                      </Badge>
                    </CardAction>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-x-4 sm:gap-x-5 gap-y-1 text-xs sm:text-sm text-muted-foreground">
                        <span>
                          PNR{" "}
                          <span className="font-mono font-medium text-foreground">
                            {flight.pnr}
                          </span>
                        </span>
                        <span className="hidden sm:inline">
                          {flight.passenger}
                        </span>
                      </div>
                      <span className="text-xs sm:text-sm font-medium text-primary whitespace-nowrap ml-2">
                        Claim Miles &rarr;
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-4 sm:px-6 py-16 md:py-28 bg-muted/40 border-y">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10 md:mb-12">
            How it works
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {STEPS.map((step, i) => (
              <div key={i} className="text-center space-y-3">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-background border">
                  <step.icon className="w-5 h-5 text-foreground" />
                </div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {step.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="px-4 sm:px-6 py-16 md:py-24">
        <div className="max-w-md mx-auto text-center space-y-3">
          <p className="text-base sm:text-lg font-medium">
            Check your inbox in 10 seconds.
          </p>
          <p className="text-sm text-muted-foreground">
            Free during beta. No credit card required.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-4 sm:px-6 py-6 border-t text-center text-xs text-muted-foreground">
        Built by Ishaan &middot; {new Date().getFullYear()}
      </footer>
    </main>
  );
}
