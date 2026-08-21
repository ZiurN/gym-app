import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { nutritionPrinciples, sampleMenus, supplements, mealPrepSessions } from "@/lib/plan";
import { UtensilsCrossed, Pill, ChefHat } from "lucide-react";

export function NutritionGuide() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ChefHat className="size-5 text-primary" />
            Batch cooking: cocina 2 veces, come toda la semana
          </CardTitle>
          <CardDescription>
            Dos sesiones de cocina (domingo y miércoles) cubren todas tus comidas principales. Todo va a
            tuppers en la nevera; lo que no vayas a comer en 3 días, al congelador. Sin pescado ni marisco.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          {mealPrepSessions.map((session) => (
            <div key={session.day} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{session.day}</h3>
                <Badge variant="secondary">{session.duration}</Badge>
              </div>
              <Separator className="my-3" />
              <dl className="grid gap-3 text-sm">
                {session.items.map((item) => (
                  <div key={item.name}>
                    <dt className="font-medium">{item.name}</dt>
                    <dd className="text-muted-foreground">{item.detail}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UtensilsCrossed className="size-5 text-primary" />
            Cómo se monta tu día con los tuppers
          </CardTitle>
          <CardDescription>
            Menús montados solo con lo que sale del batch cooking, ajustados a tus ~2.600 kcal en día de
            entrenamiento y ~2.300 kcal en día de descanso. El desayuno y los snacks no requieren cocinar nada.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-6 lg:grid-cols-2">
          {sampleMenus.map((menu) => (
            <div key={menu.label} className="rounded-lg border p-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <h3 className="font-semibold">{menu.label}</h3>
                <Badge variant="secondary">{menu.kcal}</Badge>
              </div>
              <Separator className="my-3" />
              <dl className="grid gap-3 text-sm">
                {menu.meals.map((meal) => (
                  <div key={meal.name}>
                    <dt className="font-medium">{meal.name}</dt>
                    <dd className="text-muted-foreground">{meal.content}</dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {nutritionPrinciples.map((p) => (
          <Card key={p.title}>
            <CardHeader>
              <CardTitle className="text-base">{p.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{p.body}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Pill className="size-5 text-primary" />
            Suplementos: qué merece la pena y qué no
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {supplements.map((s) => (
            <div key={s.name} className="rounded-lg border p-4">
              <p className="font-medium">{s.name}</p>
              <p className="mt-1 text-sm text-muted-foreground">{s.detail}</p>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
