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
      setLocalError("No se pudo iniciar el acceso con Google.");
      setPending(null);
    }
  }

  async function handleEmail(e: React.FormEvent) {
    e.preventDefault();
    setLocalError(null);
    if (!email.trim()) {
      setLocalError("Escribe tu correo electrónico.");
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
          "No se pudo enviar el enlace. Revisa el correo o prueba con Google.",
        );
        setPending(null);
        return;
      }
      setEmailSent(true);
      setPending(null);
    } catch {
      setLocalError("No se pudo enviar el enlace. Inténtalo de nuevo.");
      setPending(null);
    }
  }

  if (emailSent) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Revisa tu correo</CardTitle>
          <CardDescription>
            Te enviamos un enlace de acceso a <strong>{email}</strong>. Ábrelo en este
            mismo dispositivo. El enlace caduca en poco tiempo.
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
            Usar otro correo
          </Button>
        </CardContent>
      </Card>
    );
  }

  const shownError = localError ?? errorMessage;

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Iniciar sesión</CardTitle>
        <CardDescription>
          Entra con Google o con un enlace mágico a tu correo. Así podrás guardar tu
          progreso en la nube.
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
          {pending === "google" ? "Conectando…" : "Continuar con Google"}
        </Button>

        <div className="flex items-center gap-3">
          <Separator className="flex-1" />
          <span className="text-xs text-muted-foreground">o con correo</span>
          <Separator className="flex-1" />
        </div>

        <form onSubmit={handleEmail} className="grid gap-3">
          <div className="grid gap-2">
            <Label htmlFor="email">Correo electrónico</Label>
            <Input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={pending !== null}
              required
            />
          </div>
          <Button type="submit" variant="secondary" className="w-full" disabled={pending !== null}>
            {pending === "email" ? "Enviando enlace…" : "Enviarme enlace de acceso"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
