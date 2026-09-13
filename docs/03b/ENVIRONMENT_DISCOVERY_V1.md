# 03B Commercial Platform — Environment Discovery V1

Date: 2026-09-13
Branch: `feature/03b-commercial-platform-core`
Status: **VERCEL PROJECT IDENTIFIED / ENVIRONMENT METADATA ACCESS BLOCKED**

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

## Vercel deployment identity — confirmed from GitHub deployment status

GitHub commit status for production commit
`7c889a6f1764f32f88e9b3a6bb8282bb8b511ce2` reports a successful Vercel target:

- Vercel scope/team slug: `delta-0f124680`
- Vercel project slug: `wolves-territory`
- Deployment dashboard target belongs to that exact scope/project.

This is authoritative deployment metadata from the repository integration and
removes the previous uncertainty about which Vercel project serves the app.

## Vercel connector inspection result

The connected Vercel connector was then queried with the confirmed scope/project:

- `get_project(wolves-territory, delta-0f124680)` -> `403 Forbidden`
- production runtime log query for the same scope/project -> `403 Forbidden`
- team discovery returned no accessible teams in the connector session.

Therefore the connector is installed, but its current authorization does not
permit reading project/environment metadata for this Vercel scope.

This is an **access-control blocker**, not evidence that the project does not
exist. GitHub deployment status already proves the Vercel project identity.

## Connected Supabase discovery

The currently connected Supabase account exposes projects named:

- `lobosfc-donations`
- `wolves-os`

`wolves-os` is explicitly excluded from the 03B source of truth and must not be
used for schema inference or migration execution.

No connected project can currently be proven to be the database behind the live
Wolves Territory deployment.

## Remaining authoritative discovery step

We now know the exact Vercel project. The remaining environment-identification
step is to read **metadata, not secrets**, from that project:

1. obtain `NEXT_PUBLIC_SUPABASE_URL` from the Vercel `wolves-territory` project;
2. extract only its Supabase project ref;
3. match that ref to the correct Supabase project/account;
4. never copy or expose `SUPABASE_SERVICE_ROLE_KEY` in documentation, chat, logs or commits;
5. once matched, capture the existing production schema/migration state read-only before planning any sandbox.

## Expected Supabase project-ref derivation

For a standard Supabase URL of the form:

`https://<project-ref>.supabase.co`

only `<project-ref>` is required for environment identification. The service-role
secret is not required for this discovery step and should remain secret.

## Safety rules

- Do not infer that a project named `wolves-os` is correct because of its name.
- Do not apply 03B migrations while the Supabase project identity is unresolved.
- Do not expose service-role keys to browser code, documentation or audit payloads.
- Do not create a replacement production database simply to unblock discovery.
- Prefer read-only environment/schema inspection first.
- Do not weaken Vercel permissions merely for convenience; authorize only the
  intended Wolves Territory scope when reconnecting/re-authorizing the connector.

## Current result

**Repository inspection:** COMPLETE

**Vercel project identity:** CONFIRMED — `delta-0f124680 / wolves-territory`

**Vercel project/environment metadata read:** BLOCKED BY 403 PERMISSION

**Production Supabase project:** UNRESOLVED

**Runtime migration execution:** BLOCKED

Continue only when the Vercel connector/session can read the confirmed project,
or when the same authoritative `NEXT_PUBLIC_SUPABASE_URL` project ref is obtained
through another secure deployment-admin channel.

Next chain:

`VERCEL wolves-territory -> NEXT_PUBLIC_SUPABASE_URL -> PROJECT REF -> SUPABASE MATCH -> READ-ONLY SCHEMA RECONCILIATION`
