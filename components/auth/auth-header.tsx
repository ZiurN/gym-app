import Link from "next/link";
import type { Session } from "next-auth";
import { auth, signOut } from "@/auth";
import { Button } from "@/components/ui/button";

export async function AuthHeader() {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch {
    // Sin DATABASE_URL / secrets todavía: la guía pública sigue usable.
  }

  if (!session?.user) {
    return (
      <div className="flex items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link href="/login">Entrar</Link>
        </Button>
      </div>
    );
  }

  const label = session.user.name ?? session.user.email ?? "Cuenta";

  return (
    <div className="flex max-w-full items-center gap-2">
      <Button asChild variant="ghost" size="sm" className="max-w-[12rem] truncate">
        <Link href="/cuenta" title={label}>
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
          Salir
        </Button>
      </form>
    </div>
  );
}
