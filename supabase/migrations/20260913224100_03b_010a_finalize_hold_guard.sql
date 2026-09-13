-- 03B Commercial Platform
-- Patch: 03B-010A Finalization HOLD guard
--
-- HOLD is architecturally allowed as a governance outcome, but its resume/review
-- semantics are not yet frozen. The command layer must not silently translate
-- HOLD into REJECTED or another workflow state. Until that lifecycle is approved,
-- finalization accepts only APPROVED or REJECTED.

begin;

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

  if p_decision = 'HOLD' then
    raise exception using
      errcode='P0001',
      message='WT03B_HOLD_LIFECYCLE_NOT_CONFIGURED';
  end if;

  if p_decision not in ('APPROVED','REJECTED') then
    raise exception using errcode='P0001', message='WT03B_FINAL_DECISION_UNSUPPORTED';
  end if;

  select * into e
  from public.store_evaluations
  where id = p_evaluation_id
  for update;

  if not found then
    raise exception using errcode='P0001', message='WT03B_EVALUATION_NOT_FOUND';
  end if;
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

commit;
