import Link from "next/link";
import type { Session } from "next-auth";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function AuthHeader() {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    // No DATABASE_URL or secrets yet: the public page still works.
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Sign in</Link>
        </Button>
      </div>
    );
  }

  const label = session.user.name ?? session.user.email ?? "Account";

  return (
    <div className="flex max-w-full items-center gap-2">
      <Button asChild variant="default" size="sm">
        <Link href="/train">Train</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/progress">Progress</Link>
      </Button>
      <Button asChild variant="ghost" size="sm">
        <Link href="/routines">Routines</Link>
      </Button>
      <Button asChild variant="ghost" size="sm" className="max-w-[12rem] truncate">
        <Link href="/account" title={label}>
          {label}
        </Link>
      </Button>
      <form
        action={async () => {
          "use server";
          await signOut({ redirectTo: "/" });
        }}
      >
        <Button type="submit" variant="outline" size="sm">
          Sign out
        </Button>
      </form>
    </div>
  );
}
