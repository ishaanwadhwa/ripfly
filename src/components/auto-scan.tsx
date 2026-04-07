"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Plane } from "lucide-react";

export function AutoScan() {
  const [status, setStatus] = useState<"scanning" | "done" | "error">("scanning");
  const [message, setMessage] = useState("Scanning your inbox for flights...");
  const router = useRouter();

  useEffect(() => {
    let cancelled = false;

    async function scan() {
      try {
        const res = await fetch("/api/flights/scan", { method: "POST" });
        if (cancelled) return;
        const data = await res.json();

        if (!res.ok) {
          setStatus("error");
          setMessage(data.error ?? "Scan failed. Try again.");
          return;
        }

        if (data.newFlights > 0) {
          setMessage(`Found ${data.newFlights} flight${data.newFlights > 1 ? "s" : ""}!`);
        } else {
          setMessage("No flights found in your inbox yet.");
        }
        setStatus("done");
        router.refresh();
      } catch {
        if (cancelled) return;
        setStatus("error");
        setMessage("Something went wrong. Try again.");
      }
    }

    scan();
    return () => { cancelled = true; };
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center py-20 space-y-4">
      <div className={`rounded-full bg-muted p-4 ${status === "scanning" ? "animate-pulse" : ""}`}>
        <Plane className="w-8 h-8 text-muted-foreground" />
      </div>
      <p className="text-sm text-muted-foreground">{message}</p>
      {status === "scanning" && (
        <p className="text-xs text-muted-foreground">This may take a few seconds...</p>
      )}
    </div>
  );
}
