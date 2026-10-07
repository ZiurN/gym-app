import Link from "next/link";
import { Button } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

function initials(name: string | null, email: string | null): string {
  const words = (name ?? "").trim().split(/\s+/).filter(Boolean);
  if (words.length >= 2) return (words[0][0] + words[words.length - 1][0]).toUpperCase();
  return (words[0] ?? email ?? "?").slice(0, 2).toUpperCase();
}

/** Right side of the top bar: section links on wide screens and the account. */
export async function AuthHeader() {
  // No DATABASE_URL or secrets yet: the public page still works.
  const user = await getCurrentUser().catch(() => null);

  if (!user) {
    return (
      <Button asChild variant="outline" size="sm">
        <Link href="/login">Sign in</Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {/* Phones get these as the bottom tab bar. */}
      <nav aria-label="Main" className="hidden items-center gap-1 sm:flex">
        <Button asChild variant="ghost" size="sm">
          <Link href="/train">Train</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/progress">Progress</Link>
        </Button>
        <Button asChild variant="ghost" size="sm">
          <Link href="/routines">Routines</Link>
        </Button>
      </nav>
      <Link
        href="/account"
        aria-label="Account"
        title={user.name ?? user.email ?? "Account"}
        className="flex size-11 items-center justify-center rounded-full bg-muted text-sm font-semibold hover:bg-accent"
      >
        {initials(user.name, user.email)}
      </Link>
    </div>
  );
}
