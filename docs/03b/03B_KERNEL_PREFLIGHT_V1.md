# 03B Commercial Platform — Kernel Preflight V1

Date: 2026-09-13
Branch: `feature/03b-commercial-platform-core`
Status: **STATIC PREFLIGHT SUBSTANTIALLY CLOSED / RUNTIME BLOCKED**

## Executive result

The kernel is structurally coherent enough to proceed to environment discovery and later isolated runtime testing, but it is not ready for production migration or runtime certification yet.

Primary blockers are intentional and healthy:

1. the real Supabase project used by `wolves-territory` has not been identified through the connected Supabase environment;
2. business configuration required to activate WT-SQ-1.0 is still pending;
3. the 03B-013 file is currently an adversarial test contract, not yet a fully executable pgTAP/CI harness against an isolated database.

No 03B migration has been applied to `wolves-os` or to an identified production Wolves Territory database during this preflight.

## Findings discovered and corrected

### PF-01 — Duplicate Supabase migration version

**Finding:** 03B-010 and 03B-011 originally shared timestamp `20260913224000`. Supabase migration versions must be unique.

**Correction:** 03B-011 moved to `20260913224500_03b_011_rls_storage_policies.sql`.

**Status:** FIXED.

### PF-02 — SECURITY DEFINER functions inherited PUBLIC EXECUTE

**Finding:** PostgreSQL functions are executable by PUBLIC by default unless privileges are revoked. Internal 03B SECURITY DEFINER helpers included audit, permission and readiness functions that must never become general client RPCs.

**Risk examples:**

- direct use of `write_audit_event(...)` could undermine trusted audit semantics;
- arbitrary-user permission helper calls could disclose authority;
- internal validation/readiness helpers could bypass intended RLS read surfaces.

**Correction:** `03B-011A` revokes PUBLIC/anon/authenticated access to internal helpers and grants authenticated EXECUTE only to intended business commands.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-03 — Raw role-permission matrices visible to every authenticated account

**Finding:** the first RLS draft allowed every authenticated account to read `platform_role_permissions` and `store_role_permissions`.

**Correction:** `03B-011B` replaces those policies with platform-authorized access (`platform_role.read` or `audit.read`). Effective Store capabilities are resolved by trusted helpers rather than publication of the raw matrix.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-04 — RLS helper search_path consistency

**Finding:** 03B-011 SECURITY DEFINER helpers used `public, pg_temp` while the command layer used `pg_catalog, public`.

**Correction:** `03B-011B` sets the RLS helper functions to the stricter fixed `pg_catalog, public` search path.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-05 — Premature WT-SQ seed encoded unapproved assumptions

**Finding:** the first 03B-012 draft assigned criterion-level weights, evaluation scopes, evidence-required flags and gate criticality although those details had not been explicitly approved as business configuration.

**Correction:** that seed was removed. 03B-012 now seeds only the technical permission and audit vocabularies already referenced by the kernel. Pending WT-SQ decisions are frozen in `WT_SQ_1_0_DECISIONS_REQUIRED.md`.

**Status:** FIXED; BUSINESS DECISION BLOCK REMAINS BY DESIGN.

### PF-06 — Raw evaluation dossier was too visible to Store members

**Finding:** initial 03B-011 RLS let an authorized Store member read raw `store_evaluations`, evaluation items, gate checks and evaluation evidence within its Store/Location scope. Those rows may contain internal evaluator comments, scoring rationale, gate justification and verification context. The exact Store-facing evaluation field contract has not been approved.

**Correction:** `03B-011C` changes the raw evaluation dossier to platform/internal visibility only. Store-facing status, score and timeline will later be exposed through an explicitly approved filtered view/RPC.

**Status:** FIXED FAIL-CLOSED.

### PF-07 — Audit denormalized context could contradict Store/Location/Evaluation relationships

**Finding:** `audit_events` initially used independent simple FKs for `store_id`, `location_id` and `evaluation_id`. A malformed trusted write could therefore claim a Store context inconsistent with the referenced Location/Evaluation.

**Correction:** `03B-011C` adds contextual constraints:

- Location requires Store;
- `(location_id, store_id)` must identify a real Store Location;
- Evaluation requires Store;
- `(evaluation_id, store_id)` must identify the real Evaluation Store;
- when Evaluation + Location are both present, `(evaluation_id, store_id, location_id)` must identify the exact evaluation context.

**Status:** FIXED IN DRAFT MIGRATION CHAIN.

### PF-08 — Membership suspension/revocation row history semantics

**Finding:** Store memberships and platform roles model current lifecycle state in-row. Their consistency checks require suspension fields to be cleared when the current status is no longer `SUSPENDED`, including when later revoked.

**Decision:** retain this V1 design. The row is the **current-state authorization record**, while immutable `audit_events` is the historical lifecycle ledger. We will not overload one row to represent multiple past lifecycle episodes.

**Regression requirement:** suspension, reactivation and revocation commands must each emit audit events before later lifecycle transitions alter current-state fields.

**Status:** ACCEPTED V1 DESIGN; NO SCHEMA CHANGE REQUIRED.

## Current static checks

| Area | Result | Notes |
| --- | --- | --- |
| Migration naming/order | PASS AFTER FIX | Unique versions; hardening patches are explicit and ordered. |
| 03B-004 FK ordering | PASS AFTER FIX | Composite evaluation/methodology key exists before dependent FKs. |
| Store/Location evaluation context | PASS AFTER FIX | Location current-evaluation context and numbering hardened. |
| Evidence subject/source XOR | PASS STATIC | 03B-005 enforces one subject and one evidence source. |
| Evidence item/gate context | PASS STATIC | Composite contextual FKs bind evidence to the declared evaluation. |
| Permission vocabulary | PASS STATIC | Technical seed covers codes referenced by command/RLS layers. |
| Audit event vocabulary | PASS STATIC | Technical seed covers event codes emitted by current command layer. |
| SECURITY DEFINER execute boundary | PASS AFTER FIX | Internal helpers revoked; intended commands exposed selectively. |
| RLS default posture | PASS AFTER FIX | Critical raw evaluation domain now fails closed to Store members. |
| Audit contextual integrity | PASS AFTER FIX | Composite Store/Location/Evaluation context constraints added. |
| Membership lifecycle history | PASS DESIGN | Current row = current state; audit ledger = history. |
| Private Storage implementation | BLOCKED | Concrete bucket/object policies wait for real Supabase project/bucket discovery. |
| WT-SQ executable seed | BLOCKED BY BUSINESS CONFIG | Dimension model approved; criterion-level configuration still TBD. |
| System recommendation | FAIL-CLOSED | Intentional `WT03B_RECOMMENDATION_MATRIX_NOT_CONFIGURED`. |
| Governance quorum | FAIL-CLOSED | Activation rejects missing quorum. |
| HOLD lifecycle | FAIL-CLOSED | Finalization rejects HOLD until semantics are frozen. |
| Role-permission matrices | BLOCKED BY BUSINESS CONFIG | Catalog exists; no authority mappings invented. |
| Runtime migration apply | BLOCKED | Real Wolves Territory Supabase project not identified. |
| 03B-013 executable security suite | NOT YET | Attack matrix exists; runtime harness requires isolated database and fixtures. |

## Store-facing evaluation projection — explicit future contract

The raw internal evaluation dossier is no longer a Store-facing surface by default. Before a Store portal exposes qualification information, approve a projection contract defining which of the following may be visible:

- evaluation status;
- total score;
- classification;
- final decision;
- non-sensitive remediation/request-changes message;
- evidence/document completion status;
- timeline dates;
- whether criterion-level scores are visible;
- whether gate states are visible;
- whether evaluator comments are visible;
- whether reviewer identities/internal notes are visible.

Until approved, Store users receive **no raw evaluation dossier rows**. This is an information-governance decision, not a frontend styling decision.

## Supabase discovery result

The connected Supabase environment currently exposes only projects identified as `lobosfc-donations` and `wolves-os`. `wolves-os` is explicitly outside the 03B source of truth and must not be used. Therefore the project backing the live `wolves-territory` application remains **UNIDENTIFIED / UNCONNECTED** in this preflight.

The application repository does not hardcode the project reference in `lib/supabase-server.ts`; it reads `NEXT_PUBLIC_SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` from the deployment environment.

**Required next discovery source:** the actual deployment environment variables for the Wolves Territory Vercel project, or explicit connection of the correct Supabase project.

## Release gate to isolated sandbox

Before any runtime apply:

- [x] unique migration versions;
- [x] internal SECURITY DEFINER execute privileges hardened;
- [x] raw role-permission matrices removed from general authenticated visibility;
- [x] premature business assumptions removed from WT-SQ seed;
- [x] raw evaluation dossier fails closed until Store projection is approved;
- [x] audit Store/Location/Evaluation context hardened relationally;
- [x] membership current-state vs audit-history semantics explicitly frozen;
- [x] static preflight architecture review substantially closed;
- [ ] identify the real Wolves Territory Supabase project;
- [ ] capture current production schema/migrations for reconciliation;
- [ ] create/use an isolated non-production database or Supabase branch;
- [ ] apply migrations from a clean baseline and record first SQL failure, if any;
- [ ] convert 03B-013 contract into executable fixtures/assertions;
- [ ] run cross-Store, cross-Location, governance and audit attacks;
- [ ] run Supabase security/performance advisors after DDL;
- [ ] only then consider a production migration plan.

## Current verdict

**STATIC ARCHITECTURE: PASSING WITH INTENTIONAL BUSINESS-CONFIG BLOCKERS**

**READY FOR PRODUCTION: NO**

**READY FOR REAL-ENVIRONMENT DISCOVERY + SCHEMA RECONCILIATION: YES**

The test phase is doing its job: discovered defects are being converted into versioned corrections before any database is touched.
