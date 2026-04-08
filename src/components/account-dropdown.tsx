"use client";

import { Popover } from "@base-ui/react/popover";
import { EditName } from "@/components/edit-name";
import { LinkedAccounts } from "@/components/linked-accounts";
import { SignOutButton } from "@/components/sign-out-button";

interface LinkedAccount {
  id: string;
  email: string;
}

export function AccountDropdown({
  name,
  email,
  linkedAccounts,
}: {
  name: string;
  email: string;
  linkedAccounts: LinkedAccount[];
}) {
  const displayName = name?.split(" ")[0] || email;

  return (
    <Popover.Root>
      <Popover.Trigger className="text-sm text-muted-foreground hover:text-foreground transition-colors cursor-pointer">
        {displayName}
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Positioner side="bottom" align="end" sideOffset={8}>
          <Popover.Popup className="w-80 max-w-[calc(100vw-2rem)] rounded-lg border bg-background shadow-lg p-4 space-y-4">
            {/* Name */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Name</span>
              <EditName currentName={name} />
            </div>

            <hr className="border-border" />

            {/* Primary email */}
            <div className="space-y-1">
              <span className="text-xs text-muted-foreground">Primary Email</span>
              <p className="text-sm font-medium">{email}</p>
            </div>

            <hr className="border-border" />

            {/* Linked accounts */}
            <div className="space-y-2">
              <span className="text-xs text-muted-foreground">Linked Gmail Accounts</span>
              <LinkedAccounts
                primaryEmail={email}
                linkedAccounts={linkedAccounts}
              />
            </div>

            <hr className="border-border" />

            <SignOutButton />
          </Popover.Popup>
        </Popover.Positioner>
      </Popover.Portal>
    </Popover.Root>
  );
}
