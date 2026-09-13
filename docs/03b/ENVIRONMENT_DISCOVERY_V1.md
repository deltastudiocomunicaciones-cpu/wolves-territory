# 03B Commercial Platform — Environment Discovery V1

Date: 2026-09-13
Branch: `feature/03b-commercial-platform-core`
Status: **DEPLOYMENT ENVIRONMENT IDENTITY NOT YET RESOLVED**

## Objective

Identify the exact Supabase project used by the live Wolves Territory application
without guessing from project names or applying any 03B migration to an unrelated
database.

## Repository findings

### Supabase identity is environment-driven

`lib/supabase-server.ts` obtains the database endpoint from:

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

`lib/supabase-browser.ts` obtains the browser client configuration from:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

The repository therefore does not itself establish the production Supabase
project reference. The deployment environment does.

### Deployment metadata is intentionally absent from Git

`.gitignore` excludes both:

- `.env*`
- `.vercel`

Therefore neither Vercel environment values nor the local `.vercel/project.json`
linkage can be recovered from this Git repository by design.

No committed `.env.example`, `vercel.json`, or `.vercel/project.json` was found in
the feature branch during this discovery pass.

### Live application dependency is real

The current checkout path uses `getSupabaseAdmin()` to query the existing
`partners` table, proving that the deployed application depends on a configured
Supabase environment for commercial/referral behavior. The checkout route only
logs whether the URL/service-role values are configured; it does not expose the
actual endpoint.

## Connected Supabase discovery

The currently connected Supabase account exposes projects named:

- `lobosfc-donations`
- `wolves-os`

`wolves-os` is explicitly excluded from the 03B source of truth and must not be
used for schema inference or migration execution.

No connected project can currently be proven to be the database behind the live
Wolves Territory deployment.

## Required authoritative source

The next authoritative discovery source must be the Vercel project actually
serving Wolves Territory. We need to read **metadata, not secrets**:

1. identify the Vercel project connected to the `wolves-territory` repository / live domain;
2. inspect the configured value of `NEXT_PUBLIC_SUPABASE_URL` (or safely extract only its Supabase project ref);
3. match that project ref to the correct Supabase project/account;
4. never copy or expose `SUPABASE_SERVICE_ROLE_KEY` in documentation, chat, logs or commits;
5. once matched, capture the existing production schema/migration state read-only before planning any sandbox.

## Expected Supabase project-ref derivation

For a standard Supabase URL of the form:

`https://<project-ref>.supabase.co`

only `<project-ref>` is required for environment identification. The service-role
secret is not required for this discovery step and should remain secret.

## Safety rules

- Do not infer that a project named `wolves-os` is correct because of its name.
- Do not apply 03B migrations while the project identity is unresolved.
- Do not expose service-role keys to browser code, documentation or audit payloads.
- Do not create a replacement production database simply to unblock discovery.
- Prefer read-only environment/schema inspection first.

## Current result

**Repository inspection:** COMPLETE

**Vercel project/environment inspection:** PENDING CONNECTION

**Production Supabase project:** UNRESOLVED

**Runtime migration execution:** BLOCKED

Once Vercel is connected, continue with:

`VERCEL PROJECT -> NEXT_PUBLIC_SUPABASE_URL -> PROJECT REF -> SUPABASE MATCH -> READ-ONLY SCHEMA RECONCILIATION`
