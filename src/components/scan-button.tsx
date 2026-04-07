"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function ScanButton() {
  const [isScanning, setIsScanning] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const router = useRouter();

  async function handleScan() {
    setIsScanning(true);
    setResult(null);

    try {
      const res = await fetch("/api/flights/scan", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResult(data.error ?? "Scan failed");
        return;
      }

      if (data.newFlights > 0) {
        setResult(`Found ${data.newFlights} new flight${data.newFlights > 1 ? "s" : ""}!`);
      } else {
        setResult("No new flights found.");
      }

      router.refresh();
    } catch {
      setResult("Something went wrong. Try again.");
    } finally {
      setIsScanning(false);
    }
  }

  return (
    <div className="flex items-center gap-3">
      <Button onClick={handleScan} disabled={isScanning}>
        {isScanning && <Loader2 className="animate-spin" />}
        {isScanning ? "Scanning..." : "Find More Miles"}
      </Button>
      {result && (
        <span className="text-sm text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
