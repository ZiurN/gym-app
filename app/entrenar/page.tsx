import Link from "next/link";
import { requireUser } from "@/lib/auth/session";
import { getActiveRoutine } from "@/lib/routines/service";
import { suggestNextDayId } from "@/lib/workout/next-day";
import {
  getInProgressSession,
  getLastCompletedDayId,
} from "@/lib/workout/queries";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dumbbell } from "lucide-react";

export default async function EntrenarPage() {
  const user = await requireUser("/entrenar");
  const [inProgress, routine] = await Promise.all([
    getInProgressSession(user.id),
    getActiveRoutine(user.id),
  ]);
  const dayIds = routine?.days.map((day) => day.id) ?? [];
  const nextDayId = suggestNextDayId(
    dayIds,
    await getLastCompletedDayId(user.id, dayIds),
  );

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6">
      <header className="mb-8">
        <Badge variant="secondary" className="mb-3">
          Registro en vivo
        </Badge>
        <h1 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
          <Dumbbell className="size-8 text-primary" />
          Entrenar
        </h1>
        <p className="mt-2 max-w-2xl text-muted-foreground">
          {routine
            ? `Rutina activa: ${routine.name}. Puedes empezar cualquier día; solo cuentan las sesiones completadas.`
            : "Elige una rutina para empezar a registrar tus entrenamientos."}
        </p>
      </header>

      {inProgress?.routineDayId ? (
        <Card className="mb-6 border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">
              Sesión en curso · {inProgress.dayName}
            </CardTitle>
            <CardDescription>
              Tienes un entrenamiento sin finalizar. Continúa o empieza otro día
              (se descartará el anterior).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href={`/entrenar/${inProgress.routineDayId}`}>Continuar</Link>
            </Button>
          </CardContent>
        </Card>
      ) : null}

      {routine ? (
        <div className="grid gap-4 sm:grid-cols-2">
          {routine.days.map((day) => {
            const isNext = day.id === nextDayId;
            return (
              <Card key={day.id} className={isNext ? "border-2 border-primary" : undefined}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="text-lg">{day.name}</CardTitle>
                    {isNext ? <Badge>Siguiente</Badge> : null}
                  </div>
                  <CardDescription>
                    {day.exercises.length}{" "}
                    {day.exercises.length === 1 ? "ejercicio" : "ejercicios"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button asChild variant={isNext ? "default" : "outline"}>
                    <Link href={`/entrenar/${day.id}`}>Empezar</Link>
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">No tienes una rutina activa</CardTitle>
            <CardDescription>
              Crea una rutina con los días y ejercicios que entrenas, o activa
              una que ya tengas guardada.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/routines">Ir a rutinas</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <p className="mt-8 text-sm">
        <Link href="/progreso" className="text-primary underline-offset-4 hover:underline">
          Ver progreso por ejercicio
        </Link>
      </p>
    </main>
  );
}
