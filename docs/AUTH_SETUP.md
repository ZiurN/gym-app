# Auth setup (app-sign-in)

La app ya incluye Auth.js + Drizzle + esquema Postgres. Falta **tu** base de datos y las claves OAuth/email.

## 1. Postgres (Neon recomendado)

1. Crea un proyecto en [Neon](https://neon.tech) (o Supabase).
2. Copia la connection string.
3. En la raíz del repo:

```bash
cp .env.example .env.local
```

Pega la URL en `DATABASE_URL`.

4. Aplica el esquema (elige **una** opción):

**Opción A — más simple (recomendada):**

```bash
npm run db:push
```

**Opción B — migraciones versionadas** (el SQL ya está en `drizzle/0000_auth-init.sql`):

```bash
npm run db:migrate
```

Solo necesitas `db:generate` si cambias el schema en el futuro.

## 2. AUTH_SECRET

```bash
openssl rand -base64 32
```

Pon el valor en `AUTH_SECRET` dentro de `.env.local`.

## 3. Google OAuth

1. [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials → Create OAuth client ID (Web).
2. Authorized redirect URIs:
   - `http://localhost:3000/api/auth/callback/google`
   - `https://TU-DOMINIO.vercel.app/api/auth/callback/google`
3. Copia client id → `AUTH_GOOGLE_ID` y secret → `AUTH_GOOGLE_SECRET`.

## 4. Resend (magic link)

1. Cuenta en [Resend](https://resend.com).
2. API key → `AUTH_RESEND_KEY`.
3. En desarrollo puedes usar `EMAIL_FROM="Mi Regreso al Gym <onboarding@resend.dev>"` (solo envía a tu propio correo de Resend). En producción verifica un dominio.

## 5. Arrancar

```bash
npm run dev
```

- Guía pública: `/`
- Login: `/login`
- Cuenta (protegida): `/cuenta`

## 6. Vercel (necesario para iPhone)

El login con Google en el celular requiere una URL **HTTPS** (localhost no alcanza desde el iPhone).

### 6.1 Subir el código

Asegúrate de que el auth esté en el remoto que uses con Vercel (GitHub `ZiurN/gym-app` o el que conectes):

```bash
git add -A   # no incluyas .env.local
git status   # confirma que .env.local NO aparece
git commit -m "Add Auth.js sign-in with Google and Postgres"
git push github main   # o el remote que uses
```

### 6.2 Crear el proyecto en Vercel

1. Entra en [vercel.com](https://vercel.com) e importa el repo.
2. Framework: Next.js (lo detecta solo).
3. **Environment Variables** (las mismas que en `.env.local`, sin subir el archivo):

| Variable | Valor |
|---|---|
| `DATABASE_URL` | tu Postgres (Neon) |
| `AUTH_SECRET` | el mismo que en local |
| `AUTH_URL` | `https://TU-PROYECTO.vercel.app` (la URL que te dé Vercel; puedes ponerla tras el primer deploy) |
| `AUTH_GOOGLE_ID` | Client ID de Google |
| `AUTH_GOOGLE_SECRET` | Client Secret de Google |
| `AUTH_RESEND_KEY` | opcional por ahora |
| `EMAIL_FROM` | opcional por ahora |

4. Deploy.

### 6.3 Google OAuth — URI de producción

En Google Cloud → Credentials → tu OAuth client, añade:

**Authorized JavaScript origins**
```
https://TU-PROYECTO.vercel.app
```

**Authorized redirect URIs**
```
https://TU-PROYECTO.vercel.app/api/auth/callback/google
```

(Deja también las de `localhost:3000` para seguir desarrollando en local.)

Si cambiaste `AUTH_URL` después del primer deploy, **redeploy** en Vercel.

### 6.4 Probar en el iPhone

1. Abre Safari → `https://TU-PROYECTO.vercel.app`
2. Compartir → **Añadir a pantalla de inicio** (PWA)
3. Entra en **Entrar** → Google
4. Deberías llegar a `/cuenta`

Si falla con `redirect_uri_mismatch`, la URI en Google no coincide exactamente con la URL de Vercel.
