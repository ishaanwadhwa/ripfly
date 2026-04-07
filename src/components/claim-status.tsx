"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

const STATUS_OPTIONS = [
  { value: "submitted", label: "I submitted the claim", next: "Mark as Submitted" },
  { value: "credited", label: "Miles were credited", next: "Mark as Credited" },
  { value: "rejected", label: "Claim was rejected", next: "Mark as Rejected" },
] as const;

const STATUS_STYLES: Record<string, string> = {
  initiated: "bg-blue-100 text-blue-800",
  submitted: "bg-yellow-100 text-yellow-800",
  pending: "bg-yellow-100 text-yellow-800",
  credited: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const STATUS_LABELS: Record<string, string> = {
  initiated: "Claim Started",
  submitted: "Submitted to Airline",
  pending: "Pending Review",
  credited: "Miles Credited",
  rejected: "Rejected",
};

export function ClaimStatus({
  claimId,
  currentStatus,
  flightId,
}: {
  claimId: string | null;
  currentStatus: string | null;
  flightId: string;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function initiateClaim() {
    setIsLoading(true);
    try {
      await fetch("/api/claims", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ flightId }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  async function updateStatus(status: string) {
    if (!claimId) return;
    setIsLoading(true);
    try {
      await fetch("/api/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ claimId, status }),
      });
      router.refresh();
    } finally {
      setIsLoading(false);
    }
  }

  // No claim yet — show start button
  if (!claimId || !currentStatus) {
    return (
      <Button onClick={initiateClaim} disabled={isLoading}>
        {isLoading ? "Starting..." : "Start Claim Process"}
      </Button>
    );
  }

  // Terminal states
  if (currentStatus === "credited" || currentStatus === "rejected") {
    return (
      <Badge variant="outline" className={STATUS_STYLES[currentStatus] ?? ""}>
        {STATUS_LABELS[currentStatus]}
      </Badge>
    );
  }

  // Active claim — show status + next actions
  const nextStatuses = STATUS_OPTIONS.filter((s) => {
    if (currentStatus === "initiated") return true;
    if (currentStatus === "submitted")
      return s.value === "credited" || s.value === "rejected";
    return false;
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground">Status:</span>
        <Badge variant="outline" className={STATUS_STYLES[currentStatus] ?? ""}>
          {STATUS_LABELS[currentStatus] ?? currentStatus}
        </Badge>
      </div>
      <div className="flex flex-wrap gap-2">
        {nextStatuses.map((opt) => (
          <Button
            key={opt.value}
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={() => updateStatus(opt.value)}
          >
            {opt.next}
          </Button>
        ))}
      </div>
    </div>
  );
}
