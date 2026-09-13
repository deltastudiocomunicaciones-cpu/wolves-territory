-- 03B Commercial Platform
-- Migration: 03B-001 Foundational Types / Enums
-- Architecture Freeze: V1
--
-- IMPORTANT
-- - This migration is versioned in the wolves-territory repository only.
-- - Do NOT apply it to the deprecated `wolves-os` prototype.
-- - It must be applied only after the real production Supabase project backing
--   the Wolves Territory Referral e-commerce has been identified and reconciled.
--
-- Design principles encoded here:
-- - Organization != Location
-- - Score != Approval
-- - Role != Permission
-- - Verification != Validity
-- - Platform Role != Store Role
-- - Current State != History
-- - Macro Store lifecycle != child workflow lifecycle

begin;

-- -----------------------------------------------------------------------------
-- COMMERCIAL ENTITY / LOCATION
-- -----------------------------------------------------------------------------

do $$
begin
  create type public.commercial_location_type as enum (
    'STREET_STORE',
    'SHOPPING_CENTER',
    'DEPARTMENT_STORE',
    'SHOWROOM',
    'MULTIBRAND',
    'OTHER'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  -- Macro relationship status only.
  -- Evaluation workflow and Agreement workflow have their own states.
  create type public.commercial_store_status as enum (
    'CANDIDATE',
    'UNDER_REVIEW',
    'APPROVED',
    'CONTRACT_PENDING',
    'ACTIVE',
    'SUSPENDED',
    'TERMINATION_PENDING',
    'CLOSED',
    'REJECTED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.commercial_location_status as enum (
    'PENDING',
    'UNDER_REVIEW',
    'APPROVED',
    'ACTIVE',
    'SUSPENDED',
    'CLOSED',
    'REJECTED'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- METHODOLOGY / EVALUATION
-- -----------------------------------------------------------------------------

do $$
begin
  create type public.methodology_status as enum (
    'DRAFT',
    'ACTIVE',
    'RETIRED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.evaluation_scope as enum (
    'ORGANIZATION',
    'LOCATION',
    'COMBINED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.store_classification as enum (
    'ELITE',
    'STRATEGIC',
    'APPROVED',
    'CONDITIONAL',
    'NOT_RECOMMENDED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.store_evaluation_status as enum (
    'DRAFT',
    'IN_PROGRESS',
    'SUBMITTED',
    'PARTNER_REVIEW',
    'FINAL_REVIEW',
    'APPROVED',
    'REJECTED',
    'ARCHIVED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.store_recommendation as enum (
    'STRONGLY_APPROVE',
    'APPROVE',
    'CONDITIONAL',
    'HOLD',
    'REJECT'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.store_final_decision as enum (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'HOLD'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.store_gate_status as enum (
    'PASS',
    'FAIL',
    'PENDING',
    'NOT_APPLICABLE'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.store_review_decision as enum (
    'APPROVE',
    'REJECT',
    'ABSTAIN',
    'REQUEST_CHANGES'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- EVIDENCE / DOCUMENTS
-- -----------------------------------------------------------------------------

do $$
begin
  create type public.evaluation_evidence_status as enum (
    'NOT_REQUIRED',
    'PENDING',
    'COMPLETE',
    'REJECTED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.evaluation_evidence_type as enum (
    'PHOTO',
    'VIDEO',
    'DOCUMENT',
    'URL',
    'VISIT_REPORT',
    'REFERENCE',
    'OTHER'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.evidence_verification_status as enum (
    'PENDING',
    'ACCEPTED',
    'REJECTED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  -- Expiration is derived from expires_at and is intentionally not a
  -- verification state. A document can be historically VERIFIED and later
  -- become effectively expired.
  create type public.store_document_verification_status as enum (
    'PENDING',
    'VERIFIED',
    'REJECTED'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- STORE MEMBERSHIP / INVITATIONS
-- -----------------------------------------------------------------------------

do $$
begin
  create type public.commercial_store_member_role as enum (
    'OWNER',
    'MANAGER',
    'INVENTORY_MANAGER',
    'SALES_OPERATOR',
    'VIEWER'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.commercial_store_membership_status as enum (
    'ACTIVE',
    'SUSPENDED',
    'REVOKED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.commercial_store_invitation_status as enum (
    'PENDING',
    'ACCEPTED',
    'EXPIRED',
    'REVOKED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.commercial_location_access_mode as enum (
    'ALL_LOCATIONS',
    'SELECTED_LOCATIONS',
    'NO_LOCATION_ACCESS'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- PERMISSIONS / PLATFORM AUTHORITY
-- -----------------------------------------------------------------------------

do $$
begin
  create type public.platform_role as enum (
    'SUPERADMIN',
    'COMMERCIAL_ADMIN',
    'EVALUATOR',
    'PARTNER_REVIEWER',
    'FINANCE',
    'AUDITOR'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.platform_role_status as enum (
    'ACTIVE',
    'SUSPENDED',
    'REVOKED'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.permission_scope as enum (
    'PLATFORM',
    'STORE',
    'LOCATION'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.risk_level as enum (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- GOVERNANCE
-- -----------------------------------------------------------------------------

do $$
begin
  -- Separate type from methodology_status on purpose: the lifecycle values are
  -- currently equal, but the concepts must remain semantically independent.
  create type public.governance_policy_status as enum (
    'DRAFT',
    'ACTIVE',
    'RETIRED'
  );
exception
  when duplicate_object then null;
end
$$;

-- -----------------------------------------------------------------------------
-- AUDIT
-- -----------------------------------------------------------------------------

do $$
begin
  -- Actor answers WHO caused the event. Channel/source (ADMIN_WEB, STORE_PORTAL,
  -- API, SADI, SYSTEM_JOB, etc.) will be stored separately by the Audit Engine.
  create type public.audit_actor_type as enum (
    'USER',
    'SYSTEM',
    'SERVICE',
    'INTEGRATION',
    'MIGRATION'
  );
exception
  when duplicate_object then null;
end
$$;

do $$
begin
  create type public.audit_event_outcome as enum (
    'SUCCESS',
    'DENIED',
    'FAILED'
  );
exception
  when duplicate_object then null;
end
$$;

commit;
