import Link from "next/link";
import { redirect } from "next/navigation";
import { Dumbbell } from "lucide-react";
import { Button } from "@/components/ui/button";
import { APP_DESCRIPTION, APP_NAME } from "@/lib/app";
import { getCurrentUser } from "@/lib/auth/session";

export default async function Home() {
  // Without a database configured yet, auth throws; show the public page.
  const user = await getCurrentUser().catch(() => null);
  if (user) redirect("/train");

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-col items-start gap-6 px-4 py-16 sm:px-6">
      <Dumbbell className="size-10 text-primary" aria-hidden="true" />
      <h1 className="text-4xl font-bold tracking-tight">{APP_NAME}</h1>
      <p className="text-lg text-muted-foreground">{APP_DESCRIPTION}</p>
      <Button asChild size="lg">
        <Link href="/login?callbackUrl=%2Ftrain">Sign in</Link>
      </Button>
    </main>
  );
}
