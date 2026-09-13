-- 03B Commercial Platform
-- Patch: 03B-011C Evaluation Visibility + Audit Context Hardening
-- Architecture Freeze: V1
--
-- PRE-FLIGHT FINDINGS ADDRESSED
-- 1. Store membership must not implicitly expose the raw internal evaluation
--    dossier before the Store-facing projection contract is explicitly frozen.
-- 2. Audit denormalized context must not be able to claim a Location/Evaluation
--    belonging to a different Store when the relevant context columns exist.
--
-- Fail-closed posture:
--   raw evaluation dossier = platform/internal access only for now;
--   Store-facing status/score/timeline will be exposed later through a filtered
--   view/RPC with an explicit field contract.

begin;

-- -----------------------------------------------------------------------------
-- RAW EVALUATION DOSSIER VISIBILITY
-- -----------------------------------------------------------------------------
-- 03B-011 initially allowed active Store members to read evaluations/items/
-- gates/evidence for their Store/Location. That is broader than our currently
-- approved product contract because those rows may contain internal evaluator
-- comments, scoring rationale, gate justification and verification context.
--
-- Until a Store-facing projection is approved, keep raw dossier access on the
-- platform side only. This does not prevent future Store access; it prevents us
-- from accidentally making an information-disclosure decision in schema code.

alter policy store_evaluations_select
  on public.store_evaluations
  using (
    public.has_active_platform_permission('evaluation.read')
  );

alter policy evaluation_items_select
  on public.store_evaluation_items
  using (
    public.has_active_platform_permission('evaluation.read')
  );

alter policy gate_checks_select
  on public.store_gate_checks
  using (
    public.has_active_platform_permission('evaluation.read')
  );

alter policy evaluation_evidence_select
  on public.store_evaluation_evidence
  using (
    public.has_active_platform_permission('evidence.read')
    or public.has_active_platform_permission('evaluation.read')
  );

comment on table public.store_evaluations is
  'Historical qualification/decision dossier. Raw rows are internal/platform-facing in V1 pre-flight; Store-facing visibility must use an explicitly approved filtered projection/RPC.';

-- -----------------------------------------------------------------------------
-- AUDIT DENORMALIZED CONTEXT INTEGRITY
-- -----------------------------------------------------------------------------
-- audit_events intentionally denormalizes Store/Location/Evaluation context for
-- forensic performance. Denormalization is useful only if it cannot contradict
-- the relational source of truth.

-- Location context requires Store context and the Location must belong to it.
alter table public.audit_events
  add constraint audit_events_location_requires_store
  check (location_id is null or store_id is not null);

alter table public.audit_events
  add constraint audit_events_location_store_context_fk
  foreign key (location_id, store_id)
  references public.commercial_store_locations(id, store_id)
  on delete restrict;

-- Evaluation context requires Store context and the Evaluation must belong to it.
alter table public.audit_events
  add constraint audit_events_evaluation_requires_store
  check (evaluation_id is null or store_id is not null);

alter table public.audit_events
  add constraint audit_events_evaluation_store_context_fk
  foreign key (evaluation_id, store_id)
  references public.store_evaluations(id, store_id)
  on delete restrict;

-- When an audit event declares BOTH Evaluation and Location, all three context
-- values must describe the same evaluation dossier. MATCH SIMPLE is sufficient
-- here because this FK only needs to fire when location_id is present; the
-- evaluation+store FK above still protects organization-only evaluations.
alter table public.audit_events
  add constraint audit_events_evaluation_location_context_fk
  foreign key (evaluation_id, store_id, location_id)
  references public.store_evaluations(id, store_id, location_id)
  on delete restrict;

comment on column public.audit_events.store_id is
  'Denormalized forensic Store context. Contextual foreign keys prevent a Location/Evaluation event from claiming a different Store.';

comment on column public.audit_events.location_id is
  'Optional forensic Location context. When present it must belong to audit_events.store_id; when paired with evaluation_id it must match the Evaluation Location.';

comment on column public.audit_events.evaluation_id is
  'Optional forensic Evaluation context. When present it must belong to audit_events.store_id and, when location_id is also present, to that exact Location.';

commit;
