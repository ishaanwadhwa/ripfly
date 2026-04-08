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

const REJECTION_REASONS = [
  { value: "not_a_member", label: "Not a loyalty program member" },
  { value: "pnr_not_found", label: "PNR not found" },
  { value: "outside_window", label: "Outside claim window" },
  { value: "already_claimed", label: "Already claimed" },
  { value: "name_mismatch", label: "Name mismatch" },
  { value: "other", label: "Other" },
] as const;

const REJECTION_HELP: Record<string, string> = {
  not_a_member: "Sign up for the airline's loyalty program first (e.g. IndiGo BluChip), then retry your claim.",
  pnr_not_found: "Double-check the PNR. If it's correct, contact the airline's customer support.",
  outside_window: "Unfortunately the retro-claim window has closed. Future flights will be tracked automatically.",
  already_claimed: "These miles may already be in your loyalty account. Check your balance.",
  name_mismatch: "Your loyalty account name must match the passenger name on the booking exactly.",
  other: "Contact the airline's customer support for more details.",
};

export function ClaimStatus({
  claimId,
  currentStatus,
  flightId,
  rejectionReason,
}: {
  claimId: string | null;
  currentStatus: string | null;
  flightId: string;
  rejectionReason?: string | null;
}) {
  const [isLoading, setIsLoading] = useState(false);
  const [showRejectPicker, setShowRejectPicker] = useState(false);
  const [selectedReason, setSelectedReason] = useState("");
  const [otherNotes, setOtherNotes] = useState("");
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

  async function updateStatus(status: string, reason?: string, notes?: string) {
    if (!claimId) return;
    setIsLoading(true);
    try {
      await fetch("/api/claims", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          claimId,
          status,
          ...(reason && { rejectionReason: reason }),
          ...(notes && { notes }),
        }),
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

  // Rejected — show reason + help + retry option
  if (currentStatus === "rejected") {
    const reason = REJECTION_REASONS.find((r) => r.value === rejectionReason);
    return (
      <div className="space-y-2">
        <Badge variant="outline" className={STATUS_STYLES.rejected}>
          Rejected
        </Badge>
        {reason && (
          <p className="text-sm text-muted-foreground">
            <span className="font-medium text-foreground">Reason:</span>{" "}
            {reason.label}
          </p>
        )}
        {rejectionReason && REJECTION_HELP[rejectionReason] && (
          <p className="text-sm text-muted-foreground bg-muted/50 rounded-lg p-3">
            {REJECTION_HELP[rejectionReason]}
          </p>
        )}
        <Button
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => updateStatus("initiated")}
        >
          {isLoading ? "Retrying..." : "Retry Claim"}
        </Button>
      </div>
    );
  }

  // Credited — terminal success
  if (currentStatus === "credited") {
    return (
      <Badge variant="outline" className={STATUS_STYLES.credited}>
        Miles Credited
      </Badge>
    );
  }

  // Rejection reason picker
  if (showRejectPicker) {
    return (
      <div className="space-y-3">
        <p className="text-sm font-medium">Why was your claim rejected?</p>
        <div className="flex flex-col gap-2">
          {REJECTION_REASONS.map((reason) => (
            <button
              key={reason.value}
              className={`text-left text-sm px-3 py-2 rounded-lg border transition-colors ${
                selectedReason === reason.value
                  ? "border-primary bg-primary/5"
                  : "border-border hover:bg-muted"
              }`}
              onClick={() => setSelectedReason(reason.value)}
            >
              {reason.label}
            </button>
          ))}
        </div>
        {selectedReason === "other" && (
          <input
            type="text"
            placeholder="What happened?"
            className="w-full text-sm px-3 py-2 rounded-lg border border-border bg-background"
            value={otherNotes}
            onChange={(e) => setOtherNotes(e.target.value)}
          />
        )}
        <div className="flex gap-2">
          <Button
            size="sm"
            disabled={!selectedReason || isLoading}
            onClick={() =>
              updateStatus(
                "rejected",
                selectedReason,
                selectedReason === "other" ? otherNotes : undefined
              )
            }
          >
            {isLoading ? "Saving..." : "Submit"}
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setShowRejectPicker(false);
              setSelectedReason("");
              setOtherNotes("");
            }}
          >
            Cancel
          </Button>
        </div>
      </div>
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
        {nextStatuses.map((opt) =>
          opt.value === "rejected" ? (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => setShowRejectPicker(true)}
            >
              {opt.next}
            </Button>
          ) : (
            <Button
              key={opt.value}
              variant="outline"
              size="sm"
              disabled={isLoading}
              onClick={() => updateStatus(opt.value)}
            >
              {opt.next}
            </Button>
          )
        )}
      </div>
    </div>
  );
}
