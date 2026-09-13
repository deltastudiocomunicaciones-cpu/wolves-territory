-- 03B Commercial Platform
-- Patch: 03B-011A Function execution hardening
--
-- PostgreSQL grants EXECUTE on newly-created functions to PUBLIC by default.
-- SECURITY DEFINER is therefore not a security boundary by itself.
-- This migration explicitly closes internal helpers and exposes only the
-- authenticated business-command RPC surface intended for V1.

begin;

-- -----------------------------------------------------------------------------
-- INTERNAL HELPERS — NEVER DIRECT CLIENT RPCS
-- -----------------------------------------------------------------------------

revoke all on function public.require_authenticated_actor() from public;
revoke all on function public.has_platform_permission(uuid, text) from public;
revoke all on function public.has_store_permission(uuid, uuid, uuid, text) from public;
revoke all on function public.assert_platform_permission(text) from public;

revoke all on function public.write_audit_event(
  text,
  public.audit_actor_type,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  public.audit_event_outcome,
  text,
  jsonb,
  jsonb,
  text[],
  uuid,
  uuid,
  text,
  text,
  jsonb,
  uuid
) from public;

revoke all on function public.validate_evaluation_methodology(uuid) from public;
revoke all on function public.validate_governance_policy(uuid) from public;
revoke all on function public.derive_evaluation_classification(uuid, numeric) from public;
revoke all on function public.derive_system_recommendation(uuid) from public;
revoke all on function public.evaluation_completeness(uuid) from public;
revoke all on function public.governance_evaluation_readiness(uuid, uuid) from public;

-- Defense in depth for Supabase's standard API roles.
revoke all on function public.require_authenticated_actor() from anon, authenticated;
revoke all on function public.has_platform_permission(uuid, text) from anon, authenticated;
revoke all on function public.has_store_permission(uuid, uuid, uuid, text) from anon, authenticated;
revoke all on function public.assert_platform_permission(text) from anon, authenticated;
revoke all on function public.write_audit_event(
  text,
  public.audit_actor_type,
  text,
  uuid,
  uuid,
  uuid,
  uuid,
  public.audit_event_outcome,
  text,
  jsonb,
  jsonb,
  text[],
  uuid,
  uuid,
  text,
  text,
  jsonb,
  uuid
) from anon, authenticated;
revoke all on function public.validate_evaluation_methodology(uuid) from anon, authenticated;
revoke all on function public.validate_governance_policy(uuid) from anon, authenticated;
revoke all on function public.derive_evaluation_classification(uuid, numeric) from anon, authenticated;
revoke all on function public.derive_system_recommendation(uuid) from anon, authenticated;
revoke all on function public.evaluation_completeness(uuid) from anon, authenticated;
revoke all on function public.governance_evaluation_readiness(uuid, uuid) from anon, authenticated;

-- -----------------------------------------------------------------------------
-- USER-FACING COMMAND RPC SURFACE
-- -----------------------------------------------------------------------------
-- Authentication alone never authorizes the action: each command still derives
-- auth.uid() and resolves platform permission / governance internally.

revoke all on function public.activate_evaluation_methodology(uuid) from public, anon;
grant execute on function public.activate_evaluation_methodology(uuid) to authenticated;

revoke all on function public.activate_governance_policy(uuid) from public, anon;
grant execute on function public.activate_governance_policy(uuid) to authenticated;

revoke all on function public.create_store_evaluation(uuid, uuid, uuid, uuid) from public, anon;
grant execute on function public.create_store_evaluation(uuid, uuid, uuid, uuid) to authenticated;

revoke all on function public.start_store_evaluation(uuid) from public, anon;
grant execute on function public.start_store_evaluation(uuid) to authenticated;

revoke all on function public.score_evaluation_item(uuid, smallint, text) from public, anon;
grant execute on function public.score_evaluation_item(uuid, smallint, text) to authenticated;

revoke all on function public.set_gate_status(uuid, public.store_gate_status, text) from public, anon;
grant execute on function public.set_gate_status(uuid, public.store_gate_status, text) to authenticated;

revoke all on function public.submit_store_evaluation(uuid) from public, anon;
grant execute on function public.submit_store_evaluation(uuid) to authenticated;

revoke all on function public.submit_partner_review(uuid, public.store_review_decision, text) from public, anon;
grant execute on function public.submit_partner_review(uuid, public.store_review_decision, text) to authenticated;

revoke all on function public.finalize_store_evaluation(uuid, public.store_final_decision, text) from public, anon;
grant execute on function public.finalize_store_evaluation(uuid, public.store_final_decision, text) to authenticated;

commit;
