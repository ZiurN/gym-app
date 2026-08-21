# Mi Regreso al Gym

Aplicación web con un plan completo para retomar el entrenamiento después de ~2 meses de pausa, con enfoque de nutricionista y entrenador personal:

- **Calculadora de calorías y macros** — gasto energético con la fórmula Mifflin-St Jeor, ajustado a tu actividad y objetivo (perder grasa, recomposición o ganar músculo), con reparto de proteína, grasas y carbohidratos.
- **Plan de entrenamiento de 4 días (torso/pierna)** — rutina fija de gimnasio con progresión semanal de carga, series y RPE durante 4 semanas de reincorporación, más calentamiento, día 5 opcional y reglas de recuperación.
- **Guía de nutrición con batch cooking** — dos sesiones de cocina a la semana que cubren todas las comidas, menús de tuppers para día de entrenamiento y descanso (sin pescado ni marisco), hidratación y qué suplementos merecen la pena.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui

## Cómo ejecutarlo

```bash
npm install
npm run dev -- --port 4780
```

Abre [http://localhost:4780](http://localhost:4780).

## Cómo tenerla en el celular

La app es una PWA instalable. Los pasos:

1. **Publícala gratis en Vercel** (recomendado para Next.js):
   - Sube este repositorio a GitHub (o conéctalo desde tu cuenta).
   - Entra en [vercel.com](https://vercel.com), crea una cuenta gratuita e importa el repositorio. Vercel detecta Next.js y despliega solo; obtienes una URL tipo `mi-regreso-al-gym.vercel.app`.
   - Alternativa sin GitHub: desde la carpeta del proyecto ejecuta `npx vercel` y sigue los pasos.
2. **Abre la URL en el celular e instálala**:
   - **Android (Chrome):** menú ⋮ → "Añadir a pantalla de inicio" o "Instalar aplicación".
   - **iPhone (Safari):** botón Compartir → "Añadir a pantalla de inicio".

Queda con su propio icono y se abre a pantalla completa, como una app nativa.

Para probar rápido en el celular sin publicar: ejecuta `npm run dev -- --port 4780 --hostname 0.0.0.0` en tu computadora y abre `http://IP-DE-TU-PC:4780` desde el celular conectado al mismo WiFi.

## Nota

El contenido es orientativo y no sustituye la valoración de un profesional sanitario.
