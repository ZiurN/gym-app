export type Exercise = {
  name: string;
  sets: string;
  reps: string;
  rpe: string;
  note?: string;
};

export type TrainingDay = {
  title: string;
  focus: string;
  exercises: Exercise[];
};

export type TrainingWeek = {
  week: string;
  label: string;
  goal: string;
  intensity: string;
  days: TrainingDay[];
  cardio: string;
};

// Plan de reincorporación: tras ~2 meses de pausa se pierde algo de fuerza y
// bastante tolerancia al volumen. La progresión sube volumen antes que carga
// para minimizar agujetas severas y riesgo de lesión.
export const trainingPlan: TrainingWeek[] = [
  {
    week: "Semanas 1–2",
    label: "Readaptación",
    goal: "Reactivar patrones de movimiento y tolerancia al entrenamiento sin destruirte de agujetas.",
    intensity:
      "Usa el 50–60 % del peso que movías antes de la pausa. Termina cada serie sintiendo que podrías hacer 3–4 repeticiones más (RPE 6–7). No busques el fallo.",
    cardio:
      "2 caminatas de 25–30 min en días de descanso (ritmo en el que puedes conversar).",
    days: [
      {
        title: "Día A (lunes)",
        focus: "Cuerpo completo — empuje dominante",
        exercises: [
          { name: "Sentadilla con barra o goblet", sets: "2–3", reps: "8–10", rpe: "6–7", note: "Prioriza profundidad y control, no peso." },
          { name: "Press de banca con mancuernas", sets: "2–3", reps: "8–10", rpe: "6–7" },
          { name: "Remo en máquina o con apoyo", sets: "2–3", reps: "10–12", rpe: "6–7" },
          { name: "Press militar sentado", sets: "2", reps: "10–12", rpe: "6" },
          { name: "Plancha abdominal", sets: "3", reps: "20–30 s", rpe: "—" },
        ],
      },
      {
        title: "Día B (miércoles)",
        focus: "Cuerpo completo — tracción dominante",
        exercises: [
          { name: "Peso muerto rumano con mancuernas", sets: "2–3", reps: "8–10", rpe: "6–7", note: "Bisagra de cadera; espalda neutra siempre." },
          { name: "Jalón al pecho", sets: "2–3", reps: "10–12", rpe: "6–7" },
          { name: "Prensa de piernas", sets: "2–3", reps: "10–12", rpe: "6–7" },
          { name: "Press inclinado en máquina", sets: "2", reps: "10–12", rpe: "6" },
          { name: "Curl de bíceps + extensión de tríceps", sets: "2", reps: "12–15", rpe: "6" },
        ],
      },
      {
        title: "Día C (viernes)",
        focus: "Cuerpo completo — piernas y core",
        exercises: [
          { name: "Zancadas o sentadilla búlgara", sets: "2", reps: "8–10 por pierna", rpe: "6–7" },
          { name: "Empuje de cadera (hip thrust)", sets: "2–3", reps: "10–12", rpe: "6–7" },
          { name: "Remo con mancuerna a una mano", sets: "2–3", reps: "10–12", rpe: "6–7" },
          { name: "Elevaciones laterales", sets: "2", reps: "12–15", rpe: "6" },
          { name: "Elevación de gemelos + rueda o crunch en polea", sets: "2", reps: "12–15", rpe: "6" },
        ],
      },
    ],
  },
  {
    week: "Semana 3",
    label: "Construcción",
    goal: "Subir volumen: una serie extra en los ejercicios principales y algo más de carga.",
    intensity:
      "Sube al 65–75 % de tus pesos anteriores. Deja 2–3 repeticiones en recámara (RPE 7–8). Si las agujetas de la semana 2 fueron fuertes, repite las cargas una semana más.",
    cardio:
      "1 sesión de 20 min de cardio suave en bici o cinta + 1 caminata larga el fin de semana.",
    days: [
      {
        title: "Día A (lunes)",
        focus: "Cuerpo completo — empuje dominante",
        exercises: [
          { name: "Sentadilla con barra", sets: "3–4", reps: "6–8", rpe: "7–8" },
          { name: "Press de banca", sets: "3–4", reps: "6–8", rpe: "7–8" },
          { name: "Remo con barra o en máquina", sets: "3", reps: "8–10", rpe: "7–8" },
          { name: "Press militar", sets: "3", reps: "8–10", rpe: "7" },
          { name: "Plancha con peso o ab wheel", sets: "3", reps: "30–40 s / 8–10", rpe: "—" },
        ],
      },
      {
        title: "Día B (miércoles)",
        focus: "Cuerpo completo — tracción dominante",
        exercises: [
          { name: "Peso muerto rumano con barra", sets: "3", reps: "6–8", rpe: "7–8" },
          { name: "Dominadas asistidas o jalón al pecho", sets: "3–4", reps: "8–10", rpe: "7–8" },
          { name: "Prensa de piernas", sets: "3", reps: "10–12", rpe: "7–8" },
          { name: "Press inclinado con mancuernas", sets: "3", reps: "8–10", rpe: "7" },
          { name: "Curl de bíceps + extensión de tríceps", sets: "3", reps: "10–12", rpe: "7" },
        ],
      },
      {
        title: "Día C (viernes)",
        focus: "Cuerpo completo — piernas y core",
        exercises: [
          { name: "Sentadilla búlgara con mancuernas", sets: "3", reps: "8–10 por pierna", rpe: "7–8" },
          { name: "Empuje de cadera (hip thrust)", sets: "3", reps: "8–10", rpe: "7–8" },
          { name: "Remo con mancuerna a una mano", sets: "3", reps: "8–10", rpe: "7–8" },
          { name: "Elevaciones laterales + pájaros", sets: "3", reps: "12–15", rpe: "7" },
          { name: "Gemelos + core en polea", sets: "3", reps: "12–15", rpe: "7" },
        ],
      },
    ],
  },
  {
    week: "Semana 4",
    label: "Consolidación",
    goal: "Volver a un ritmo normal de entrenamiento: 4 días con división torso / pierna.",
    intensity:
      "Trabaja al 75–85 % de tus pesos anteriores (RPE 8, deja 1–2 repeticiones en recámara). A partir de aquí, progresa añadiendo 2,5 kg o 1 repetición por semana en los básicos.",
    cardio:
      "Opcional: 1–2 sesiones de 15–20 min. La prioridad esta semana es la fuerza.",
    days: [
      {
        title: "Día 1 (lunes) — Torso",
        focus: "Empuje y tracción horizontales",
        exercises: [
          { name: "Press de banca", sets: "4", reps: "5–8", rpe: "8" },
          { name: "Remo con barra", sets: "4", reps: "6–10", rpe: "8" },
          { name: "Press militar", sets: "3", reps: "8–10", rpe: "7–8" },
          { name: "Jalón al pecho agarre neutro", sets: "3", reps: "10–12", rpe: "7–8" },
          { name: "Curl + tríceps en polea", sets: "2–3", reps: "10–12", rpe: "7" },
        ],
      },
      {
        title: "Día 2 (martes) — Pierna",
        focus: "Rodilla dominante",
        exercises: [
          { name: "Sentadilla con barra", sets: "4", reps: "5–8", rpe: "8" },
          { name: "Prensa de piernas", sets: "3", reps: "8–12", rpe: "7–8" },
          { name: "Curl femoral tumbado", sets: "3", reps: "10–12", rpe: "7–8" },
          { name: "Elevación de gemelos de pie", sets: "3", reps: "10–15", rpe: "7–8" },
          { name: "Plancha con peso", sets: "3", reps: "30–45 s", rpe: "—" },
        ],
      },
      {
        title: "Día 3 (jueves) — Torso",
        focus: "Empuje y tracción con énfasis vertical",
        exercises: [
          { name: "Press inclinado con mancuernas", sets: "4", reps: "6–10", rpe: "8" },
          { name: "Dominadas o jalón al pecho", sets: "4", reps: "6–10", rpe: "8" },
          { name: "Press de hombros con mancuernas", sets: "3", reps: "8–12", rpe: "7–8" },
          { name: "Remo en polea baja", sets: "3", reps: "10–12", rpe: "7–8" },
          { name: "Elevaciones laterales + face pull", sets: "3", reps: "12–15", rpe: "7" },
        ],
      },
      {
        title: "Día 4 (viernes) — Pierna",
        focus: "Cadera dominante",
        exercises: [
          { name: "Peso muerto rumano con barra", sets: "4", reps: "6–8", rpe: "8" },
          { name: "Empuje de cadera (hip thrust)", sets: "3", reps: "8–10", rpe: "8" },
          { name: "Sentadilla búlgara", sets: "3", reps: "8–10 por pierna", rpe: "7–8" },
          { name: "Extensión de cuádriceps", sets: "3", reps: "12–15", rpe: "7–8" },
          { name: "Gemelos sentado + core", sets: "3", reps: "12–15", rpe: "7" },
        ],
      },
    ],
  },
];

export const warmup = [
  "5 minutos de cardio muy suave (bici, cinta o remo) para subir la temperatura.",
  "Movilidad: 10 círculos de cadera, 10 de hombros, 10 sentadillas con el peso corporal, 10 bisagras de cadera sin peso.",
  "Series de aproximación: antes de cada ejercicio principal haz 1–2 series ligeras (40–60 % del peso de trabajo) de 5–8 repeticiones.",
];

export const trainingRules = [
  {
    title: "Las agujetas de la semana 1 son normales",
    body: "Después de 2 meses parado vas a tener agujetas aunque entrenes suave. Duran 2–4 días y bajan mucho a partir de la segunda semana. Entrenar suave con agujetas ayuda a que se pasen antes; entrenar fuerte con agujetas intensas, no.",
  },
  {
    title: "No persigas tus marcas anteriores",
    body: "La fuerza vuelve mucho más rápido de lo que se fue (memoria muscular). Si respetas la progresión, en 6–8 semanas deberías estar cerca de tus pesos previos sin lesionarte por el camino.",
  },
  {
    title: "Descansa entre series",
    body: "2–3 minutos en ejercicios básicos (sentadilla, press, peso muerto), 60–90 segundos en accesorios. El descanso corto no hace mejor el entrenamiento, solo peor la siguiente serie.",
  },
  {
    title: "Duerme 7–9 horas",
    body: "El sueño es la herramienta de recuperación más potente que tienes, muy por encima de cualquier suplemento. Si duermes mal, baja una serie a cada ejercicio ese día.",
  },
  {
    title: "Si un día fallas, no pasa nada",
    body: "Un día perdido no rompe el plan; abandonarlo sí. Retoma en el siguiente entrenamiento donde lo dejaste, sin intentar 'recuperar' haciendo el doble.",
  },
];

export const nutritionPrinciples = [
  {
    title: "Proteína en cada comida",
    body: "Apunta a 1,6–2,2 g por kilo de peso corporal al día, repartida en 3–4 comidas. Fuentes: pollo, pescado, huevos, carne magra, lácteos, legumbres, tofu. Es el macro más importante para recuperar músculo tras la pausa.",
  },
  {
    title: "El plato base",
    body: "En cada comida principal: la mitad del plato de verduras u hortalizas, un cuarto de proteína, un cuarto de carbohidrato (arroz, patata, pasta, legumbre, pan integral) y una fuente de grasa de calidad (aceite de oliva, aguacate, frutos secos).",
  },
  {
    title: "Carbohidratos alrededor del entrenamiento",
    body: "No temas a los carbohidratos: son tu combustible. Concentra una buena ración en la comida previa (1–3 h antes) y en la posterior al entrenamiento para rendir y recuperar mejor.",
  },
  {
    title: "Hidratación",
    body: "Entre 30 y 40 ml por kilo de peso al día (para 75 kg, unos 2,5–3 litros). Añade un vaso extra por cada 20–30 min de entrenamiento. La orina clara es la mejor señal.",
  },
  {
    title: "La regla del 80/20",
    body: "El 80 % de tu alimentación debe venir de comida sin procesar. El 20 % restante es flexible: una dieta que no puedes sostener no sirve, por perfecta que sea sobre el papel.",
  },
  {
    title: "Alcohol y ultraprocesados",
    body: "No hace falta eliminarlos, pero cada bebida y cada snack ultraprocesado desplaza calorías que no sacian y frena la recuperación. En estas primeras 4 semanas, cuanto menos, mejor.",
  },
];

export type Meal = { name: string; content: string };
export type DayMenu = { label: string; kcal: string; meals: Meal[] };

export const sampleMenus: DayMenu[] = [
  {
    label: "Día de entrenamiento (~2.400 kcal)",
    kcal: "≈ 2.400 kcal · 180 g proteína",
    meals: [
      { name: "Desayuno", content: "3 huevos revueltos + 2 rebanadas de pan integral + 1 fruta + café o té." },
      { name: "Comida (pre-entreno)", content: "150 g de arroz (cocido en seco 75 g) + 150 g de pechuga de pollo + ensalada con aceite de oliva." },
      { name: "Post-entreno", content: "Batido: 30 g de proteína en polvo (o 250 g de yogur griego) + 1 plátano." },
      { name: "Cena", content: "200 g de salmón o pescado blanco + 250 g de patata asada + verduras salteadas." },
      { name: "Snack opcional", content: "Yogur natural con un puñado de nueces." },
    ],
  },
  {
    label: "Día de descanso (~2.100 kcal)",
    kcal: "≈ 2.100 kcal · 170 g proteína",
    meals: [
      { name: "Desayuno", content: "Yogur griego (250 g) con avena (40 g), fruta y canela." },
      { name: "Comida", content: "Lentejas estofadas con verduras (plato grande) + 100 g de pollo o 2 huevos duros." },
      { name: "Merienda", content: "Tostada integral con atún o hummus + 1 fruta." },
      { name: "Cena", content: "Tortilla de 3 huevos con espinacas y queso fresco + ensalada de tomate con aceite de oliva." },
    ],
  },
];

export const supplements = [
  { name: "Creatina monohidrato", detail: "3–5 g diarios, cualquier hora. Es el suplemento con más evidencia para fuerza y masa muscular. Útil desde el día 1." },
  { name: "Proteína en polvo", detail: "No es imprescindible: es comida en polvo. Úsala solo si te cuesta llegar a tu objetivo de proteína con alimentos." },
  { name: "Cafeína", detail: "1–3 mg/kg unos 45 min antes de entrenar si necesitas un empujón. Evítala a partir de media tarde para no afectar el sueño." },
  { name: "Todo lo demás", detail: "BCAA, quemagrasas, boosters… ahórratelo. Ninguno mueve la aguja comparado con dormir, comer suficiente proteína y entrenar con constancia." },
];
