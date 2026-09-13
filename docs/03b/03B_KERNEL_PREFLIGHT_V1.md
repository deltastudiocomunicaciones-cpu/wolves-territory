# 03B Commercial Platform — Kernel Preflight V1

Date: 2026-09-13
Branch: `feature/03b-commercial-platform-core`
Status: **STATIC PREFLIGHT IN PROGRESS / RUNTIME BLOCKED**

## Executive result

The kernel is structurally coherent enough to continue hardening, but it is not
ready for production migration or runtime certification yet.

Primary blockers are intentional and healthy:

1. the real Supabase project used by `wolves-territory` has not been identified
   through the connected Supabase environment;
2. business configuration required to activate WT-SQ-1.0 is still pending;
3. the 03B-013 file is currently an adversarial test contract, not yet a fully
   executable pgTAP/CI harness against an isolated database.

No 03B migration has been applied to `wolves-os` or to an identified production
Wolves Territory database during this preflight.

## Findings discovered and corrected

### PF-01 — Duplicate Supabase migration version

**Finding:** 03B-010 and 03B-011 originally shared timestamp
`20260913224000`. Supabase migration versions must be unique.

**Correction:** 03B-011 moved to
`20260913224500_03b_011_rls_storage_policies.sql`.

**Status:** FIXED.

### PF-02 — SECURITY DEFINER functions inherited PUBLIC EXECUTE

**Finding:** PostgreSQL functions are executable by PUBLIC by default unless
privileges are revoked. Internal 03B SECURITY DEFINER helpers included audit,
permission and readiness functions that must never become general client RPCs.

**Risk examples:**

- direct use of `write_audit_event(...)` could undermine trusted audit semantics;
- arbitrary-user permission helper calls could disclose authority;
- internal validation/readiness helpers could bypass intended RLS read surfaces.

**Correction:** `03B-011A` revokes PUBLIC/anon/authenticated access to internal
helpers and grants authenticated EXECUTE only to intended business commands.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-03 — Raw role-permission matrices visible to every authenticated account

**Finding:** the first RLS draft allowed every authenticated account to read
`platform_role_permissions` and `store_role_permissions`.

**Correction:** `03B-011B` replaces those policies with platform-authorized
access (`platform_role.read` or `audit.read`). Effective Store capabilities are
resolved by trusted helpers rather than publication of the raw matrix.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-04 — RLS helper search_path consistency

**Finding:** 03B-011 SECURITY DEFINER helpers used `public, pg_temp` while the
command layer used `pg_catalog, public`.

**Correction:** `03B-011B` sets the RLS helper functions to the stricter fixed
`pg_catalog, public` search path.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-05 — Premature WT-SQ seed encoded unapproved assumptions

**Finding:** the first 03B-012 draft assigned criterion-level weights, evaluation
scopes, evidence-required flags and gate criticality although those details had
not been explicitly approved as business configuration.

**Correction:** that seed was removed. 03B-012 now seeds only the technical
permission and audit vocabularies already referenced by the kernel. Pending
WT-SQ decisions are frozen in `WT_SQ_1_0_DECISIONS_REQUIRED.md`.

**Status:** FIXED; BUSINESS DECISION BLOCK REMAINS BY DESIGN.

## Current static checks

| Area | Result | Notes |
| --- | --- | --- |
| Migration naming/order | PASS AFTER FIX | Unique versions now required; 010A/011A/011B are explicit hardening patches. |
| 03B-004 FK ordering | PASS AFTER FIX | Composite evaluation/methodology key was moved before dependent FKs. |
| Store/Location evaluation context | PASS AFTER FIX | Location current-evaluation context and numbering were hardened. |
| Evidence subject/source XOR | PASS STATIC | 03B-005 enforces one subject and one evidence source. |
| Evidence item/gate context | PASS STATIC | Composite contextual FKs bind evidence to the declared evaluation. |
| Permission vocabulary | PASS STATIC | 03B-012 technical seed covers codes referenced by 010/011. |
| Audit event vocabulary | PASS STATIC | 03B-012 covers event codes currently emitted by 010. |
| SECURITY DEFINER execute boundary | PASS AFTER FIX | Internal helpers revoked; intended commands exposed to authenticated only. |
| RLS default posture | PASS STATIC | RLS enabled; no ordinary write policies for critical core tables. |
| Private Storage implementation | BLOCKED | Concrete bucket/object policies wait for real Supabase project/bucket discovery. |
| WT-SQ executable seed | BLOCKED BY BUSINESS CONFIG | Dimension model approved; criterion-level configuration still TBD. |
| System recommendation | FAIL-CLOSED | Intentional `WT03B_RECOMMENDATION_MATRIX_NOT_CONFIGURED`. |
| Governance quorum | FAIL-CLOSED | Activation rejects missing quorum. |
| HOLD lifecycle | FAIL-CLOSED | Finalization rejects HOLD until semantics are frozen. |
| Role-permission matrices | BLOCKED BY BUSINESS CONFIG | Catalog exists; no authority mappings invented. |
| Runtime migration apply | BLOCKED | Real Wolves Territory Supabase project not identified. |
| 03B-013 executable security suite | NOT YET | Attack matrix exists; runtime harness requires isolated database and fixtures. |

## Remaining static review items before sandbox execution

### P1 — Evaluation visibility to Store users

Current RLS design allows an authorized Store member to read evaluation items and
gate checks within its Store/Location scope. This may expose criterion-level
scores and gate states. Whether that is desirable is a product/governance
decision, not something to infer technically.

**Action:** freeze Store-facing evaluation visibility before production RLS.

### P1 — Audit contextual consistency

`audit_events` holds optional Store, Location and Evaluation context using simple
FKs. Command functions are responsible for keeping that denormalized context
consistent.

**Action:** decide whether V1 should add composite context constraints or retain
command-layer validation plus regression tests.

### P2 — Membership suspension → revocation history

Membership lifecycle checks may require suspension fields to be cleared when a
row later becomes REVOKED. Audit preserves the historical event, but the row
itself does not retain both lifecycle episodes simultaneously.

**Action:** confirm whether audit-only historical preservation is sufficient for
V1 or introduce dedicated membership status history later.

## Supabase discovery result

The connected Supabase environment currently exposes only projects identified as
`lobosfc-donations` and `wolves-os`. `wolves-os` is explicitly outside the 03B
source of truth and must not be used. Therefore the project backing the live
`wolves-territory` application remains **UNIDENTIFIED / UNCONNECTED** in this
preflight.

The application repository does not hardcode the project reference in
`lib/supabase-server.ts`; it reads `NEXT_PUBLIC_SUPABASE_URL` and
`SUPABASE_SERVICE_ROLE_KEY` from the deployment environment.

**Required next discovery source:** the actual deployment environment variables
for the Wolves Territory Vercel project, or explicit connection of the correct
Supabase project.

## Release gate to isolated sandbox

Before any runtime apply:

- [x] unique migration versions;
- [x] internal SECURITY DEFINER execute privileges hardened;
- [x] raw role-permission matrices removed from general authenticated visibility;
- [x] premature business assumptions removed from WT-SQ seed;
- [ ] finish remaining static review items;
- [ ] identify the real Wolves Territory Supabase project;
- [ ] capture current production schema/migrations for reconciliation;
- [ ] create/use an isolated non-production database or Supabase branch;
- [ ] apply migrations from a clean baseline and record first SQL failure, if any;
- [ ] convert 03B-013 contract into executable fixtures/assertions;
- [ ] run cross-Store, cross-Location, governance and audit attacks;
- [ ] run Supabase security/performance advisors after DDL;
- [ ] only then consider a production migration plan.

## Current verdict

**STATIC ARCHITECTURE: CONDITIONALLY PASSING**

**READY FOR PRODUCTION: NO**

**READY TO CONTINUE PREFLIGHT HARDENING: YES**

The test phase is doing its job: discovered defects are being converted into
versioned corrections before any database is touched.
