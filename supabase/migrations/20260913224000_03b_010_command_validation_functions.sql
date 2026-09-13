-- 03B Commercial Platform
-- Migration: 03B-010 Command + Validation Functions
-- Architecture Freeze: V1
--
-- Functions are the verbs of the architecture.
-- Clients do not own business invariants. Critical state transitions flow through
-- server-side commands that authenticate, authorize, validate, lock, mutate and
-- audit inside PostgreSQL transactions.
--
-- IMPORTANT:
--   * This migration is a draft until reconciled with the real production
--     Wolves Territory Supabase project.
--   * Permission matrices, audit-event seeds, WT-SQ-1.0 seed, partner quorum
--     and system recommendation matrix remain controlled configuration.
--   * No migration in this branch is to be applied blindly to wolves-os or any
--     unrelated Supabase project.

begin;

-- -----------------------------------------------------------------------------
-- ACTOR / ERROR HELPERS
-- -----------------------------------------------------------------------------

create or replace function public.require_authenticated_actor()
returns uuid
language plpgsql
stable
security invoker
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
begin
  v_actor := auth.uid();
  if v_actor is null then
    raise exception using
      errcode = 'P0001',
      message = 'WT03B_AUTH_REQUIRED';
  end if;
  return v_actor;
end;
$$;

-- -----------------------------------------------------------------------------
-- PERMISSION RESOLUTION
-- -----------------------------------------------------------------------------

create or replace function public.has_platform_permission(
  p_user_id uuid,
  p_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = pg_catalog, public
as $$
  select exists (
    select 1
    from public.platform_user_roles pur
    join public.platform_role_permissions prp
      on prp.role = pur.role
    join public.permissions p
      on p.id = prp.permission_id
    where pur.user_id = p_user_id
      and pur.status = 'ACTIVE'
      and p.code = p_permission_code
      and p.is_active = true
  );
$$;

create or replace function public.has_store_permission(
  p_user_id uuid,
  p_store_id uuid,
  p_location_id uuid,
  p_permission_code text
)
returns boolean
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_membership public.commercial_store_memberships%rowtype;
  v_permission_scope public.permission_scope;
begin
  select m.*
  into v_membership
  from public.commercial_store_memberships m
  where m.user_id = p_user_id
    and m.store_id = p_store_id
    and m.status = 'ACTIVE';

  if not found then
    return false;
  end if;

  select p.scope
  into v_permission_scope
  from public.store_role_permissions srp
  join public.permissions p on p.id = srp.permission_id
  where srp.role = v_membership.role
    and p.code = p_permission_code
    and p.is_active = true;

  if not found then
    return false;
  end if;

  if v_permission_scope <> 'LOCATION' then
    return true;
  end if;

  if p_location_id is null then
    return false;
  end if;

  if not exists (
    select 1
    from public.commercial_store_locations l
    where l.id = p_location_id
      and l.store_id = p_store_id
  ) then
    return false;
  end if;

  if v_membership.location_access_mode = 'NO_LOCATION_ACCESS' then
    return false;
  elsif v_membership.location_access_mode = 'ALL_LOCATIONS' then
    return true;
  elsif v_membership.location_access_mode = 'SELECTED_LOCATIONS' then
    return exists (
      select 1
      from public.commercial_store_membership_locations ml
      where ml.membership_id = v_membership.id
        and ml.store_id = p_store_id
        and ml.location_id = p_location_id
    );
  end if;

  return false;
end;
$$;

create or replace function public.assert_platform_permission(
  p_permission_code text
)
returns uuid
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
begin
  v_actor := public.require_authenticated_actor();
  if not public.has_platform_permission(v_actor, p_permission_code) then
    raise exception using
      errcode = 'P0001',
      message = 'WT03B_PERMISSION_DENIED:' || p_permission_code;
  end if;
  return v_actor;
end;
$$;

-- -----------------------------------------------------------------------------
-- AUDIT WRITER
-- -----------------------------------------------------------------------------

create or replace function public.write_audit_event(
  p_event_code text,
  p_actor_type public.audit_actor_type,
  p_entity_type text,
  p_entity_id uuid default null,
  p_store_id uuid default null,
  p_location_id uuid default null,
  p_evaluation_id uuid default null,
  p_outcome public.audit_event_outcome default 'SUCCESS',
  p_reason text default null,
  p_old_data jsonb default null,
  p_new_data jsonb default null,
  p_changed_fields text[] default null,
  p_governance_policy_id uuid default null,
  p_correlation_id uuid default null,
  p_request_id text default null,
  p_source text default 'RPC',
  p_metadata jsonb default '{}'::jsonb,
  p_explicit_actor_user_id uuid default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_event_type public.audit_event_types%rowtype;
  v_actor_user_id uuid;
  v_id uuid;
begin
  select * into v_event_type
  from public.audit_event_types
  where code = p_event_code
    and is_active = true;

  if not found then
    raise exception using
      errcode = 'P0001',
      message = 'WT03B_AUDIT_EVENT_TYPE_UNKNOWN:' || p_event_code;
  end if;

  if v_event_type.requires_reason
     and (p_reason is null or btrim(p_reason) = '') then
    raise exception using
      errcode = 'P0001',
      message = 'WT03B_AUDIT_REASON_REQUIRED:' || p_event_code;
  end if;

  if p_actor_type = 'USER' then
    v_actor_user_id := auth.uid();
    if v_actor_user_id is null then
      raise exception using errcode = 'P0001', message = 'WT03B_AUTH_REQUIRED';
    end if;
    if p_explicit_actor_user_id is not null
       and p_explicit_actor_user_id <> v_actor_user_id then
      raise exception using errcode = 'P0001', message = 'WT03B_ACTOR_SPOOF_DENIED';
    end if;
  else
    v_actor_user_id := p_explicit_actor_user_id;
  end if;

  insert into public.audit_events (
    actor_type, actor_user_id, event_type_id,
    entity_type, entity_id,
    store_id, location_id, evaluation_id,
    outcome, reason,
    old_data, new_data, changed_fields,
    governance_policy_id,
    correlation_id, request_id, source, metadata
  ) values (
    p_actor_type, v_actor_user_id, v_event_type.id,
    p_entity_type, p_entity_id,
    p_store_id, p_location_id, p_evaluation_id,
    p_outcome, p_reason,
    p_old_data, p_new_data, p_changed_fields,
    p_governance_policy_id,
    p_correlation_id, p_request_id, p_source, coalesce(p_metadata, '{}'::jsonb)
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- METHODOLOGY VALIDATION / ACTIVATION
-- -----------------------------------------------------------------------------

create or replace function public.validate_evaluation_methodology(
  p_methodology_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_method public.evaluation_methodologies%rowtype;
  v_dimension_total numeric;
  v_dimension_errors integer;
  v_band_count integer;
  v_band_errors integer;
  v_scope_requires_location boolean;
begin
  select * into v_method
  from public.evaluation_methodologies
  where id = p_methodology_id;

  if not found then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('METHODOLOGY_NOT_FOUND'));
  end if;

  select coalesce(sum(weight), 0)
  into v_dimension_total
  from public.evaluation_dimensions
  where methodology_id = p_methodology_id and is_active = true;

  select count(*)
  into v_dimension_errors
  from public.evaluation_dimensions d
  where d.methodology_id = p_methodology_id
    and d.is_active = true
    and coalesce((
      select sum(c.weight)
      from public.evaluation_criteria_catalog c
      where c.dimension_id = d.id and c.is_active = true
    ), 0) <> d.weight;

  select count(*)
  into v_band_count
  from public.evaluation_classification_bands
  where methodology_id = p_methodology_id;

  select count(*)
  into v_band_errors
  from (
    select
      b.min_score,
      b.max_score,
      lag(b.max_score) over (order by b.min_score) as previous_max,
      row_number() over (order by b.min_score) as rn,
      count(*) over () as total_rows
    from public.evaluation_classification_bands b
    where b.methodology_id = p_methodology_id
  ) x
  where (rn = 1 and min_score <> v_method.score_min)
     or (rn > 1 and min_score <> previous_max)
     or (rn = total_rows and max_score <> v_method.score_max);

  select exists (
    select 1 from public.evaluation_criteria_catalog
    where methodology_id = p_methodology_id
      and is_active = true
      and evaluation_scope in ('LOCATION', 'COMBINED')
    union all
    select 1 from public.evaluation_gate_catalog
    where methodology_id = p_methodology_id
      and is_active = true
      and evaluation_scope in ('LOCATION', 'COMBINED')
  ) into v_scope_requires_location;

  return jsonb_build_object(
    'valid',
      v_dimension_total = 100
      and v_dimension_errors = 0
      and exists (select 1 from public.evaluation_dimensions where methodology_id = p_methodology_id and is_active = true)
      and exists (select 1 from public.evaluation_criteria_catalog where methodology_id = p_methodology_id and is_active = true)
      and exists (select 1 from public.evaluation_gate_catalog where methodology_id = p_methodology_id and is_active = true)
      and v_band_count > 0
      and v_band_errors = 0,
    'dimension_weight_total', v_dimension_total,
    'dimension_reconciliation_errors', v_dimension_errors,
    'classification_band_count', v_band_count,
    'classification_band_errors', v_band_errors,
    'requires_location_context', v_scope_requires_location
  );
end;
$$;

create or replace function public.activate_evaluation_methodology(
  p_methodology_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  v_validation jsonb;
  v_method public.evaluation_methodologies%rowtype;
  v_correlation uuid := gen_random_uuid();
begin
  v_actor := public.assert_platform_permission('methodology.activate');

  select * into v_method
  from public.evaluation_methodologies
  where id = p_methodology_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WT03B_METHODOLOGY_NOT_FOUND';
  end if;
  if v_method.status <> 'DRAFT' then
    raise exception using errcode = 'P0001', message = 'WT03B_METHODOLOGY_NOT_DRAFT';
  end if;

  v_validation := public.validate_evaluation_methodology(p_methodology_id);
  if coalesce((v_validation->>'valid')::boolean, false) = false then
    raise exception using
      errcode = 'P0001',
      message = 'WT03B_METHODOLOGY_INVALID',
      detail = v_validation::text;
  end if;

  update public.evaluation_methodologies
  set status = 'ACTIVE', activated_at = now()
  where id = p_methodology_id;

  perform public.write_audit_event(
    'methodology.activated', 'USER', 'evaluation_methodology', p_methodology_id,
    p_correlation_id => v_correlation,
    p_new_data => jsonb_build_object('status', 'ACTIVE', 'activated_by', v_actor)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- GOVERNANCE POLICY VALIDATION / ACTIVATION
-- -----------------------------------------------------------------------------

create or replace function public.validate_governance_policy(
  p_policy_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_policy public.governance_policies%rowtype;
  c jsonb;
  v_errors jsonb := '[]'::jsonb;
  v_min_reviews integer;
  v_min_approvals integer;
begin
  select * into v_policy
  from public.governance_policies
  where id = p_policy_id;

  if not found then
    return jsonb_build_object('valid', false, 'errors', jsonb_build_array('POLICY_NOT_FOUND'));
  end if;

  c := v_policy.configuration;

  if not (c ? 'partner_review_required') then v_errors := v_errors || '"PARTNER_REVIEW_REQUIRED_MISSING"'::jsonb; end if;
  if not (c ? 'superadmin_final_decision_required') then v_errors := v_errors || '"FINAL_AUTHORITY_RULE_MISSING"'::jsonb; end if;
  if not (c ? 'allow_self_approval') then v_errors := v_errors || '"SELF_APPROVAL_RULE_MISSING"'::jsonb; end if;
  if not (c ? 'critical_gate_failure_blocks_approval') then v_errors := v_errors || '"CRITICAL_GATE_RULE_MISSING"'::jsonb; end if;
  if not (c ? 'incomplete_evidence_blocks_approval') then v_errors := v_errors || '"EVIDENCE_RULE_MISSING"'::jsonb; end if;

  if coalesce((c->>'partner_review_required')::boolean, false) then
    if not (c ? 'minimum_partner_reviews') or not (c ? 'minimum_partner_approvals') then
      v_errors := v_errors || '"PARTNER_QUORUM_MISSING"'::jsonb;
    else
      begin
        v_min_reviews := (c->>'minimum_partner_reviews')::integer;
        v_min_approvals := (c->>'minimum_partner_approvals')::integer;
        if v_min_reviews < 1 or v_min_approvals < 1 or v_min_approvals > v_min_reviews then
          v_errors := v_errors || '"PARTNER_QUORUM_INVALID"'::jsonb;
        end if;
      exception when others then
        v_errors := v_errors || '"PARTNER_QUORUM_NOT_INTEGER"'::jsonb;
      end;
    end if;
  end if;

  return jsonb_build_object('valid', jsonb_array_length(v_errors) = 0, 'errors', v_errors);
end;
$$;

create or replace function public.activate_governance_policy(
  p_policy_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  v_policy public.governance_policies%rowtype;
  v_validation jsonb;
  v_correlation uuid := gen_random_uuid();
begin
  v_actor := public.assert_platform_permission('governance.activate');

  select * into v_policy
  from public.governance_policies
  where id = p_policy_id
  for update;

  if not found then
    raise exception using errcode = 'P0001', message = 'WT03B_GOVERNANCE_POLICY_NOT_FOUND';
  end if;
  if v_policy.status <> 'DRAFT' then
    raise exception using errcode = 'P0001', message = 'WT03B_GOVERNANCE_POLICY_NOT_DRAFT';
  end if;

  v_validation := public.validate_governance_policy(p_policy_id);
  if coalesce((v_validation->>'valid')::boolean, false) = false then
    raise exception using
      errcode = 'P0001', message = 'WT03B_GOVERNANCE_POLICY_INVALID', detail = v_validation::text;
  end if;

  update public.governance_policies
  set status = 'ACTIVE', activated_by = v_actor, activated_at = now()
  where id = p_policy_id;

  perform public.write_audit_event(
    'governance_policy.activated', 'USER', 'governance_policy', p_policy_id,
    p_correlation_id => v_correlation,
    p_new_data => jsonb_build_object('status', 'ACTIVE', 'activated_by', v_actor)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- EVALUATION DERIVATION HELPERS
-- -----------------------------------------------------------------------------

create or replace function public.derive_evaluation_classification(
  p_methodology_id uuid,
  p_total_score numeric
)
returns public.store_classification
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_score_max numeric;
  v_classification public.store_classification;
begin
  select score_max into v_score_max
  from public.evaluation_methodologies
  where id = p_methodology_id;

  select b.classification
  into v_classification
  from public.evaluation_classification_bands b
  where b.methodology_id = p_methodology_id
    and p_total_score >= b.min_score
    and (
      p_total_score < b.max_score
      or (b.max_score = v_score_max and p_total_score <= b.max_score)
    )
  order by b.min_score desc
  limit 1;

  if v_classification is null then
    raise exception using errcode = 'P0001', message = 'WT03B_CLASSIFICATION_BAND_NOT_FOUND';
  end if;

  return v_classification;
end;
$$;

create or replace function public.derive_system_recommendation(
  p_evaluation_id uuid
)
returns public.store_recommendation
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
begin
  -- Intentionally blocked until the business-approved recommendation matrix is
  -- frozen. Architecture must not silently invent STRONGLY_APPROVE/APPROVE/etc.
  raise exception using
    errcode = 'P0001',
    message = 'WT03B_RECOMMENDATION_MATRIX_NOT_CONFIGURED',
    detail = p_evaluation_id::text;
end;
$$;

-- -----------------------------------------------------------------------------
-- CREATE EVALUATION
-- -----------------------------------------------------------------------------

create or replace function public.create_store_evaluation(
  p_store_id uuid,
  p_location_id uuid,
  p_methodology_id uuid,
  p_governance_policy_id uuid
)
returns uuid
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  v_evaluation_id uuid := gen_random_uuid();
  v_evaluation_code text;
  v_evaluation_number integer;
  v_requires_location boolean;
  v_correlation uuid := gen_random_uuid();
begin
  v_actor := public.assert_platform_permission('evaluation.create');

  perform 1
  from public.commercial_stores
  where id = p_store_id
  for update;
  if not found then
    raise exception using errcode = 'P0001', message = 'WT03B_STORE_NOT_FOUND';
  end if;

  if p_location_id is not null and not exists (
    select 1 from public.commercial_store_locations
    where id = p_location_id and store_id = p_store_id
  ) then
    raise exception using errcode = 'P0001', message = 'WT03B_LOCATION_CONTEXT_INVALID';
  end if;

  if not exists (
    select 1 from public.evaluation_methodologies
    where id = p_methodology_id and status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'WT03B_ACTIVE_METHODOLOGY_REQUIRED';
  end if;

  if not exists (
    select 1 from public.governance_policies
    where id = p_governance_policy_id and status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'WT03B_ACTIVE_GOVERNANCE_POLICY_REQUIRED';
  end if;

  select exists (
    select 1 from public.evaluation_criteria_catalog
    where methodology_id = p_methodology_id and is_active = true
      and evaluation_scope in ('LOCATION', 'COMBINED')
    union all
    select 1 from public.evaluation_gate_catalog
    where methodology_id = p_methodology_id and is_active = true
      and evaluation_scope in ('LOCATION', 'COMBINED')
  ) into v_requires_location;

  if v_requires_location and p_location_id is null then
    raise exception using errcode = 'P0001', message = 'WT03B_LOCATION_REQUIRED_BY_METHODOLOGY';
  end if;

  if p_location_id is null then
    select coalesce(max(evaluation_number), 0) + 1
    into v_evaluation_number
    from public.store_evaluations
    where store_id = p_store_id and location_id is null;
  else
    select coalesce(max(evaluation_number), 0) + 1
    into v_evaluation_number
    from public.store_evaluations
    where store_id = p_store_id and location_id = p_location_id;
  end if;

  v_evaluation_code := 'WT-EV-' || lpad(nextval('public.store_evaluation_code_seq')::text, 6, '0');

  insert into public.store_evaluations (
    id, evaluation_code, store_id, location_id,
    methodology_id, governance_policy_id,
    evaluation_number, status, created_by
  ) values (
    v_evaluation_id, v_evaluation_code, p_store_id, p_location_id,
    p_methodology_id, p_governance_policy_id,
    v_evaluation_number, 'DRAFT', v_actor
  );

  insert into public.store_evaluation_items (
    evaluation_id, methodology_id, criterion_id, evidence_status
  )
  select
    v_evaluation_id, p_methodology_id, c.id,
    case when c.evidence_required then 'PENDING'::public.evaluation_evidence_status
         else 'NOT_REQUIRED'::public.evaluation_evidence_status end
  from public.evaluation_criteria_catalog c
  where c.methodology_id = p_methodology_id and c.is_active = true;

  insert into public.store_gate_checks (
    evaluation_id, methodology_id, gate_id, evidence_status
  )
  select
    v_evaluation_id, p_methodology_id, g.id,
    case when g.evidence_required then 'PENDING'::public.evaluation_evidence_status
         else 'NOT_REQUIRED'::public.evaluation_evidence_status end
  from public.evaluation_gate_catalog g
  where g.methodology_id = p_methodology_id and g.is_active = true;

  perform public.write_audit_event(
    'evaluation.created', 'USER', 'store_evaluation', v_evaluation_id,
    p_store_id, p_location_id, v_evaluation_id,
    p_governance_policy_id => p_governance_policy_id,
    p_correlation_id => v_correlation,
    p_new_data => jsonb_build_object(
      'evaluation_code', v_evaluation_code,
      'evaluation_number', v_evaluation_number,
      'methodology_id', p_methodology_id,
      'created_by', v_actor
    )
  );

  return v_evaluation_id;
end;
$$;

-- -----------------------------------------------------------------------------
-- START / SCORE / GATE
-- -----------------------------------------------------------------------------

create or replace function public.start_store_evaluation(
  p_evaluation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  e public.store_evaluations%rowtype;
begin
  v_actor := public.assert_platform_permission('evaluation.score');
  select * into e from public.store_evaluations where id = p_evaluation_id for update;
  if not found then raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_FOUND'; end if;
  if e.status <> 'DRAFT' then raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_DRAFT'; end if;

  update public.store_evaluations
  set status = 'IN_PROGRESS', started_by = v_actor, started_at = now(), updated_at = now()
  where id = p_evaluation_id;

  perform public.write_audit_event(
    'evaluation.started','USER','store_evaluation',e.id,e.store_id,e.location_id,e.id,
    p_governance_policy_id => e.governance_policy_id,
    p_old_data => jsonb_build_object('status','DRAFT'),
    p_new_data => jsonb_build_object('status','IN_PROGRESS')
  );
end;
$$;

create or replace function public.score_evaluation_item(
  p_item_id uuid,
  p_score smallint,
  p_comment text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  i public.store_evaluation_items%rowtype;
  e public.store_evaluations%rowtype;
  c public.evaluation_criteria_catalog%rowtype;
  v_weighted numeric(8,4);
begin
  v_actor := public.assert_platform_permission('evaluation.score');

  select * into i from public.store_evaluation_items where id = p_item_id for update;
  if not found then raise exception using errcode='P0001', message='WT03B_EVALUATION_ITEM_NOT_FOUND'; end if;
  select * into e from public.store_evaluations where id = i.evaluation_id for update;
  select * into c from public.evaluation_criteria_catalog where id = i.criterion_id;

  if e.status not in ('DRAFT','IN_PROGRESS') then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_EDITABLE';
  end if;
  if p_score < c.min_score or p_score > c.max_score then
    raise exception using errcode='P0001', message='WT03B_SCORE_OUT_OF_RANGE';
  end if;

  v_weighted := round((p_score::numeric / c.max_score::numeric) * c.weight, 4);

  update public.store_evaluation_items
  set score = p_score,
      weighted_score = v_weighted,
      comment = nullif(btrim(p_comment), ''),
      scored_by = v_actor,
      scored_at = now(),
      updated_at = now()
  where id = p_item_id;

  perform public.write_audit_event(
    'evaluation.item_scored','USER','store_evaluation_item',i.id,
    e.store_id,e.location_id,e.id,
    p_governance_policy_id => e.governance_policy_id,
    p_old_data => jsonb_build_object('score',i.score,'weighted_score',i.weighted_score),
    p_new_data => jsonb_build_object('score',p_score,'weighted_score',v_weighted),
    p_changed_fields => array['score','weighted_score','comment']
  );
end;
$$;

create or replace function public.set_gate_status(
  p_gate_check_id uuid,
  p_status public.store_gate_status,
  p_comment text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  gc public.store_gate_checks%rowtype;
  e public.store_evaluations%rowtype;
  g public.evaluation_gate_catalog%rowtype;
begin
  v_actor := public.assert_platform_permission('evaluation.score');

  select * into gc from public.store_gate_checks where id = p_gate_check_id for update;
  if not found then raise exception using errcode='P0001', message='WT03B_GATE_CHECK_NOT_FOUND'; end if;
  select * into e from public.store_evaluations where id = gc.evaluation_id for update;
  select * into g from public.evaluation_gate_catalog where id = gc.gate_id;

  if e.status not in ('DRAFT','IN_PROGRESS') then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_EDITABLE';
  end if;
  if p_status = 'NOT_APPLICABLE' and not g.allow_not_applicable then
    raise exception using errcode='P0001', message='WT03B_GATE_NOT_APPLICABLE_FORBIDDEN';
  end if;
  if p_status in ('FAIL','NOT_APPLICABLE') and (p_comment is null or btrim(p_comment) = '') then
    raise exception using errcode='P0001', message='WT03B_GATE_JUSTIFICATION_REQUIRED';
  end if;

  update public.store_gate_checks
  set status = p_status,
      comment = nullif(btrim(p_comment), ''),
      verified_by = case when p_status = 'PENDING' then null else v_actor end,
      verified_at = case when p_status = 'PENDING' then null else now() end,
      updated_at = now()
  where id = p_gate_check_id;

  perform public.write_audit_event(
    'evaluation.gate_changed','USER','store_gate_check',gc.id,
    e.store_id,e.location_id,e.id,
    p_governance_policy_id => e.governance_policy_id,
    p_old_data => jsonb_build_object('status',gc.status),
    p_new_data => jsonb_build_object('status',p_status,'comment',nullif(btrim(p_comment),'')),
    p_changed_fields => array['status','comment']
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- COMPLETENESS / GOVERNANCE READINESS
-- -----------------------------------------------------------------------------

create or replace function public.evaluation_completeness(
  p_evaluation_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  v_unscored integer;
  v_item_evidence integer;
  v_pending_gates integer;
  v_gate_evidence integer;
begin
  select count(*) into v_unscored
  from public.store_evaluation_items
  where evaluation_id = p_evaluation_id and score is null;

  select count(*) into v_item_evidence
  from public.store_evaluation_items
  where evaluation_id = p_evaluation_id and evidence_status = 'PENDING';

  select count(*) into v_pending_gates
  from public.store_gate_checks
  where evaluation_id = p_evaluation_id and status = 'PENDING';

  select count(*) into v_gate_evidence
  from public.store_gate_checks
  where evaluation_id = p_evaluation_id and evidence_status = 'PENDING';

  return jsonb_build_object(
    'complete', v_unscored = 0 and v_item_evidence = 0 and v_pending_gates = 0 and v_gate_evidence = 0,
    'unscored_items', v_unscored,
    'pending_item_evidence', v_item_evidence,
    'pending_gates', v_pending_gates,
    'pending_gate_evidence', v_gate_evidence
  );
end;
$$;

create or replace function public.governance_evaluation_readiness(
  p_evaluation_id uuid,
  p_actor_user_id uuid
)
returns jsonb
language plpgsql
stable
security definer
set search_path = pg_catalog, public
as $$
declare
  e public.store_evaluations%rowtype;
  gp public.governance_policies%rowtype;
  c jsonb;
  v_complete jsonb;
  v_critical_fails integer;
  v_reviews integer;
  v_approvals integer;
  v_min_reviews integer := 0;
  v_min_approvals integer := 0;
  v_self_approval_block boolean := false;
  v_ready boolean;
begin
  select * into e from public.store_evaluations where id = p_evaluation_id;
  if not found then
    return jsonb_build_object('ready',false,'errors',jsonb_build_array('EVALUATION_NOT_FOUND'));
  end if;

  select * into gp from public.governance_policies where id = e.governance_policy_id;
  if not found or gp.status not in ('ACTIVE','RETIRED') then
    return jsonb_build_object('ready',false,'errors',jsonb_build_array('BOUND_GOVERNANCE_POLICY_INVALID'));
  end if;
  c := gp.configuration;
  v_complete := public.evaluation_completeness(p_evaluation_id);

  select count(*) into v_critical_fails
  from public.store_gate_checks gc
  join public.evaluation_gate_catalog g on g.id = gc.gate_id
  where gc.evaluation_id = p_evaluation_id
    and g.is_critical = true
    and gc.status = 'FAIL';

  select count(*), count(*) filter (where decision = 'APPROVE')
  into v_reviews, v_approvals
  from public.store_evaluation_reviews
  where evaluation_id = p_evaluation_id
    and review_round = e.current_review_round;

  if coalesce((c->>'partner_review_required')::boolean,false) then
    v_min_reviews := coalesce((c->>'minimum_partner_reviews')::integer,0);
    v_min_approvals := coalesce((c->>'minimum_partner_approvals')::integer,0);
  end if;

  if not coalesce((c->>'allow_self_approval')::boolean,false)
     and p_actor_user_id is not null
     and p_actor_user_id in (e.created_by, e.started_by, e.submitted_by) then
    v_self_approval_block := true;
  end if;

  v_ready :=
    coalesce((v_complete->>'complete')::boolean,false)
    and (not coalesce((c->>'critical_gate_failure_blocks_approval')::boolean,true) or v_critical_fails = 0)
    and (not coalesce((c->>'partner_review_required')::boolean,false)
         or (v_reviews >= v_min_reviews and v_approvals >= v_min_approvals))
    and not v_self_approval_block;

  return jsonb_build_object(
    'ready', v_ready,
    'completeness', v_complete,
    'critical_gate_failures', v_critical_fails,
    'partner_reviews', v_reviews,
    'partner_approvals', v_approvals,
    'minimum_partner_reviews', v_min_reviews,
    'minimum_partner_approvals', v_min_approvals,
    'self_approval_blocked', v_self_approval_block,
    'policy_id', gp.id,
    'policy_code', gp.code,
    'policy_version', gp.version
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- SUBMIT EVALUATION
-- -----------------------------------------------------------------------------

create or replace function public.submit_store_evaluation(
  p_evaluation_id uuid
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  e public.store_evaluations%rowtype;
  v_complete jsonb;
  v_total numeric(6,2);
  v_classification public.store_classification;
  v_recommendation public.store_recommendation;
begin
  v_actor := public.assert_platform_permission('evaluation.submit');
  select * into e from public.store_evaluations where id = p_evaluation_id for update;
  if not found then raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_FOUND'; end if;
  if e.status <> 'IN_PROGRESS' then raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_IN_PROGRESS'; end if;

  v_complete := public.evaluation_completeness(p_evaluation_id);
  if coalesce((v_complete->>'complete')::boolean,false) = false then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_INCOMPLETE', detail=v_complete::text;
  end if;

  select round(sum(weighted_score),2)
  into v_total
  from public.store_evaluation_items
  where evaluation_id = p_evaluation_id;

  v_classification := public.derive_evaluation_classification(e.methodology_id, v_total);

  -- This call deliberately blocks until the recommendation matrix is approved.
  v_recommendation := public.derive_system_recommendation(p_evaluation_id);

  update public.store_evaluations
  set total_score = v_total,
      classification = v_classification,
      system_recommendation = v_recommendation,
      status = 'SUBMITTED',
      submitted_by = v_actor,
      submitted_at = now(),
      updated_at = now()
  where id = p_evaluation_id;

  perform public.write_audit_event(
    'evaluation.submitted','USER','store_evaluation',e.id,e.store_id,e.location_id,e.id,
    p_governance_policy_id => e.governance_policy_id,
    p_old_data => jsonb_build_object('status',e.status),
    p_new_data => jsonb_build_object(
      'status','SUBMITTED','total_score',v_total,
      'classification',v_classification,'system_recommendation',v_recommendation
    )
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- PARTNER REVIEW
-- -----------------------------------------------------------------------------

create or replace function public.submit_partner_review(
  p_evaluation_id uuid,
  p_decision public.store_review_decision,
  p_comment text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  e public.store_evaluations%rowtype;
begin
  v_actor := public.assert_platform_permission('evaluation.review');
  select * into e from public.store_evaluations where id = p_evaluation_id for update;
  if not found then raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_FOUND'; end if;
  if e.status not in ('SUBMITTED','PARTNER_REVIEW') then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_REVIEWABLE';
  end if;

  if p_decision in ('REJECT','REQUEST_CHANGES') and (p_comment is null or btrim(p_comment)='') then
    raise exception using errcode='P0001', message='WT03B_REVIEW_COMMENT_REQUIRED';
  end if;

  insert into public.store_evaluation_reviews(
    evaluation_id, reviewer_user_id, decision, comment, review_round
  ) values (
    p_evaluation_id, v_actor, p_decision, nullif(btrim(p_comment),''), e.current_review_round
  );

  if p_decision = 'REQUEST_CHANGES' then
    update public.store_evaluations
    set status = 'IN_PROGRESS',
        current_review_round = current_review_round + 1,
        total_score = null,
        classification = null,
        system_recommendation = null,
        submitted_by = null,
        submitted_at = null,
        updated_at = now()
    where id = p_evaluation_id;
  else
    update public.store_evaluations
    set status = 'PARTNER_REVIEW', updated_at = now()
    where id = p_evaluation_id and status = 'SUBMITTED';
  end if;

  perform public.write_audit_event(
    'evaluation.partner_review_submitted','USER','store_evaluation',e.id,e.store_id,e.location_id,e.id,
    p_governance_policy_id => e.governance_policy_id,
    p_new_data => jsonb_build_object('decision',p_decision,'review_round',e.current_review_round)
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- FINALIZE EVALUATION
-- -----------------------------------------------------------------------------

create or replace function public.finalize_store_evaluation(
  p_evaluation_id uuid,
  p_decision public.store_final_decision,
  p_notes text default null
)
returns void
language plpgsql
volatile
security definer
set search_path = pg_catalog, public
as $$
declare
  v_actor uuid;
  e public.store_evaluations%rowtype;
  v_readiness jsonb;
  v_correlation uuid := gen_random_uuid();
begin
  v_actor := public.assert_platform_permission('evaluation.finalize');

  if p_decision = 'PENDING' then
    raise exception using errcode='P0001', message='WT03B_FINAL_DECISION_REQUIRED';
  end if;

  select * into e from public.store_evaluations where id = p_evaluation_id for update;
  if not found then raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_FOUND'; end if;
  if e.status not in ('PARTNER_REVIEW','FINAL_REVIEW') then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_FINALIZABLE';
  end if;
  if e.final_decision <> 'PENDING' then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_ALREADY_FINALIZED';
  end if;

  v_readiness := public.governance_evaluation_readiness(p_evaluation_id, v_actor);

  if p_decision = 'APPROVED'
     and coalesce((v_readiness->>'ready')::boolean,false) = false then
    raise exception using
      errcode='P0001', message='WT03B_GOVERNANCE_BLOCKED', detail=v_readiness::text;
  end if;

  update public.store_evaluations
  set status = case when p_decision = 'APPROVED' then 'APPROVED' else 'REJECTED' end,
      final_decision = p_decision,
      final_decision_by = v_actor,
      final_decision_at = now(),
      final_decision_notes = nullif(btrim(p_notes),''),
      updated_at = now()
  where id = p_evaluation_id;

  if p_decision = 'APPROVED' and e.location_id is not null then
    update public.commercial_store_locations
    set current_evaluation_id = e.id,
        current_qualification_score = e.total_score,
        current_classification = e.classification,
        qualification_updated_at = now(),
        updated_at = now()
    where id = e.location_id and store_id = e.store_id;
  end if;

  if p_decision = 'APPROVED' then
    update public.commercial_stores
    set status = case
          when status in ('CANDIDATE','UNDER_REVIEW') then 'APPROVED'
          else status
        end,
        approved_by = case
          when status in ('CANDIDATE','UNDER_REVIEW') then v_actor
          else approved_by
        end,
        approved_at = case
          when status in ('CANDIDATE','UNDER_REVIEW') then now()
          else approved_at
        end,
        updated_at = now()
    where id = e.store_id;
  end if;

  perform public.write_audit_event(
    'evaluation.finalized','USER','store_evaluation',e.id,e.store_id,e.location_id,e.id,
    p_governance_policy_id => e.governance_policy_id,
    p_correlation_id => v_correlation,
    p_old_data => jsonb_build_object('status',e.status,'final_decision',e.final_decision),
    p_new_data => jsonb_build_object('final_decision',p_decision,'finalized_by',v_actor),
    p_reason => nullif(btrim(p_notes),'')
  );
end;
$$;

-- -----------------------------------------------------------------------------
-- SECURITY DEFINER HARDENING / EXECUTION BOUNDARY
-- -----------------------------------------------------------------------------
-- RLS/grants are finalized in 03B-011. At that point direct table mutation is
-- denied to ordinary clients and EXECUTE is granted only on intended RPCs.
--
-- SECURITY DEFINER rules used here:
--   * fixed search_path = pg_catalog, public;
--   * actor derived from auth.uid();
--   * caller-supplied actor identity is never trusted;
--   * critical rows locked with FOR UPDATE before mutation;
--   * semantic WT03B_* error codes are returned through exception messages;
--   * business mutation and audit share one PostgreSQL transaction.
--
-- Commands intentionally still blocked by unapproved configuration:
--   * submit_store_evaluation() cannot complete until an approved system
--     recommendation matrix replaces derive_system_recommendation() stub;
--   * governance activation cannot complete until partner quorum is explicitly
--     configured;
--   * permission/audit catalogs and role maps are seeded only after V1 matrices
--     are approved.
--
-- This is a safety feature, not unfinished silent behavior: unknown business
-- policy causes a loud configuration error rather than an invented decision.

commit;
