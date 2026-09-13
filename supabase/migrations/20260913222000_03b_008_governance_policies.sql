-- 03B Commercial Platform
-- Migration: 03B-008 Governance Policies
-- Architecture Freeze: V1
--
-- Governance answers whether an otherwise permitted action is institutionally
-- valid. Permission is capability; governance is decision legitimacy.
--
-- Core chain:
--   IDENTITY -> ROLE -> PERMISSION -> CONTEXT -> GOVERNANCE -> DECISION

begin;

-- -----------------------------------------------------------------------------
-- VERSIONED GOVERNANCE POLICIES
-- -----------------------------------------------------------------------------

create table if not exists public.governance_policies (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version text not null,
  name text not null,
  description text,
  status public.governance_policy_status not null default 'DRAFT',

  -- Configuration is deliberately policy data rather than hard-coded workflow.
  -- Activation functions will validate the contract for each policy code.
  configuration jsonb not null default '{}'::jsonb,

  created_by uuid,
  created_at timestamptz not null default now(),
  activated_by uuid,
  activated_at timestamptz,
  retired_by uuid,
  retired_at timestamptz,

  constraint governance_policies_code_version_unique unique (code, version),
  constraint governance_policies_code_not_blank check (btrim(code) <> ''),
  constraint governance_policies_version_not_blank check (btrim(version) <> ''),
  constraint governance_policies_name_not_blank check (btrim(name) <> ''),
  constraint governance_policies_configuration_object
    check (jsonb_typeof(configuration) = 'object'),
  constraint governance_policies_lifecycle_consistency
    check (
      (status = 'DRAFT' and activated_at is null and retired_at is null)
      or
      (status = 'ACTIVE' and activated_at is not null and retired_at is null)
      or
      (status = 'RETIRED' and activated_at is not null and retired_at is not null)
    )
);

comment on table public.governance_policies is
  'Versioned institutional decision policies. ACTIVE versions are treated as immutable; changes create a new version rather than rewriting historical authority rules.';

comment on column public.governance_policies.configuration is
  'Validated policy contract containing quorum, maker-checker, final authority, gate/evidence blocking and other decision rules. Structure is validated before activation.';

-- An institutional policy code may have only one ACTIVE version at a time.
create unique index if not exists governance_policies_one_active_version_idx
  on public.governance_policies(code)
  where status = 'ACTIVE';

-- Complete the deferred governance FK introduced by 03B-004.
alter table public.store_evaluations
  add constraint store_evaluations_governance_policy_fk
  foreign key (governance_policy_id)
  references public.governance_policies(id)
  on delete restrict;

create index if not exists governance_policies_status_idx
  on public.governance_policies(status, code);

create index if not exists store_evaluations_governance_policy_idx
  on public.store_evaluations(governance_policy_id)
  where governance_policy_id is not null;

-- -----------------------------------------------------------------------------
-- GOVERNANCE CONTRACT — WT STORE EVALUATION APPROVAL V1
-- -----------------------------------------------------------------------------
-- The first production policy will use a contract conceptually equivalent to:
--
-- {
--   "partner_review_required": true,
--   "minimum_partner_reviews": TBD,
--   "minimum_partner_approvals": TBD,
--   "superadmin_final_decision_required": true,
--   "allow_self_approval": false,
--   "critical_gate_failure_blocks_approval": true,
--   "incomplete_evidence_blocks_approval": true,
--   "request_changes_allowed": true,
--   "hold_allowed": true
-- }
--
-- IMPORTANT: the partner quorum remains a business decision and is therefore
-- intentionally NOT seeded or invented in this migration.
--
-- Governance policy validation in 03B-010 must reject incomplete/unknown policy
-- contracts before activation. DRAFT configuration may be incomplete while it
-- is being prepared; ACTIVE configuration may not.

-- -----------------------------------------------------------------------------
-- MAKER-CHECKER / SEPARATION OF DUTIES
-- -----------------------------------------------------------------------------
-- Critical decisions follow separation of duties. This is evaluated using the
-- actual authenticated user identity, not merely role names.
--
-- Examples:
--   Store evaluation creator/preparer != sole final approver
--   settlement creator             != sole final approver
--   sensitive bank change maker    != sole checker
--   Store OWNER transfer initiator != sole final authority
--
-- A human holding multiple roles does not defeat maker-checker. If the same
-- auth user created and attempts to finally approve a governed object, policy
-- may deny the action despite the user possessing both permissions.
--
-- SUPERADMIN means maximum application authority, not unrestricted database
-- ownership and not an automatic bypass of integrity constraints.

-- -----------------------------------------------------------------------------
-- EVALUATION GOVERNANCE STATE MACHINE
-- -----------------------------------------------------------------------------
-- Expected controlled lifecycle:
--
--   DRAFT
--     -> IN_PROGRESS
--     -> SUBMITTED
--     -> PARTNER_REVIEW
--     -> FINAL_REVIEW
--     -> APPROVED | REJECTED
--
-- REQUEST_CHANGES is a governed transition back to IN_PROGRESS and increments
-- current_review_round. Previous review rows remain immutable history.
--
-- HOLD is a final_decision value, not a substitute for arbitrary workflow
-- mutation. Its exact transition behavior is implemented in command functions.
--
-- Evaluation approval does NOT activate the Store operationally:
--
--   Evaluation APPROVED
--     -> Store APPROVED
--     -> Agreement / Contract workflow
--     -> Contract ACTIVE
--     -> Location operational eligibility
--     -> Custody activation
--
-- 03B core intentionally stops before Contract/Custody domains.

-- -----------------------------------------------------------------------------
-- COMMAND BOUNDARY — 03B-010
-- -----------------------------------------------------------------------------
-- validate_governance_policy(policy_id):
--   * validates a policy-specific JSON contract;
--   * rejects unknown/invalid field types;
--   * validates quorum relationships (e.g. approvals <= reviews);
--   * validates non-negative integer thresholds;
--   * requires explicit final authority rules;
--   * never supplies missing business decisions by guesswork.
--
-- activate_governance_policy(policy_id):
--   * requires explicit high-risk platform permission;
--   * locks policy code/version set;
--   * validates complete configuration;
--   * ensures only one ACTIVE version per code;
--   * records activation and audit atomically;
--   * ACTIVE policy becomes practically immutable.
--
-- retire_governance_policy(policy_id):
--   * does not rewrite evaluations already bound to that policy;
--   * prevents new evaluations from selecting the retired version;
--   * preserves historical decision reproducibility.
--
-- governance_evaluation_readiness(evaluation_id):
--   * loads the exact policy version bound to the evaluation;
--   * checks completeness, evidence, critical gates and review quorum;
--   * checks maker-checker against actual user identities;
--   * returns machine-readable readiness/blocking reasons;
--   * does not itself mutate the evaluation.
--
-- finalize_store_evaluation(evaluation_id, decision, notes):
--   * derives actor from auth.uid();
--   * requires evaluation.finalize permission;
--   * locks evaluation/relevant review rows;
--   * calls governance readiness against bound policy version;
--   * denies self-approval where policy forbids it;
--   * denies APPROVED when critical gate/evidence/quorum rules block it;
--   * writes final decision, Store/Location snapshot effects and audit in one
--     PostgreSQL transaction;
--   * never bypasses relational/data-integrity constraints.
--
-- Emergency override is reserved for a future explicit, audited mechanism. It
-- is intentionally NOT implemented as a hidden SUPERADMIN bypass in V1.

commit;
