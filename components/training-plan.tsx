import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trainingSplit, progression, trainingRules, warmup, optionalFifthDay } from "@/lib/plan";
import { Flame, TrendingUp, CalendarPlus } from "lucide-react";

export function TrainingPlan() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-5 text-primary" />
            Cómo progresan las 4 semanas
          </CardTitle>
          <CardDescription>
            La rutina de 4 días no cambia: lo que sube cada semana es la carga, las series y la cercanía al
            fallo. Así recuperas tus marcas sin que tendones y articulaciones se queden atrás.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {progression.map((week) => (
            <div key={week.week} className="flex flex-col rounded-lg border p-4">
              <div className="flex items-center justify-between gap-2">
                <p className="font-semibold">{week.week}</p>
                <Badge variant="secondary">{week.label}</Badge>
              </div>
              <dl className="mt-3 grid gap-2 text-sm">
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Series</dt>
                  <dd>{week.series}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Carga</dt>
                  <dd>{week.load}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Esfuerzo</dt>
                  <dd>{week.rpe}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-muted-foreground">Cardio</dt>
                  <dd>{week.cardio}</dd>
                </div>
              </dl>
              <p className="mt-3 border-t pt-3 text-xs text-muted-foreground">{week.note}</p>
            </div>
          ))}
        </CardContent>
      </Card>

      <div>
        <h2 className="text-lg font-semibold">Tu rutina torso / pierna (4 días)</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Las series de la tabla son el objetivo de la semana 4; en las semanas anteriores aplica las series y
          cargas de la progresión de arriba. Lunes y martes, descanso el miércoles, jueves y viernes.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {trainingSplit.map((day) => (
          <Card key={day.title}>
            <CardHeader>
              <CardTitle className="text-base">{day.title}</CardTitle>
              <CardDescription>{day.focus}</CardDescription>
            </CardHeader>
            <CardContent>
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs text-muted-foreground">
                    <th className="pb-2 font-medium">Ejercicio</th>
                    <th className="pb-2 pl-2 font-medium">Series objetivo</th>
                    <th className="pb-2 pl-2 font-medium">Reps</th>
                  </tr>
                </thead>
                <tbody>
                  {day.exercises.map((ex) => (
                    <tr key={ex.name} className="border-b last:border-0">
                      <td className="py-2 pr-2">
                        {ex.name}
                        {ex.note ? (
                          <span className="block text-xs text-muted-foreground">{ex.note}</span>
                        ) : null}
                      </td>
                      <td className="py-2 pl-2 whitespace-nowrap">{ex.sets}</td>
                      <td className="py-2 pl-2 whitespace-nowrap">{ex.reps}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Flame className="size-5 text-primary" />
              Calentamiento (antes de cada sesión, ~10 min)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="grid gap-2 text-sm">
              {warmup.map((step, i) => (
                <li key={i} className="flex gap-3">
                  <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                    {i + 1}
                  </span>
                  <span className="text-muted-foreground">{step}</span>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarPlus className="size-5 text-primary" />
              {optionalFifthDay.title}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{optionalFifthDay.body}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Reglas de oro para estas 4 semanas</CardTitle>
          <CardDescription>
            Lo que marca la diferencia entre retomar bien y volver a dejarlo (o lesionarte).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            {trainingRules.map((rule, i) => (
              <AccordionItem key={rule.title} value={`rule-${i}`}>
                <AccordionTrigger className="text-left">{rule.title}</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">{rule.body}</AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
