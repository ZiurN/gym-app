import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { trainingPlan, trainingRules, warmup } from "@/lib/plan";
import { Flame, HeartPulse } from "lucide-react";

export function TrainingPlan() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
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

      <Tabs defaultValue={trainingPlan[0].week} className="gap-6">
        <TabsList className="h-auto w-full flex-wrap">
          {trainingPlan.map((w) => (
            <TabsTrigger key={w.week} value={w.week} className="flex-1 py-2">
              <span className="flex flex-col items-center gap-0.5 sm:flex-row sm:gap-2">
                <span className="font-semibold">{w.week}</span>
                <span className="text-xs text-muted-foreground">{w.label}</span>
              </span>
            </TabsTrigger>
          ))}
        </TabsList>

        {trainingPlan.map((week) => (
          <TabsContent key={week.week} value={week.week} className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>
                  {week.week}: {week.label}
                </CardTitle>
                <CardDescription>{week.goal}</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-3 text-sm">
                <p>
                  <span className="font-semibold">Intensidad: </span>
                  <span className="text-muted-foreground">{week.intensity}</span>
                </p>
                <p className="flex items-start gap-2">
                  <HeartPulse className="mt-0.5 size-4 shrink-0 text-primary" />
                  <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">Cardio: </span>
                    {week.cardio}
                  </span>
                </p>
              </CardContent>
            </Card>

            <div className="grid gap-4 lg:grid-cols-2">
              {week.days.map((day) => (
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
                          <th className="pb-2 pl-2 font-medium">Series</th>
                          <th className="pb-2 pl-2 font-medium">Reps</th>
                          <th className="pb-2 pl-2 font-medium">RPE</th>
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
                            <td className="py-2 pl-2 whitespace-nowrap">
                              <Badge variant="outline">{ex.rpe}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        ))}
      </Tabs>

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
