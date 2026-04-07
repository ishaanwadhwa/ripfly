import { auth } from "@/lib/auth";
import { SignOutButton } from "@/components/sign-out-button";

export async function Navbar() {
  const session = await auth();

  if (!session?.user) return null;

  return (
    <nav className="border-b px-6 py-3 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <span className="font-bold text-lg">RipFly</span>
      </div>
      <div className="flex items-center gap-4">
        <span className="text-sm text-muted-foreground">
          {session.user.email}
        </span>
        <SignOutButton />
      </div>
    </nav>
  );
}
