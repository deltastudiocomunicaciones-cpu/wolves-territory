-- K7-09A / 03B-016: controlled commercial-store registration.
-- REVIEW DRAFT. DO NOT EXECUTE until reconciled against the live catalog and grants.
-- The production DB already contains this event and function (manually installed).
-- Dependency: public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)
-- is present in production but its CREATE FUNCTION is not versioned in this repository.
BEGIN;

-- Preflight: fail closed if the evolved catalog is absent. This migration does NOT
-- attempt to transform the legacy 03B-009 audit tables.
DO $preflight$
BEGIN
  IF to_regclass('public.audit_event_types') IS NULL
     OR to_regclass('public.audit_events') IS NULL
     OR to_regclass('public.commercial_stores') IS NULL THEN
    RAISE EXCEPTION 'K7-09A dependency missing: commercial stores or current audit tables';
  END IF;
  IF to_regprocedure('public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)') IS NULL THEN
    RAISE EXCEPTION 'K7-09A dependency missing: record_platform_audit_event';
  END IF;
END;
$preflight$;

-- The following event columns are based on the observed live catalog summary.
-- Reconfirm column names, NOT NULL constraints and uniqueness before executing.
INSERT INTO public.audit_event_types
  (domain_code, code, name, description, active, display_order)
SELECT
  'STORE', 'STORE_CREATED', 'Cadena comercial registrada',
  'Registro inicial de una cadena comercial en estado CANDIDATE', true, 10
WHERE NOT EXISTS (
  SELECT 1 FROM public.audit_event_types
  WHERE domain_code = 'STORE' AND code = 'STORE_CREATED'
);

CREATE OR REPLACE FUNCTION public.create_commercial_store(
  p_code text,
  p_trade_name text,
  p_legal_name text DEFAULT NULL,
  p_document_type text DEFAULT NULL,
  p_document_number text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL
)
RETURNS TABLE(id uuid, code text, trade_name text, status public.commercial_store_status, correlation_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_actor uuid;
  v_code text;
  v_trade_name text;
  v_legal_name text;
  v_document_type text;
  v_document_number text;
  v_email text;
  v_phone text;
  v_correlation_id uuid;
  v_store public.commercial_stores%ROWTYPE;
BEGIN
  v_actor := auth.uid();
  IF v_actor IS NULL OR public.has_platform_permission('STORE_CREATE') IS NOT TRUE THEN
    RAISE EXCEPTION 'STORE_CREATE permission required' USING ERRCODE = '42501';
  END IF;

  v_code := upper(btrim(p_code));
  v_trade_name := btrim(p_trade_name);
  v_legal_name := NULLIF(btrim(p_legal_name), '');
  v_document_type := NULLIF(upper(btrim(p_document_type)), '');
  v_document_number := NULLIF(btrim(p_document_number), '');
  v_email := NULLIF(lower(btrim(p_email)), '');
  v_phone := NULLIF(btrim(p_phone), '');

  IF v_code IS NULL OR v_code !~ '^[A-Z][A-Z0-9_-]*$'
     OR v_trade_name IS NULL OR v_trade_name = '' THEN
    RAISE EXCEPTION 'Invalid commercial store identity' USING ERRCODE = '22023';
  END IF;
  IF (v_document_type IS NULL) <> (v_document_number IS NULL) THEN
    RAISE EXCEPTION 'Document type and number must be provided together' USING ERRCODE = '22023';
  END IF;

  v_correlation_id := gen_random_uuid();
  INSERT INTO public.commercial_stores
    (code, trade_name, legal_name, document_type, document_number, email, phone, status, created_by)
  VALUES
    (v_code, v_trade_name, v_legal_name, v_document_type, v_document_number,
     v_email, v_phone, 'CANDIDATE'::public.commercial_store_status, v_actor)
  RETURNING * INTO v_store;

  PERFORM public.record_platform_audit_event(
    'STORE', 'STORE_CREATED', 'COMMERCIAL_STORE', v_store.id,
    'USER', v_actor, 'ADMIN_API', v_correlation_id,
    'Registro inicial de cadena comercial', NULL::jsonb,
    pg_catalog.jsonb_build_object(
      'id', v_store.id, 'code', v_store.code,
      'trade_name', v_store.trade_name, 'status', v_store.status
    ),
    pg_catalog.jsonb_build_object('operation', 'CREATE_COMMERCIAL_STORE')
  );

  RETURN QUERY SELECT v_store.id, v_store.code, v_store.trade_name,
                      v_store.status, v_correlation_id;
END;
$function$;

REVOKE ALL ON FUNCTION public.create_commercial_store(text,text,text,text,text,text,text)
  FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.create_commercial_store(text,text,text,text,text,text,text)
  TO authenticated;
COMMIT;
