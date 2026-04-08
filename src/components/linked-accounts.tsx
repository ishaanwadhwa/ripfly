"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { X, Plus } from "lucide-react";

interface LinkedAccount {
  id: string;
  email: string;
}

export function LinkedAccounts({
  primaryEmail,
  linkedAccounts,
}: {
  primaryEmail: string;
  linkedAccounts: LinkedAccount[];
}) {
  const [unlinking, setUnlinking] = useState<string | null>(null);
  const router = useRouter();

  async function handleUnlink(id: string) {
    setUnlinking(id);
    try {
      await fetch("/api/gmail/unlink", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ linkedAccountId: id }),
      });
      router.refresh();
    } finally {
      setUnlinking(null);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      <span className="font-medium">Scanning:</span>

      {/* Primary account */}
      <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 font-mono">
        {primaryEmail}
      </span>

      {/* Linked accounts */}
      {linkedAccounts.map((la) => (
        <span
          key={la.id}
          className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-0.5 font-mono"
        >
          {la.email}
          <button
            onClick={() => handleUnlink(la.id)}
            disabled={unlinking === la.id}
            className="rounded-full p-0.5 hover:bg-foreground/10 transition-colors"
            aria-label={`Unlink ${la.email}`}
          >
            <X className="w-3 h-3" />
          </button>
        </span>
      ))}

      {/* Link button */}
      <a
        href="/api/gmail/link"
        className="inline-flex items-center gap-1 rounded-md border border-dashed px-2 py-0.5 hover:bg-muted transition-colors"
      >
        <Plus className="w-3 h-3" />
        Add
      </a>
    </div>
  );
}
