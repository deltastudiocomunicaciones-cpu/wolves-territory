-- PORTFOLIO-03 / REVIEW DRAFT ONLY — DO NOT EXECUTE WITHOUT APPROVAL
-- Target: public schema; real project hzhvgjvabhkaxivlrhfl
-- Designed for transactional application after review. No real DB changes made.
BEGIN;
-- Preflight: fail closed on missing baseline
DO $preflight$
BEGIN
 IF to_regclass('public.expansion_prospects') IS NULL
 OR to_regclass('public.platform_permissions') IS NULL
 OR to_regclass('public.platform_role_permissions') IS NULL
 OR to_regclass('public.audit_event_types') IS NULL
 OR to_regprocedure('public.has_platform_permission(text)') IS NULL
 OR to_regprocedure('public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)') IS NULL
 THEN RAISE EXCEPTION 'PORTFOLIO-03 baseline missing; abort'; END IF;
END $preflight$;

-- New permission catalogue entries. Do not modify existing grants.
INSERT INTO public.platform_permissions(code,name,description,active)
SELECT v.code,v.name,v.description,true FROM (VALUES
 ('EXPANSION_PROSPECT_EDIT','Editar expediente de prospecto','Modificar exclusivamente contacto y ubicación del prospecto'),
 ('EXPANSION_PROSPECT_STATUS_CHANGE','Cambiar estado de prospecto','Registrar una transición de estado comercial')
) AS v(code,name,description)
WHERE NOT EXISTS (SELECT 1 FROM public.platform_permissions p WHERE p.code=v.code);

-- Role grants: SUPER_ADMIN global, EXPANSION only own assigned.
INSERT INTO public.platform_role_permissions(role_code,permission_id,active)
SELECT roles.role_code,p.id,true
FROM (VALUES ('SUPER_ADMIN'),('EXPANSION')) roles(role_code)
JOIN public.platform_permissions p ON p.code IN ('EXPANSION_PROSPECT_EDIT','EXPANSION_PROSPECT_STATUS_CHANGE')
WHERE NOT EXISTS (
 SELECT 1 FROM public.platform_role_permissions x
 WHERE x.role_code=roles.role_code AND x.permission_id=p.id
);

-- Audit vocabulary (must exist before any RPC mutation).
INSERT INTO public.audit_event_types(domain_code,code,name,description,active,display_order)
SELECT 'EXPANSION',v.code,v.name,v.description,true,v.ord
FROM (VALUES
 ('PROSPECT_DETAILS_UPDATED','Prospecto: datos actualizados','Cambio de contacto o ubicación',20),
 ('PROSPECT_STATUS_CHANGED','Prospecto: estado actualizado','Cambio de estado comercial',30)
) v(code,name,description,ord)
WHERE NOT EXISTS (
 SELECT 1 FROM public.audit_event_types e
 WHERE e.domain_code='EXPANSION' AND e.code=v.code
);

-- Read one dossier, using the same row-scope semantics as list_expansion_prospects.
CREATE OR REPLACE FUNCTION public.get_expansion_prospect(p_prospect_id uuid)
RETURNS SETOF public.expansion_prospects
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $fn$
DECLARE v_auth uuid; v_admin uuid; v_all boolean;
BEGIN
 v_auth := auth.uid();
 IF v_auth IS NULL OR public.has_platform_permission('EXPANSION_PROSPECT_VIEW') IS NOT TRUE
 THEN RAISE EXCEPTION 'EXPANSION_PROSPECT_VIEW permission required' USING ERRCODE='42501'; END IF;
 SELECT id INTO v_admin FROM public.admin_users
 WHERE auth_user_id=v_auth AND active IS TRUE;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Active administrative identity required' USING ERRCODE='42501'; END IF;
 v_all := public.has_platform_permission('EXPANSION_PROSPECT_VIEW_ALL') IS TRUE;
 RETURN QUERY SELECT ep.* FROM public.expansion_prospects ep
 WHERE ep.id=p_prospect_id AND (v_all OR ep.assigned_to=v_admin);
END $fn$;

-- NULL is an explicit clear for each optional field. UI must submit the full editable snapshot.
CREATE OR REPLACE FUNCTION public.update_expansion_prospect_details(
 p_prospect_id uuid, p_contact_name text, p_contact_phone text,
 p_contact_email text, p_department text, p_city text, p_reason text
)
RETURNS TABLE(prospect_id uuid, correlation_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $fn$
DECLARE v_auth uuid;v_admin uuid;v_all boolean;v_before public.expansion_prospects%ROWTYPE;
 v_after public.expansion_prospects%ROWTYPE;v_corr uuid;v_reason text;
BEGIN
 v_auth:=auth.uid();
 IF v_auth IS NULL OR public.has_platform_permission('EXPANSION_PROSPECT_EDIT') IS NOT TRUE
 THEN RAISE EXCEPTION 'EXPANSION_PROSPECT_EDIT permission required' USING ERRCODE='42501'; END IF;
 SELECT id INTO v_admin FROM public.admin_users WHERE auth_user_id=v_auth AND active IS TRUE;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Active administrative identity required' USING ERRCODE='42501'; END IF;
 v_all:=public.has_platform_permission('EXPANSION_PROSPECT_VIEW_ALL') IS TRUE;
 v_reason:=nullif(pg_catalog.btrim(p_reason),'');
 IF p_prospect_id IS NULL OR v_reason IS NULL OR pg_catalog.length(v_reason)>500
 OR pg_catalog.length(pg_catalog.coalesce(p_contact_name,''))>200
 OR pg_catalog.length(pg_catalog.coalesce(p_contact_phone,''))>40
 OR pg_catalog.length(pg_catalog.coalesce(p_contact_email,''))>254
 OR pg_catalog.length(pg_catalog.coalesce(p_department,''))>120
 OR pg_catalog.length(pg_catalog.coalesce(p_city,''))>120
 THEN RAISE EXCEPTION 'Invalid prospect update parameters' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_before FROM public.expansion_prospects ep
 WHERE ep.id=p_prospect_id AND (v_all OR ep.assigned_to=v_admin) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Prospect not found or inaccessible' USING ERRCODE='42501'; END IF;
 UPDATE public.expansion_prospects ep SET
 contact_name=nullif(pg_catalog.btrim(p_contact_name),''),
 contact_phone=nullif(pg_catalog.btrim(p_contact_phone),''),
 contact_email=nullif(pg_catalog.lower(pg_catalog.btrim(p_contact_email)),''),
 department=nullif(pg_catalog.btrim(p_department),''),
 city=nullif(pg_catalog.btrim(p_city),''),
 updated_at=now()
 WHERE ep.id=p_prospect_id RETURNING * INTO v_after;
 v_corr:=pg_catalog.gen_random_uuid();
 PERFORM public.record_platform_audit_event(
 'EXPANSION','PROSPECT_DETAILS_UPDATED','EXPANSION_PROSPECT',p_prospect_id,
 'USER',v_auth,'ADMIN_API',v_corr,v_reason,
 pg_catalog.jsonb_build_object('contact_name',v_before.contact_name,'contact_phone',v_before.contact_phone,'contact_email',v_before.contact_email,'department',v_before.department,'city',v_before.city),
 pg_catalog.jsonb_build_object('contact_name',v_after.contact_name,'contact_phone',v_after.contact_phone,'contact_email',v_after.contact_email,'department',v_after.department,'city',v_after.city),
 pg_catalog.jsonb_build_object('operation','UPDATE_EXPANSION_PROSPECT_DETAILS'));
 RETURN QUERY SELECT p_prospect_id,v_corr;
END $fn$;

-- Conservative transition policy: CLOSED is terminal pending business decision.
CREATE OR REPLACE FUNCTION public.change_expansion_prospect_status(
 p_prospect_id uuid,p_expected_status text,p_new_status text,p_reason text
)
RETURNS TABLE(prospect_id uuid, correlation_id uuid)
LANGUAGE plpgsql SECURITY DEFINER SET search_path = pg_catalog
AS $fn$
DECLARE v_auth uuid;v_admin uuid;v_all boolean;v_before public.expansion_prospects%ROWTYPE;
 v_after public.expansion_prospects%ROWTYPE;v_corr uuid;v_reason text;v_new text;v_expected text;
BEGIN
 v_auth:=auth.uid();
 IF v_auth IS NULL OR public.has_platform_permission('EXPANSION_PROSPECT_STATUS_CHANGE') IS NOT TRUE
 THEN RAISE EXCEPTION 'EXPANSION_PROSPECT_STATUS_CHANGE permission required' USING ERRCODE='42501'; END IF;
 SELECT id INTO v_admin FROM public.admin_users WHERE auth_user_id=v_auth AND active IS TRUE;
 IF v_admin IS NULL THEN RAISE EXCEPTION 'Active administrative identity required' USING ERRCODE='42501'; END IF;
 v_all:=public.has_platform_permission('EXPANSION_PROSPECT_VIEW_ALL') IS TRUE;
 v_reason:=nullif(pg_catalog.btrim(p_reason),'');
 v_new:=pg_catalog.upper(pg_catalog.btrim(p_new_status));
 v_expected:=pg_catalog.upper(pg_catalog.btrim(p_expected_status));
 IF p_prospect_id IS NULL OR v_reason IS NULL OR pg_catalog.length(v_reason)>500
 OR v_new IS NULL OR v_new NOT IN ('IDENTIFIED','CONTACTED','IN_CONVERSATION','PAUSED','CLOSED')
 OR v_expected IS NULL OR v_expected NOT IN ('IDENTIFIED','CONTACTED','IN_CONVERSATION','PAUSED','CLOSED')
 THEN RAISE EXCEPTION 'Invalid status change parameters' USING ERRCODE='22023'; END IF;
 SELECT * INTO v_before FROM public.expansion_prospects ep
 WHERE ep.id=p_prospect_id AND (v_all OR ep.assigned_to=v_admin) FOR UPDATE;
 IF NOT FOUND THEN RAISE EXCEPTION 'Prospect not found or inaccessible' USING ERRCODE='42501'; END IF;
 IF v_before.commercial_status<>v_expected
 THEN RAISE EXCEPTION 'Concurrent status change detected' USING ERRCODE='40001'; END IF;
 IF v_before.commercial_status='CLOSED' OR v_before.commercial_status=v_new
 THEN RAISE EXCEPTION 'Status transition not permitted' USING ERRCODE='22023'; END IF;
 UPDATE public.expansion_prospects ep
 SET commercial_status=v_new,updated_at=now()
 WHERE ep.id=p_prospect_id RETURNING * INTO v_after;
 v_corr:=pg_catalog.gen_random_uuid();
 PERFORM public.record_platform_audit_event(
 'EXPANSION','PROSPECT_STATUS_CHANGED','EXPANSION_PROSPECT',p_prospect_id,
 'USER',v_auth,'ADMIN_API',v_corr,v_reason,
 pg_catalog.jsonb_build_object('commercial_status',v_before.commercial_status),
 pg_catalog.jsonb_build_object('commercial_status',v_after.commercial_status),
 pg_catalog.jsonb_build_object('operation','CHANGE_EXPANSION_PROSPECT_STATUS'));
 RETURN QUERY SELECT p_prospect_id,v_corr;
END $fn$;

-- No implicit public/anon EXECUTE, even with Supabase default privileges.
REVOKE ALL ON FUNCTION public.get_expansion_prospect(uuid) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.update_expansion_prospect_details(uuid,text,text,text,text,text,text) FROM PUBLIC,anon,authenticated;
REVOKE ALL ON FUNCTION public.change_expansion_prospect_status(uuid,text,text,text) FROM PUBLIC,anon,authenticated;
GRANT EXECUTE ON FUNCTION public.get_expansion_prospect(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_expansion_prospect_details(uuid,text,text,text,text,text,text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.change_expansion_prospect_status(uuid,text,text,text) TO authenticated;
COMMIT;

-- REVIEW GATES before execution:
-- 1. Confirm permitted transitions, especially CLOSED/reopen.
-- 2. Confirm NULL clear semantics and whether contact PII belongs in audit_events.
-- 3. Check audit event catalog uniqueness and permission grant indexes.
-- 4. Check role matrix, RLS, grants, function ownership and SECURITY DEFINER advisory.
-- 5. Run permission denial tests, concurrent status test, audit rollback test,
--    immutable attribution test, and authenticated preview UI tests.
