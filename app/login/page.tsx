import Link from "next/link";
import { LoginForm } from "@/components/auth/login-form";
import { getAuthErrorMessage } from "@/lib/auth/errors";
import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type SearchParams = Promise<{
  callbackUrl?: string | string[];
  error?: string | string[];
}>;

function authConfigured() {
  return Boolean(
    process.env.DATABASE_URL &&
      process.env.AUTH_SECRET &&
      (process.env.AUTH_GOOGLE_ID || process.env.AUTH_RESEND_KEY),
  );
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const callbackUrl = Array.isArray(params.callbackUrl)
    ? params.callbackUrl[0]
    : params.callbackUrl || "/train";

  if (!authConfigured()) {
    return (
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-10 sm:px-6">
        <div className="mb-6 w-full max-w-md text-sm">
          <Link href="/" className="text-muted-foreground hover:text-foreground">
            ← Back
          </Link>
        </div>
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle>The environment is not set up</CardTitle>
            <CardDescription>
              Sign-in needs Postgres (`DATABASE_URL`), `AUTH_SECRET` and at least Google or
              Resend. Follow the guide in <code>docs/AUTH_SETUP.md</code>.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-muted-foreground">
            Copy <code>.env.example</code> to <code>.env.local</code>, fill in the variables and
            run <code>npm run db:migrate</code>.
          </CardContent>
        </Card>
      </main>
    );
  }

  const session = await auth();
  if (session?.user) {
    redirect(callbackUrl.startsWith("/") ? callbackUrl : "/train");
  }

  const errorMessage = getAuthErrorMessage(params.error);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col items-center px-4 py-10 sm:px-6">
      <div className="mb-6 w-full max-w-md text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Back
        </Link>
      </div>
      <LoginForm callbackUrl={callbackUrl} errorMessage={errorMessage} />
    </main>
  );
}
