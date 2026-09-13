-- 03B Commercial Platform
-- Migration: 03B-009 Audit Engine
-- Architecture Freeze: V1
--
-- Audit is institutional memory, not a replacement for application/server logs.
-- A useful audit event answers:
--   ACTOR + ACTION + SUBJECT + CONTEXT + TIME + AUTHORITY + OUTCOME
--   (+ BEFORE + AFTER + REASON)
--
-- Actor and source are deliberately separate concepts.

begin;

-- -----------------------------------------------------------------------------
-- CONTROLLED AUDIT EVENT TYPE CATALOG
-- -----------------------------------------------------------------------------

create table if not exists public.audit_event_types (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  domain text not null,
  description text not null,
  risk_level public.risk_level not null default 'LOW',
  requires_reason boolean not null default false,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint audit_event_types_code_unique unique (code),
  constraint audit_event_types_code_not_blank check (btrim(code) <> ''),
  constraint audit_event_types_code_format
    check (code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint audit_event_types_domain_not_blank check (btrim(domain) <> ''),
  constraint audit_event_types_description_not_blank check (btrim(description) <> '')
);

comment on table public.audit_event_types is
  'Controlled vocabulary of meaningful business/security audit events. It prevents arbitrary free-text event names from becoming the institutional record.';

-- -----------------------------------------------------------------------------
-- APPEND-ONLY AUDIT EVENTS
-- -----------------------------------------------------------------------------

create table if not exists public.audit_events (
  id uuid primary key default gen_random_uuid(),
  occurred_at timestamptz not null default now(),

  actor_type public.audit_actor_type not null,
  actor_user_id uuid,

  event_type_id uuid not null
    references public.audit_event_types(id) on delete restrict,

  entity_type text not null,
  entity_id uuid,

  -- Optional denormalized context makes investigation efficient while command
  -- functions remain responsible for proving contextual consistency.
  store_id uuid references public.commercial_stores(id) on delete restrict,
  location_id uuid references public.commercial_store_locations(id) on delete restrict,
  evaluation_id uuid references public.store_evaluations(id) on delete restrict,

  outcome public.audit_event_outcome not null default 'SUCCESS',
  reason text,

  old_data jsonb,
  new_data jsonb,
  changed_fields text[],

  governance_policy_id uuid
    references public.governance_policies(id) on delete restrict,

  correlation_id uuid,
  request_id text,
  source text not null,
  metadata jsonb not null default '{}'::jsonb,

  constraint audit_events_entity_type_not_blank check (btrim(entity_type) <> ''),
  constraint audit_events_source_not_blank check (btrim(source) <> ''),
  constraint audit_events_request_id_not_blank
    check (request_id is null or btrim(request_id) <> ''),
  constraint audit_events_reason_not_blank
    check (reason is null or btrim(reason) <> ''),
  constraint audit_events_old_data_object
    check (old_data is null or jsonb_typeof(old_data) = 'object'),
  constraint audit_events_new_data_object
    check (new_data is null or jsonb_typeof(new_data) = 'object'),
  constraint audit_events_metadata_object
    check (jsonb_typeof(metadata) = 'object'),
  constraint audit_events_changed_fields_nonempty
    check (changed_fields is null or cardinality(changed_fields) > 0),
  constraint audit_events_actor_consistency
    check (
      (actor_type = 'USER' and actor_user_id is not null)
      or
      (actor_type <> 'USER')
    )
);

comment on table public.audit_events is
  'Append-only institutional audit ledger. Normal application flows may INSERT through trusted functions but may not UPDATE or DELETE historical events.';

comment on column public.audit_events.actor_type is
  'WHO/WHAT performed the action: USER, SYSTEM, SERVICE, INTEGRATION or MIGRATION. This is not the transport/source channel.';

comment on column public.audit_events.source is
  'Execution channel such as WEB, API, RPC, JOB or INTEGRATION name. Source is distinct from actor identity.';

comment on column public.audit_events.correlation_id is
  'Groups multiple audit events belonging to one logical business transaction, e.g. final evaluation decision plus Store/Location snapshot updates.';

-- -----------------------------------------------------------------------------
-- INDEXES FOR INVESTIGATION / TIMELINES
-- -----------------------------------------------------------------------------

create index if not exists audit_events_occurred_at_idx
  on public.audit_events(occurred_at desc);

create index if not exists audit_events_actor_idx
  on public.audit_events(actor_user_id, occurred_at desc)
  where actor_user_id is not null;

create index if not exists audit_events_event_type_idx
  on public.audit_events(event_type_id, occurred_at desc);

create index if not exists audit_events_entity_idx
  on public.audit_events(entity_type, entity_id, occurred_at desc);

create index if not exists audit_events_store_idx
  on public.audit_events(store_id, occurred_at desc)
  where store_id is not null;

create index if not exists audit_events_location_idx
  on public.audit_events(location_id, occurred_at desc)
  where location_id is not null;

create index if not exists audit_events_evaluation_idx
  on public.audit_events(evaluation_id, occurred_at desc)
  where evaluation_id is not null;

create index if not exists audit_events_correlation_idx
  on public.audit_events(correlation_id, occurred_at asc)
  where correlation_id is not null;

create index if not exists audit_events_outcome_idx
  on public.audit_events(outcome, occurred_at desc)
  where outcome <> 'SUCCESS';

-- -----------------------------------------------------------------------------
-- AUDIT EVENT VOCABULARY — RESERVED FOR CONTROLLED SEED
-- -----------------------------------------------------------------------------
-- The catalog seed is deferred until 03B-012 / implementation reconciliation.
-- Candidate event codes include meaningful business transitions such as:
--
-- Store / Location
--   store.created
--   store.submitted_for_review
--   store.approved
--   store.rejected
--   store.suspended
--   store.reactivated
--   location.created
--   location.status_changed
--
-- Evaluation
--   evaluation.created
--   evaluation.started
--   evaluation.item_scored
--   evaluation.gate_changed
--   evaluation.submitted
--   evaluation.changes_requested
--   evaluation.partner_review_submitted
--   evaluation.finalized
--
-- Evidence / Documents
--   document.registered
--   document.verified
--   document.rejected
--   document.superseded
--   evidence.registered
--   evidence.verified
--   evidence.rejected
--
-- Membership / Security
--   membership.invited
--   membership.invitation_revoked
--   membership.invitation_accepted
--   membership.role_changed
--   membership.scope_changed
--   membership.suspended
--   membership.reactivated
--   membership.revoked
--   platform_role.granted
--   platform_role.suspended
--   platform_role.revoked
--
-- Governance / Methodology
--   methodology.activated
--   methodology.retired
--   governance_policy.activated
--   governance_policy.retired
--
-- Future domains extend the same catalog:
--   agreement.*, custody.*, inventory.*, sale.*, settlement.*, incident.*

-- -----------------------------------------------------------------------------
-- DATA MINIMIZATION / SECURITY CONTRACT
-- -----------------------------------------------------------------------------
-- old_data/new_data are sanitized snapshots, NOT blind row dumps.
-- Never persist in audit payloads:
--   * plaintext invitation/auth secrets or tokens
--   * password/reset credentials
--   * service-role/API secrets
--   * full payment credentials
--   * unnecessary banking data
--   * signed Storage URLs
--   * unnecessary sensitive PII
--
-- Hashes, stable identifiers and redacted/minimized values are preferred where
-- they provide sufficient forensic meaning.
--
-- A denied HIGH/CRITICAL action may itself be an auditable event. Routine 403s
-- and every HTTP request are not automatically institutional audit events.

-- -----------------------------------------------------------------------------
-- APPEND-ONLY / ACCESS BOUNDARY — 03B-010 + 03B-011
-- -----------------------------------------------------------------------------
-- write_audit_event(...):
--   * trusted internal helper, normally called by command functions;
--   * resolves controlled event type;
--   * enforces requires_reason from audit_event_types;
--   * sanitizes snapshots/metadata;
--   * derives USER actor from auth.uid() rather than trusting a caller user_id;
--   * receives explicit SYSTEM/SERVICE/INTEGRATION/MIGRATION context only from
--     trusted execution paths;
--   * uses DB server time for occurred_at;
--   * participates in the same PostgreSQL transaction as the critical business
--     mutation whenever both live in the same database.
--
-- RLS / grants in 03B-011 will implement:
--   * no ordinary UPDATE of audit_events;
--   * no ordinary DELETE of audit_events;
--   * no browser/client direct INSERT;
--   * raw audit read only for SUPERADMIN/AUDITOR or explicit audit.read
--     capability;
--   * Store-facing timelines exposed through filtered projection/RPC rather
--     than the raw ledger, preventing leakage of internal reviewer/security
--     context.
--
-- Corrections to audit history are represented by new compensating/correction
-- events; historical rows are not rewritten.
--
-- Retention duration remains a business/legal policy decision (TBD) and is not
-- invented here. Future hardening may add hash chaining or WORM archival, but
-- those are not required for V1 integrity.

commit;
