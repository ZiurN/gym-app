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
      <div className="mb-6 text-sm">
        <Link href="/" className="text-muted-foreground hover:text-foreground">
          ← Volver al plan
        </Link>
      </div>

      <Card className="max-w-lg">
        <CardHeader>
          <Badge variant="secondary" className="mb-2 w-fit">
            Área personal
          </Badge>
          <CardTitle>Tu cuenta</CardTitle>
          <CardDescription>
            Esta zona requiere sesión. Aquí vivirán más adelante tus entrenamientos y
            progreso.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 text-sm">
          <div>
            <p className="text-muted-foreground">Nombre</p>
            <p className="font-medium">{user.name ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Correo</p>
            <p className="font-medium">{user.email ?? "—"}</p>
          </div>
          <div>
            <p className="text-muted-foreground">ID de usuario (estable)</p>
            <p className="break-all font-mono text-xs">{user.id}</p>
          </div>
          <form
            action={async () => {
              "use server";
              await signOut({ redirectTo: "/" });
            }}
          >
            <Button type="submit" variant="outline">
              Cerrar sesión
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
