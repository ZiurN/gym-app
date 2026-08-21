export type Exercise = {
  name: string;
  sets: string;
  reps: string;
  rest: string;
  note?: string;
};

export type TrainingDay = {
  title: string;
  focus: string;
  exercises: Exercise[];
};

// Rutina torso/pierna de 4 días para alguien con 2 años de experiencia que
// vuelve tras ~2 meses de pausa. La estructura no cambia entre semanas: lo que
// progresa es la carga, las series y el RPE (ver progresión semanal).
export const trainingSplit: TrainingDay[] = [
  {
    title: "Día 1 (lunes) — Torso A",
    focus: "Empuje y tracción horizontales, énfasis en fuerza",
    exercises: [
      { name: "Press de banca con barra", sets: "4", reps: "5–8", rest: "2–3 min" },
      { name: "Remo con barra", sets: "4", reps: "6–10", rest: "2–3 min", note: "Torso fijo; si la lumbar protesta, remo en máquina o con apoyo al pecho." },
      { name: "Press militar de pie o sentado", sets: "3", reps: "8–10", rest: "2 min" },
      { name: "Jalón al pecho agarre neutro", sets: "3", reps: "10–12", rest: "90 s" },
      { name: "Curl de bíceps con barra + tríceps en polea", sets: "3 + 3", reps: "10–12", rest: "60–90 s" },
    ],
  },
  {
    title: "Día 2 (martes) — Pierna A",
    focus: "Rodilla dominante",
    exercises: [
      { name: "Sentadilla con barra", sets: "4", reps: "5–8", rest: "2–3 min", note: "La primera semana baja más el peso aquí que en ningún otro sitio: las agujetas de sentadilla son las peores." },
      { name: "Prensa de piernas", sets: "3", reps: "8–12", rest: "2 min" },
      { name: "Curl femoral tumbado o sentado", sets: "3", reps: "10–12", rest: "90 s" },
      { name: "Elevación de gemelos de pie", sets: "4", reps: "10–15", rest: "60–90 s" },
      { name: "Plancha con peso", sets: "3", reps: "30–45 s", rest: "60 s" },
    ],
  },
  {
    title: "Día 3 (jueves) — Torso B",
    focus: "Empuje y tracción con énfasis vertical, hipertrofia",
    exercises: [
      { name: "Press inclinado con mancuernas", sets: "4", reps: "6–10", rest: "2–3 min" },
      { name: "Dominadas (lastradas cuando toque) o jalón", sets: "4", reps: "6–10", rest: "2–3 min" },
      { name: "Press de hombros con mancuernas", sets: "3", reps: "8–12", rest: "2 min" },
      { name: "Remo en polea baja", sets: "3", reps: "10–12", rest: "90 s" },
      { name: "Elevaciones laterales + face pull", sets: "3 + 3", reps: "12–15", rest: "60 s", note: "El face pull es tu seguro de hombros: no lo saltes." },
    ],
  },
  {
    title: "Día 4 (viernes) — Pierna B",
    focus: "Cadera dominante",
    exercises: [
      { name: "Peso muerto rumano con barra", sets: "4", reps: "6–8", rest: "2–3 min" },
      { name: "Empuje de cadera (hip thrust)", sets: "3", reps: "8–10", rest: "2 min" },
      { name: "Sentadilla búlgara con mancuernas", sets: "3", reps: "8–10 por pierna", rest: "90 s entre piernas" },
      { name: "Extensión de cuádriceps", sets: "3", reps: "12–15", rest: "60–90 s" },
      { name: "Gemelos sentado + crunch en polea", sets: "3 + 3", reps: "12–15", rest: "60 s" },
    ],
  },
];

export type ProgressionWeek = {
  week: string;
  label: string;
  series: string;
  load: string;
  rpe: string;
  cardio: string;
  note: string;
};

export const progression: ProgressionWeek[] = [
  {
    week: "Semana 1",
    label: "Readaptación",
    series: "2 series por ejercicio (la mitad del objetivo)",
    load: "50–60 % de tus pesos de hace 2 meses",
    rpe: "6–7 · deja 3–4 reps en recámara",
    cardio: "1–2 caminatas de 30 min en días libres",
    note: "Sesiones cortas (~45 min). Va a parecer ridículamente fácil: ese es exactamente el objetivo. Las agujetas llegarán igual.",
  },
  {
    week: "Semana 2",
    label: "Readaptación II",
    series: "3 series por ejercicio",
    load: "60–70 % de tus pesos previos",
    rpe: "7 · deja 3 reps en recámara",
    cardio: "1 sesión de 20 min de cardio suave + 1 caminata",
    note: "Las agujetas ya deberían ser leves. Si algún ejercicio sigue castigándote, repite en él la carga de la semana 1.",
  },
  {
    week: "Semana 3",
    label: "Construcción",
    series: "Series completas en básicos (4), 3 en accesorios",
    load: "70–80 % de tus pesos previos",
    rpe: "7–8 · deja 2–3 reps en recámara",
    cardio: "1 sesión de 20–30 min en zona 2 (opcional)",
    note: "Aquí ya entrenas 'de verdad', pero todavía sin acercarte al fallo. La técnica debería sentirse como antes de la pausa.",
  },
  {
    week: "Semana 4",
    label: "Consolidación",
    series: "Todas las series objetivo de la tabla",
    load: "75–85 % de tus pesos previos",
    rpe: "8 · deja 1–2 reps en recámara",
    cardio: "Opcional, según recuperación",
    note: "Desde aquí, progresión normal: +2,5 kg o +1 repetición por semana en los básicos. En 4–6 semanas más deberías rondar tus marcas previas.",
  },
];

export const optionalFifthDay = {
  title: "¿Quieres un 5.º día?",
  body: "A partir de la semana 3, si el cuerpo pide más, añade un sábado opcional: 30–40 min de cardio en zona 2 (ritmo de conversación) más 3–4 ejercicios de puntos débiles a tu elección (brazos, hombros, gemelos) a 3 series de 12–15. No añadas más sentadilla o peso muerto: la recuperación de esos la marca el plan de 4 días.",
};

export const warmup = [
  "5 minutos de cardio muy suave (bici, cinta o remo) para subir la temperatura.",
  "Movilidad: 10 círculos de cadera, 10 de hombros, 10 sentadillas con el peso corporal, 10 bisagras de cadera sin peso.",
  "Series de aproximación: antes de cada ejercicio principal haz 1–2 series ligeras (40–60 % del peso de trabajo) de 5–8 repeticiones.",
];

export const trainingRules = [
  {
    title: "Las agujetas de la semana 1 son inevitables",
    body: "Aunque lleves 2 años entrenando, tras 2 meses de pausa las agujetas van a llegar igual: la tolerancia al daño muscular se pierde rápido. Duran 2–4 días y desaparecen casi del todo a partir de la segunda semana. Por eso la semana 1 es a 2 series: el freno no es la fuerza, es la recuperación.",
  },
  {
    title: "Tu fuerza vuelve rápido; tus tendones, no",
    body: "La memoria muscular te devolverá los pesos en semanas, pero tendones y articulaciones se readaptan más lento. Ese desfase es la causa típica de lesión al volver: el músculo puede, el tendón todavía no. Respeta los porcentajes aunque te sientas capaz de más.",
  },
  {
    title: "Descansa entre series",
    body: "2–3 minutos en los básicos (sentadilla, press, peso muerto, remo con barra), 60–90 segundos en accesorios. El descanso corto no hace mejor el entrenamiento, solo peor la siguiente serie.",
  },
  {
    title: "Duerme 7–9 horas",
    body: "El sueño es la herramienta de recuperación más potente que tienes, muy por encima de cualquier suplemento. Si un día duermes mal, quita una serie a cada ejercicio y listo.",
  },
  {
    title: "Si un día fallas, no pasa nada",
    body: "Un día perdido no rompe el plan; abandonarlo sí. Si solo puedes ir 3 veces una semana, haz Torso A, Pierna A y Torso B, y empieza la semana siguiente por Pierna B.",
  },
];

export const nutritionPrinciples = [
  {
    title: "Proteína en cada comida",
    body: "Apunta a 1,8–2,2 g por kilo al día repartida en 3–4 comidas (~35–40 g por comida). Tus fuentes base sin cocina diaria: pollo asado en tandas, carne picada, huevos duros, yogur griego, queso fresco y atún en lata si el pescado sí te va (marisco, fuera).",
  },
  {
    title: "El tupper base",
    body: "Cada tupper de comida principal: un cuarto de proteína, un cuarto de carbohidrato (arroz, patata, legumbre de bote), la mitad de verdura, y un chorro de aceite de oliva al servir. Si todos tus tuppers siguen esta plantilla, los macros salen solos sin pesar comida a diario.",
  },
  {
    title: "Carbohidratos alrededor del entrenamiento",
    body: "No temas a los carbohidratos: son tu combustible. Concentra una buena ración en la comida previa (1–3 h antes) y en la posterior al entrenamiento para rendir y recuperar mejor.",
  },
  {
    title: "Hidratación",
    body: "Unos 2,7 litros al día para tu peso (35 ml/kg), más un vaso extra por cada 20–30 min de entrenamiento. La orina clara es la mejor señal.",
  },
  {
    title: "La regla del 80/20",
    body: "El 80 % de tu alimentación debe venir de comida sin procesar. El 20 % restante es flexible: una dieta que no puedes sostener no sirve, por perfecta que sea sobre el papel. El batch cooking existe precisamente para que la opción fácil sea la buena.",
  },
  {
    title: "Congelador y despensa, tus aliados",
    body: "Verdura congelada (salteados, brócoli), arroz de microondas, legumbre de bote, huevo líquido pasteurizado y fruta que no requiere nada (plátano, manzana). Nada de esto es 'peor' que lo fresco de forma relevante, y elimina el 90 % de las excusas.",
  },
];

export type PrepItem = { name: string; detail: string };
export type PrepSession = {
  day: string;
  duration: string;
  items: PrepItem[];
};

export const mealPrepSessions: PrepSession[] = [
  {
    day: "Sesión 1 — Domingo",
    duration: "60–75 min (casi todo es horno trabajando solo)",
    items: [
      { name: "Pollo al horno (1,2–1,5 kg)", detail: "Muslos deshuesados o pechuga con especias, 25–30 min a 200 °C. Salen 5–6 raciones de ~200 g." },
      { name: "Bandeja de verduras asadas", detail: "Pimiento, cebolla, calabacín y brócoli con aceite y sal, al horno junto al pollo. 4–5 raciones." },
      { name: "Arroz en olla (400–500 g en seco)", detail: "Se hace mientras el horno trabaja. Repartido en tuppers: 5–6 raciones de ~150–180 g cocido." },
      { name: "Carne picada magra (800 g) con tomate", detail: "Una sartén, 15 min. 3–4 raciones para variar del pollo." },
      { name: "8–10 huevos duros", detail: "12 min y a la nevera. Son tu snack de proteína de la semana." },
    ],
  },
  {
    day: "Sesión 2 — Miércoles",
    duration: "30–45 min (rellenar lo que se acabó)",
    items: [
      { name: "Segunda tanda de proteína", detail: "Más pollo al horno o filetes de ternera a la plancha. 3–4 raciones para llegar al domingo." },
      { name: "Patatas al microondas u horno", detail: "4–5 patatas medianas pinchadas, 8–10 min al microondas. Cambian el arroz de la segunda mitad de semana." },
      { name: "Reponer verdura fácil", detail: "Bolsas de ensalada, tomate cherry y una bolsa de verdura congelada para saltear en 5 min." },
    ],
  },
];

export type Meal = { name: string; content: string };
export type DayMenu = { label: string; kcal: string; meals: Meal[] };

// Menús montados solo con lo que sale de las dos sesiones de batch cooking
// (más desayuno y snacks sin cocina). Sin pescado ni marisco.
export const sampleMenus: DayMenu[] = [
  {
    label: "Día de entrenamiento",
    kcal: "≈ 2.600 kcal · ~150 g proteína",
    meals: [
      { name: "Desayuno (0 min de cocina)", content: "Yogur griego (250 g) + avena (50 g) + 1 plátano + puñado de nueces. Se puede montar la noche anterior." },
      { name: "Comida — tupper 1 (pre-entreno)", content: "Arroz (180 g cocido) + pollo asado (200 g) + verduras asadas + chorro de aceite de oliva." },
      { name: "Post-entreno", content: "Batido de proteína (30 g) + 1 fruta. Si no usas batido: 2 huevos duros + yogur." },
      { name: "Cena — tupper 2", content: "Carne picada con tomate (ración) + patata (250 g) + ensalada de bolsa." },
      { name: "Snack opcional", content: "Queso fresco o yogur con fruta." },
    ],
  },
  {
    label: "Día de descanso",
    kcal: "≈ 2.300 kcal · ~145 g proteína",
    meals: [
      { name: "Desayuno (0 min de cocina)", content: "Yogur griego (250 g) + avena (40 g) + fruta + canela." },
      { name: "Comida — tupper", content: "Pollo o ternera (200 g) + garbanzos o lentejas de bote (150 g) + verduras asadas + aceite de oliva." },
      { name: "Merienda", content: "2 huevos duros + 1 fruta, o tostada integral con atún si el pescado en lata te va." },
      { name: "Cena — tupper ligero", content: "Carne picada con tomate + verdura salteada congelada (5 min) + queso fresco de postre." },
    ],
  },
];

export const supplements = [
  { name: "Creatina monohidrato", detail: "3–5 g diarios, cualquier hora. Es el suplemento con más evidencia para fuerza y masa muscular. Útil desde el día 1." },
  { name: "Proteína en polvo", detail: "Para tu caso (poca cocina) sí es práctica: un batido resuelve el post-entreno sin tupper. Sigue siendo comida en polvo, no magia." },
  { name: "Cafeína", detail: "1–3 mg/kg unos 45 min antes de entrenar si necesitas un empujón. Evítala a partir de media tarde para no afectar el sueño." },
  { name: "Todo lo demás", detail: "BCAA, quemagrasas, boosters… ahórratelo. Ninguno mueve la aguja comparado con dormir, comer suficiente proteína y entrenar con constancia." },
];
