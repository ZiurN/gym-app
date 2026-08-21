import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { MacroCalculator } from "@/components/macro-calculator";
import { TrainingPlan } from "@/components/training-plan";
import { NutritionGuide } from "@/components/nutrition-guide";
import { Dumbbell, Calculator, Apple } from "lucide-react";

export default function Home() {
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <header className="mb-10">
        <Badge variant="secondary" className="mb-3">
          Plan de reincorporación · 4 semanas
        </Badge>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Tu regreso al entrenamiento
        </h1>
        <p className="mt-3 max-w-2xl text-muted-foreground">
          Dos años de experiencia y dos meses de pausa: la fuerza vuelve rápido, pero hay que dársela por
          dosis. Rutina torso/pierna de 4 días en gimnasio con progresión semanal de carga, y una dieta
          resuelta con dos sesiones de batch cooking a la semana. Empieza por la calculadora.
        </p>
      </header>

      <Tabs defaultValue="calculadora" className="gap-8">
        <TabsList className="h-auto w-full flex-wrap sm:w-auto">
          <TabsTrigger value="calculadora" className="flex-1 gap-2 py-2 sm:flex-none">
            <Calculator className="size-4" />
            Calculadora
          </TabsTrigger>
          <TabsTrigger value="entrenamiento" className="flex-1 gap-2 py-2 sm:flex-none">
            <Dumbbell className="size-4" />
            Entrenamiento
          </TabsTrigger>
          <TabsTrigger value="nutricion" className="flex-1 gap-2 py-2 sm:flex-none">
            <Apple className="size-4" />
            Nutrición
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calculadora">
          <MacroCalculator />
        </TabsContent>
        <TabsContent value="entrenamiento">
          <TrainingPlan />
        </TabsContent>
        <TabsContent value="nutricion">
          <NutritionGuide />
        </TabsContent>
      </Tabs>

      <footer className="mt-14 border-t pt-6 text-xs text-muted-foreground">
        Esta guía es orientativa y no sustituye el consejo de un médico, nutricionista o fisioterapeuta. Si
        sientes dolor articular (no muscular) durante un ejercicio, páralo y consulta.
      </footer>
    </main>
  );
}
