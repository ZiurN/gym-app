"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Flame, Beef, Wheat, Droplets } from "lucide-react";

type Sex = "male" | "female";
type Goal = "cut" | "maintain" | "gain";

const activityOptions = [
  { value: "1.375", label: "Ligera — semanas 1–2 del plan (sesiones cortas)" },
  { value: "1.55", label: "Moderada — el plan completo: 4 días de gym" },
  { value: "1.725", label: "Alta — 5+ días de gym o trabajo físico" },
  { value: "1.2", label: "Sedentaria — sin entrenar (tu punto de partida)" },
];

const goalOptions: { value: Goal; label: string; hint: string }[] = [
  { value: "maintain", label: "Recomposición (recomendado al volver)", hint: "Comes en mantenimiento: recuperas músculo y sueles perder algo de grasa a la vez." },
  { value: "cut", label: "Perder grasa", hint: "Déficit moderado del 15 %. Espera perder ~0,5 % de tu peso por semana." },
  { value: "gain", label: "Ganar músculo", hint: "Superávit ligero del 10 %. Suficiente para construir sin acumular grasa de más." },
];

function formatKcal(n: number) {
  return new Intl.NumberFormat("es-ES").format(Math.round(n / 10) * 10);
}

export function MacroCalculator() {
  const [sex, setSex] = useState<Sex>("male");
  const [age, setAge] = useState("37");
  const [weight, setWeight] = useState("76.4");
  const [height, setHeight] = useState("175");
  const [activity, setActivity] = useState("1.55");
  const [goal, setGoal] = useState<Goal>("maintain");

  const result = useMemo(() => {
    const w = parseFloat(weight);
    const h = parseFloat(height);
    const a = parseFloat(age);
    if (!w || !h || !a || w < 30 || w > 300 || h < 120 || h > 230 || a < 14 || a > 100) {
      return null;
    }
    // Mifflin-St Jeor
    const bmr = 10 * w + 6.25 * h - 5 * a + (sex === "male" ? 5 : -161);
    const tdee = bmr * parseFloat(activity);
    const factor = goal === "cut" ? 0.85 : goal === "gain" ? 1.1 : 1;
    const kcal = tdee * factor;

    const proteinPerKg = goal === "cut" ? 2.2 : 1.8;
    const proteinG = proteinPerKg * w;
    const fatG = 0.9 * w;
    const carbsG = Math.max(0, (kcal - proteinG * 4 - fatG * 9) / 4);
    const waterL = (w * 35) / 1000;

    return { bmr, tdee, kcal, proteinG, fatG, carbsG, waterL };
  }, [sex, age, weight, height, activity, goal]);

  const goalHint = goalOptions.find((g) => g.value === goal)?.hint;

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.2fr]">
      <Card>
        <CardHeader>
          <CardTitle>Tus datos</CardTitle>
          <CardDescription>
            Con esto calculo tu gasto energético (fórmula Mifflin-St Jeor) y te propongo calorías y macros.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label>Sexo</Label>
              <Select value={sex} onValueChange={(v) => setSex(v as Sex)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">Hombre</SelectItem>
                  <SelectItem value="female">Mujer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="age">Edad</Label>
              <Input id="age" type="number" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="weight">Peso (kg)</Label>
              <Input id="weight" type="number" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="height">Altura (cm)</Label>
              <Input id="height" type="number" inputMode="numeric" value={height} onChange={(e) => setHeight(e.target.value)} />
            </div>
          </div>
          <div className="grid gap-2">
            <Label>Actividad actual</Label>
            <Select value={activity} onValueChange={setActivity}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label>Objetivo</Label>
            <Select value={goal} onValueChange={(v) => setGoal(v as Goal)}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalOptions.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {goalHint ? <p className="text-sm text-muted-foreground">{goalHint}</p> : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Tu objetivo diario</CardTitle>
          <CardDescription>
            {result
              ? "Son objetivos de partida: pésate 2–3 veces por semana en ayunas y ajusta ±150 kcal según la tendencia de 2 semanas."
              : "Completa tus datos para ver el cálculo."}
          </CardDescription>
        </CardHeader>
        {result ? (
          <CardContent className="grid gap-5">
            <div className="flex items-center justify-between rounded-lg bg-primary/10 p-4">
              <div className="flex items-center gap-3">
                <Flame className="size-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">Calorías objetivo</p>
                  <p className="text-3xl font-bold tracking-tight">
                    {formatKcal(result.kcal)} <span className="text-base font-normal text-muted-foreground">kcal/día</span>
                  </p>
                </div>
              </div>
              <div className="text-right text-sm text-muted-foreground">
                <p>Metabolismo basal: {formatKcal(result.bmr)} kcal</p>
                <p>Mantenimiento: {formatKcal(result.tdee)} kcal</p>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <MacroBox
                icon={<Beef className="size-5" />}
                label="Proteína"
                grams={result.proteinG}
                kcalShare={(result.proteinG * 4) / result.kcal}
                hint={`${goal === "cut" ? "2,2" : "1,8"} g por kg de peso`}
              />
              <MacroBox
                icon={<Droplets className="size-5" />}
                label="Grasas"
                grams={result.fatG}
                kcalShare={(result.fatG * 9) / result.kcal}
                hint="0,9 g por kg de peso"
              />
              <MacroBox
                icon={<Wheat className="size-5" />}
                label="Carbohidratos"
                grams={result.carbsG}
                kcalShare={(result.carbsG * 4) / result.kcal}
                hint="El resto de calorías"
              />
            </div>

            <Separator />
            <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <Badge variant="secondary">Agua: ~{result.waterL.toFixed(1)} L/día</Badge>
              <Badge variant="secondary">Proteína por comida: ~{Math.round(result.proteinG / 4)} g × 4 comidas</Badge>
            </div>
            <p className="text-xs text-muted-foreground">
              Estimación orientativa, no sustituye la valoración de un profesional sanitario. Si tienes alguna
              condición médica, consulta antes de cambiar tu dieta.
            </p>
          </CardContent>
        ) : (
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Revisa que la edad, el peso y la altura estén en rangos razonables.
            </p>
          </CardContent>
        )}
      </Card>
    </div>
  );
}

function MacroBox({
  icon,
  label,
  grams,
  kcalShare,
  hint,
}: {
  icon: React.ReactNode;
  label: string;
  grams: number;
  kcalShare: number;
  hint: string;
}) {
  return (
    <div className="rounded-lg border p-4">
      <div className="flex items-center gap-2 text-muted-foreground">
        {icon}
        <span className="text-sm font-medium">{label}</span>
      </div>
      <p className="mt-2 text-2xl font-bold">
        {Math.round(grams)} <span className="text-sm font-normal text-muted-foreground">g</span>
      </p>
      <p className="text-xs text-muted-foreground">
        {Math.round(kcalShare * 100)} % de las calorías · {hint}
      </p>
    </div>
  );
}
