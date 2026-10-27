-- PORTFOLIO-02 / REVIEW DRAFT ONLY — DO NOT EXECUTE WITHOUT APPROVAL
-- Existing production-like Supabase project: hzhvgjvabhkaxivlrhfl
-- This file is deliberately NOT placed under supabase/migrations.
-- Assumptions: public.has_platform_permission, public.record_platform_audit_event,
-- public.admin_users, public.expansion_prospects already exist.
-- SECURITY: no direct table grants, authenticated RPC only, strict auth checks.
BEGIN;

DO $preflight$
BEGIN
  IF to_regclass('public.expansion_prospects') IS NULL
     OR to_regclass('public.platform_permissions') IS NULL
     OR to_regclass('public.platform_role_permissions') IS NULL
     OR to_regclass('public.audit_event_types') IS NULL
     OR to_regclass('public.admin_users') IS NULL
     OR to_regprocedure('public.has_platform_permission(text)') IS NULL
     OR to_regprocedure('public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)') IS NULL
  THEN RAISE EXCEPTION 'PORTFOLIO-02 missing prerequisite'; END IF;
END;
$preflight$;

INSERT INTO public.platform_permissions(code,name,description,active)
VALUES
 ('EXPANSION_PROSPECT_EDIT','Editar prospecto','Actualizar contacto y ubicación del prospecto asignado',true),
 ('EXPANSION_PROSPECT_STATUS_CHANGE','Cambiar estado comercial','Actualizar estado comercial con razón y control de concurrencia',true)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.platform_role_permissions(role_code,permission_id,active)
SELECT r.role_code,p.id,true
FROM (VALUES ('SUPER_ADMIN'),('EXPANSION')) r(role_code)
JOIN public.platform_permissions p
 ON p.code IN ('EXPANSION_PROSPECT_EDIT','EXPANSION_PROSPECT_STATUS_CHANGE')
ON CONFLICT (role_code,permission_id) DO NOTHING;

INSERT INTO public.audit_event_types(domain_code,code,name,description,active,display_order)
VALUES
 ('EXPANSION','PROSPECT_DETAILS_UPDATED','Datos de prospecto actualizados','Actualización controlada de contacto y ubicación',true,20),
 ('EXPANSION','PROSPECT_STATUS_CHANGED','Estado de prospecto actualizado','Transición comercial con justificación',true,30)
ON CONFLICT (domain_code,code) DO NOTHING;

-- Read-only detail: authorization checked in database, not client.
CREATE OR REPLACE FUNCTION public.get_expansion_prospect(p_prospect_id uuid)
RETURNS TABLE (
 id uuid,trade_name text,prospect_type text,contact_name text,
 contact_phone text,contact_email text,country_code text,
 department text,city text,commercial_status text,
 originated_by uuid,created_by uuid,assigned_to uuid,
 created_at timestamptz,updated_at timestamptz
)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $fn$
DECLARE v_admin uuid;v_auth uuid;
BEGIN
 v_auth:=auth.uid();
 IF v_auth IS NULL OR p_prospect_id IS NULL
    OR public.has_platform_permission('EXPANSION_PROSPECT_VIEW') IS NOT TRUE
 THEN RAISE EXCEPTION 'Prospect view not permitted' USING ERRCODE='42501'; END IF;
 SELECT au.id INTO v_admin FROM public.admin_users au
 WHERE au.auth_user_id=v_auth AND au.active IS TRUE;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Active admin required' USING ERRCODE='42501'; END IF;
 RETURN QUERY SELECT ep.id,ep.trade_name,ep.prospect_type,ep.contact_name,
 ep.contact_phone,ep.contact_email,ep.country_code,ep.department,ep.city,
 ep.commercial_status,ep.originated_by,ep.created_by,ep.assigned_to,
 ep.created_at,ep.updated_at FROM public.expansion_prospects ep
 WHERE ep.id=p_prospect_id
 AND (ep.assigned_to=v_admin OR public.has_platform_permission('EXPANSION_PROSPECT_VIEW_ALL') IS TRUE);
END;$fn$;

-- NULL means clear the optional field. All five values are full replacement.
-- Caller must explicitly supply every value; reason required.
CREATE OR REPLACE FUNCTION public.update_expansion_prospect_details(
 p_prospect_id uuid,p_contact_name text,p_contact_phone text,
 p_contact_email text,p_department text,p_city text,p_reason text)
RETURNS TABLE(prospect_id uuid,correlation_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $fn$
DECLARE v_auth uuid;v_admin uuid;v_old public.expansion_prospects%ROWTYPE;
v_new public.expansion_prospects%ROWTYPE;v_corr uuid;
v_name text;v_phone text;v_email text;v_department text;v_city text;
BEGIN
 v_auth:=auth.uid();
 IF v_auth IS NULL OR public.has_platform_permission('EXPANSION_PROSPECT_EDIT') IS NOT TRUE
 THEN RAISE EXCEPTION 'Prospect edit not permitted' USING ERRCODE='42501'; END IF;
 IF p_prospect_id IS NULL OR NULLIF(pg_catalog.btrim(p_reason),'') IS NULL
    OR pg_catalog.length(p_reason)>1000
 THEN RAISE EXCEPTION 'Invalid prospect or reason' USING ERRCODE='22023'; END IF;
 SELECT au.id INTO v_admin FROM public.admin_users au
 WHERE au.auth_user_id=v_auth AND au.active IS TRUE;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Active admin required' USING ERRCODE='42501'; END IF;
 v_name:=NULLIF(pg_catalog.btrim(p_contact_name),'');
 v_phone:=NULLIF(pg_catalog.btrim(p_contact_phone),'');
 v_email:=NULLIF(pg_catalog.lower(pg_catalog.btrim(p_contact_email)),'');
 v_department:=NULLIF(pg_catalog.btrim(p_department),'');
 v_city:=NULLIF(pg_catalog.btrim(p_city),'');
 IF pg_catalog.length(pg_catalog.coalesce(v_name,''))>200
 OR pg_catalog.length(pg_catalog.coalesce(v_phone,''))>40
 OR pg_catalog.length(pg_catalog.coalesce(v_email,''))>254
 OR pg_catalog.length(pg_catalog.coalesce(v_department,''))>120
 OR pg_catalog.length(pg_catalog.coalesce(v_city,''))>120
 THEN RAISE EXCEPTION 'Field too long' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_old FROM public.expansion_prospects ep
 WHERE ep.id=p_prospect_id FOR UPDATE;
 IF NOT FOUND OR NOT (
 v_old.assigned_to=v_admin
 OR public.has_platform_permission('EXPANSION_PROSPECT_VIEW_ALL') IS TRUE)
 THEN RAISE EXCEPTION 'Prospect not accessible' USING ERRCODE='42501'; END IF;
 IF (v_old.contact_name,v_old.contact_phone,v_old.contact_email,v_old.department,v_old.city)
 IS NOT DISTINCT FROM (v_name,v_phone,v_email,v_department,v_city)
 THEN RAISE EXCEPTION 'No changes to save' USING ERRCODE='22023'; END IF;
 UPDATE public.expansion_prospects ep SET contact_name=v_name,
 contact_phone=v_phone,contact_email=v_email,department=v_department,
 city=v_city,updated_at=pg_catalog.now()
 WHERE ep.id=p_prospect_id RETURNING * INTO v_new;
 v_corr:=pg_catalog.gen_random_uuid();
 -- Avoid duplicating contact PII in audit payload; track changed field names.
 PERFORM public.record_platform_audit_event(
 'EXPANSION','PROSPECT_DETAILS_UPDATED','EXPANSION_PROSPECT',v_new.id,
 'USER',v_auth,'ADMIN_API',v_corr,p_reason,
 pg_catalog.jsonb_build_object('updated_at',v_old.updated_at),
 pg_catalog.jsonb_build_object('updated_at',v_new.updated_at),
 pg_catalog.jsonb_build_object('changed_fields',
 pg_catalog.array_remove(ARRAY[
 CASE WHEN v_old.contact_name IS DISTINCT FROM v_new.contact_name THEN 'contact_name' END,
 CASE WHEN v_old.contact_phone IS DISTINCT FROM v_new.contact_phone THEN 'contact_phone' END,
 CASE WHEN v_old.contact_email IS DISTINCT FROM v_new.contact_email THEN 'contact_email' END,
 CASE WHEN v_old.department IS DISTINCT FROM v_new.department THEN 'department' END,
 CASE WHEN v_old.city IS DISTINCT FROM v_new.city THEN 'city' END],NULL)));
 RETURN QUERY SELECT v_new.id,v_corr;
END;$fn$;

-- Optimistic concurrency: caller supplies the state observed in the UI.
-- Reopening CLOSED and other transition policy require separate functional approval.
CREATE OR REPLACE FUNCTION public.change_expansion_prospect_status(
 p_prospect_id uuid,p_expected_status text,p_new_status text,p_reason text)
RETURNS TABLE(prospect_id uuid,correlation_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'pg_catalog'
AS $fn$
DECLARE v_auth uuid;v_admin uuid;v_old public.expansion_prospects%ROWTYPE;
v_new public.expansion_prospects%ROWTYPE;v_corr uuid;v_target text;
BEGIN
 v_auth:=auth.uid();
 IF v_auth IS NULL OR public.has_platform_permission('EXPANSION_PROSPECT_STATUS_CHANGE') IS NOT TRUE
 THEN RAISE EXCEPTION 'Status change not permitted' USING ERRCODE='42501'; END IF;
 v_target:=pg_catalog.upper(pg_catalog.btrim(p_new_status));
 IF p_prospect_id IS NULL OR p_expected_status IS NULL
 OR v_target NOT IN ('IDENTIFIED','CONTACTED','IN_CONVERSATION','PAUSED','CLOSED')
 OR NULLIF(pg_catalog.btrim(p_reason),'') IS NULL
 OR pg_catalog.length(p_reason)>1000
 THEN RAISE EXCEPTION 'Invalid status change request' USING ERRCODE='22023'; END IF;
 SELECT au.id INTO v_admin FROM public.admin_users au
 WHERE au.auth_user_id=v_auth AND au.active IS TRUE;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Active admin required' USING ERRCODE='42501'; END IF;
 SELECT * INTO v_old FROM public.expansion_prospects ep
 WHERE ep.id=p_prospect_id FOR UPDATE;
 IF NOT FOUND OR NOT (
 v_old.assigned_to=v_admin
 OR public.has_platform_permission('EXPANSION_PROSPECT_VIEW_ALL') IS TRUE)
 THEN RAISE EXCEPTION 'Prospect not accessible' USING ERRCODE='42501'; END IF;
 IF v_old.commercial_status IS DISTINCT FROM p_expected_status
 THEN RAISE EXCEPTION 'Stale prospect status; refresh required' USING ERRCODE='40001'; END IF;
 IF v_target=v_old.commercial_status
 THEN RAISE EXCEPTION 'No status change' USING ERRCODE='22023'; END IF;
 IF v_old.commercial_status='CLOSED'
 THEN RAISE EXCEPTION 'Closed prospect reopening requires separate approval' USING ERRCODE='42501'; END IF;
 UPDATE public.expansion_prospects ep SET commercial_status=v_target,
 updated_at=pg_catalog.now() WHERE ep.id=p_prospect_id RETURNING * INTO v_new;
 v_corr:=pg_catalog.gen_random_uuid();
 PERFORM public.record_platform_audit_event(
 'EXPANSION','PROSPECT_STATUS_CHANGED','EXPANSION_PROSPECT',v_new.id,
 'USER',v_auth,'ADMIN_API',v_corr,p_reason,
 pg_catalog.jsonb_build_object('commercial_status',v_old.commercial_status),
 pg_catalog.jsonb_build_object('commercial_status',v_new.commercial_status),
 pg_catalog.jsonb_build_object('operation','CHANGE_EXPANSION_PROSPECT_STATUS'));
 RETURN QUERY SELECT v_new.id,v_corr;
END;$fn$;

REVOKE ALL ON FUNCTION public.get_expansion_prospect(uuid) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.update_expansion_prospect_details(uuid,text,text,text,text,text,text) FROM PUBLIC,anon;
REVOKE ALL ON FUNCTION public.change_expansion_prospect_status(uuid,text,text,text) FROM PUBLIC,anon;
GRANT EXECUTE ON FUNCTION public.get_expansion_prospect(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_expansion_prospect_details(uuid,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_expansion_prospect_status(uuid,text,text,text) TO authenticated;
COMMIT;

-- REQUIRED BEFORE EXECUTION:
-- 1. Review SECURITY DEFINER owner and RLS behavior, catalog event permissions.
-- 2. Validate grant matrix and deny-by-default tests with authenticated contexts.
-- 3. Verify audit rollback, concurrency, no-op behavior, and attribution preservation.
-- 4. Decide allowed transition graph and reopening CLOSED policy.
-- 5. Obtain explicit authorization to run against real Supabase.
