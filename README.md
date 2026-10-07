# Gym Tracker

A workout tracker: build your own routines from an exercise catalog, log every
set while you train, and see your progress per exercise. It is a tracking tool
and gives no training, health or nutrition advice.

"Gym Tracker" is a working name, defined once in `lib/app.ts`.

## What it does

- **Routines:** any number of days, exercises picked from the catalog, targets
  per exercise, supersets and an optional alternative exercise. One routine is
  active at a time.
- **Live workouts:** start a day of the active routine, log sets, and a rest
  timer runs between them. Only finished workouts are saved.
- **Progress:** a chart and history per exercise.
- **Exercise information:** muscles, equipment and how each of the 1,324
  catalog exercises is performed.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS v4 · shadcn/ui · Postgres
(Neon) with Drizzle · Auth.js (Google and email link)

## Run it locally

1. Copy `.env.example` to `.env.local` and fill it in. `docs/AUTH_SETUP.md`
   explains the sign-in variables.
2. Install, create the tables, load the exercise catalog and start:

```bash
npm install
npm run db:migrate
npm run db:seed-catalog
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Commands

| Command | What it does |
|---|---|
| `npm run dev` | Development server |
| `npm test` | Tests (they run against an in-process Postgres; no database needed) |
| `npm run lint` | Lint |
| `npm run build` | Production build |
| `npm run db:migrate` | Apply database migrations |
| `npm run db:seed-catalog` | Load or update the exercise catalog |
| `npm run db:seed-workouts` | Dev only: a sample routine and finished workouts for the first user |
| `npm run db:reset-workouts` | Dev only: delete logged workouts |

## Exercise catalog and third-party data

The catalog, its sources and how to regenerate it are described in
[`docs/CATALOG.md`](docs/CATALOG.md). Licences of the imported data are in
[`THIRD_PARTY_NOTICES.md`](THIRD_PARTY_NOTICES.md).

## Install it on a phone

The app is an installable web app. Deploy it somewhere with HTTPS (for example
Vercel), open the address on the phone, and use the browser's "Add to Home
Screen".
