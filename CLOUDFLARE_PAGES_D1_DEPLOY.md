# Deploy Catalyst to Cloudflare Pages + D1

This guide deploys your Next.js app to Cloudflare Pages and uses Cloudflare D1 as the backend database.

## 1) Prerequisites

- Cloudflare account
- Node.js 18+
- Wrangler CLI

```powershell
npm install -g wrangler
wrangler login
```

## 2) Create a D1 database

```powershell
wrangler d1 create catalyst-db
```

Copy these values from the output:

- `database_name` (for CLI use)
- `database_id` (for app env var)

## 3) Initialize D1 schema

Run this from the repository root:

```powershell
wrangler d1 execute catalyst-db --remote --file=./cloudflare-d1-schema.sql
```

If your D1 database name is different, replace `catalyst-db`.

## 4) Create API token for D1

In Cloudflare Dashboard:

1. Go to My Profile -> API Tokens -> Create Token.
2. Use a token that can query D1 for your account (minimum required scope).
3. Save the token value.

## 5) Create Cloudflare Pages project

1. Go to Workers & Pages -> Create application -> Pages -> Connect to Git.
2. Select this repository.
3. Build settings:
- Framework preset: `Next.js`
- Build command: `npm run cf:build`
- Build output directory: `.vercel/output/static`

## 6) Add required environment variables in Pages

In Pages project settings -> Environment variables, add:

- `DB_PROVIDER=d1`
- `CF_ACCOUNT_ID=<your_cloudflare_account_id>`
- `CF_D1_DATABASE_ID=<database_id_from_step_2>`
- `CF_API_TOKEN=<api_token_from_step_4>`
- `NEXTAUTH_SECRET=<long_random_secret>`
- `NEXTAUTH_URL=https://<your-pages-domain>`

Optional (if your app relies on these):

- `JWT_SECRET`
- Genkit/AI keys used by your flows

## 7) Deploy

Push your changes to the connected branch (or trigger a manual deploy in Pages).

Cloudflare will run:

```powershell
npm install
npm run cf:build
```

## 8) Validate after deploy

Check these endpoints on your Pages domain:

- `/api/health/db-check`
- `/api/data/courses`
- `/api/data/students`

If DB health fails, verify `DB_PROVIDER`, `CF_ACCOUNT_ID`, `CF_D1_DATABASE_ID`, and `CF_API_TOKEN`.

## Notes

- The backend now supports two DB providers:
- `DB_PROVIDER=neon` (existing behavior)
- `DB_PROVIDER=d1` (Cloudflare D1 via API)
- Existing SQL migration files in this repo are PostgreSQL-focused. For D1, use `cloudflare-d1-schema.sql`.
- Some API routes in this project still use local JSON file fallback paths. On Cloudflare runtime, filesystem-backed write paths are not persistent. Prefer DB-backed routes for production.
