import { auth } from "@/lib/auth";
import { createDb } from "@/lib/db";
import { linkedAccounts } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { AccountDropdown } from "@/components/account-dropdown";

export async function Navbar() {
  const session = await auth();

  if (!session?.user) return null;

  const db = createDb();
  const userLinkedAccounts = await db
    .select({ id: linkedAccounts.id, email: linkedAccounts.email })
    .from(linkedAccounts)
    .where(eq(linkedAccounts.userId, session.user.id!));

  return (
    <nav className="border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg">RipFly</span>
      </div>
      <AccountDropdown
        name={session.user.name ?? ""}
        email={session.user.email ?? ""}
        linkedAccounts={userLinkedAccounts}
      />
    </nav>
  );
}
