import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { signOut } from "@/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AccountPage() {
  const user = await requireUser();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <Card className="max-w-lg">
        <CardHeader>
          <Badge variant="secondary" className="mb-2 w-fit">
            Your account
          </Badge>
          <CardTitle>Account</CardTitle>
          <CardDescription>
            The account your routines and workouts are saved to.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div className="flex flex-wrap gap-2">
            <Button asChild>
              <Link href="/train">Train</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/progress">Progress</Link>
            </Button>
          </div>
          <div>
            <p className="text-muted-foreground">Name</p>
            <p className="font-medium">{user.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Email</p>
            <p className="font-medium">{user.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">User ID</p>
            <p className="break-all font-mono text-xs">{user.id}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline">
              Sign out
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
