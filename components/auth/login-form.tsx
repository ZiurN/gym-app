"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type Props = {
  callbackUrl: string;
  errorMessage: string | null;
};

export function LoginForm({ callbackUrl, errorMessage }: Props) {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState<"google" | "email" | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleGoogle() {
    setLocalError(null);
    setPending("google");
    try {
      await signIn("google", { callbackUrl });
    } catch {
      setLocalError("Could not start sign-in with Google.");
      setPending(null);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) {
      setLocalError("Enter your email address.");
      return;
    }
    setPending("email");
    try {
      const result = await signIn("resend", {
        email: email.trim(),
        callbackUrl,
        redirect: false,
      });
      if (result?.error) {
        setLocalError(
          "Could not send the link. Check the address or try Google.",
        );
        setPending(null);
        return;
      }
      setEmailSent(true);
      setPending(null);
    } catch {
      setLocalError("Could not send the link. Try again.");
      setPending(null);
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a sign-in link to <strong>{email}</strong>. Open it on this same
            device. The link expires soon.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setEmailSent(false);
              setPending(null);
            }}
          >
            Use another email
          </Button>
        </CardContent>
      </Card>
    );
  }

  const shownError = localError ?? errorMessage;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Sign in</CardTitle>
        <CardDescription>
          Use Google or a sign-in link sent to your email. Your routines and
          workouts are saved to your account.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        {shownError ? (
          <p
            role="alert"
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {shownError}
          </p>
        ) : null}

        <Button
          type="button"
          className="w-full"
          size="lg"
          disabled={pending !== null}
          onClick={handleGoogle}
        >
          {pending === "google" ? "Connecting…" : "Continue with Google"}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">or with email</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmail} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending !== null}
              required
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full" disabled={pending !== null}>
            {pending === "email" ? "Sending link…" : "Email me a sign-in link"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
