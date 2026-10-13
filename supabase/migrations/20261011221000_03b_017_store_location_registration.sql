-- K7-09B / 03B-017: controlled commercial-store location registration.
-- Target: observed operational schema, not the legacy 03B-003 structure.
-- Depends on K7-09A, current audit catalog and permission infrastructure.
BEGIN;

DO $preflight$
DECLARE
  v_missing text;
BEGIN
  IF to_regclass('public.commercial_store_locations') IS NULL
     OR to_regclass('public.commercial_stores') IS NULL
     OR to_regclass('public.commercial_location_types') IS NULL
     OR to_regclass('public.audit_event_types') IS NULL
     OR to_regclass('public.audit_events') IS NULL THEN
    RAISE EXCEPTION 'K7-09B: required operational tables missing';
  END IF;

  SELECT string_agg(required.column_name, ', ')
  INTO v_missing
  FROM (
    VALUES
      ('commercial_store_locations', 'id'),
      ('commercial_store_locations', 'store_id'),
      ('commercial_store_locations', 'code'),
      ('commercial_store_locations', 'name'),
      ('commercial_store_locations', 'location_type_id'),
      ('commercial_store_locations', 'address'),
      ('commercial_store_locations', 'city'),
      ('commercial_store_locations', 'department'),
      ('commercial_store_locations', 'country_code'),
      ('commercial_store_locations', 'is_primary'),
      ('commercial_store_locations', 'active'),
      ('commercial_stores', 'id'),
      ('commercial_stores', 'status'),
      ('commercial_location_types', 'id'),
      ('commercial_location_types', 'active')
  ) AS required(table_name, column_name)
  WHERE NOT EXISTS (
    SELECT 1
    FROM information_schema.columns AS c
    WHERE c.table_schema = 'public'
      AND c.table_name = required.table_name
      AND c.column_name = required.column_name
  );

  IF v_missing IS NOT NULL THEN
    RAISE EXCEPTION 'K7-09B: incompatible operational schema; missing columns: %',
      v_missing;
  END IF;

  IF to_regprocedure('public.has_platform_permission(text)') IS NULL
     OR to_regprocedure(
       'public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)'
     ) IS NULL THEN
    RAISE EXCEPTION 'K7-09B: security or audit function missing';
  END IF;
END;
$preflight$;

-- NEXT: R01 index, event catalog, controlled registration function and grants.

-- ============================================================
-- K7-09B / R01: ONE PRIMARY LOCATION PER COMMERCIAL STORE
-- Applies regardless of the location's active flag.
-- ============================================================

-- Fail closed if the legacy operational index is not present.
DO $r01_preflight$
BEGIN
  IF to_regclass(
    'public.commercial_store_locations_one_active_primary_idx'
  ) IS NULL THEN
    RAISE EXCEPTION
      'K7-09B: expected active-primary index missing; reconcile before proceeding';
  END IF;
END;
$r01_preflight$;

-- Fail closed if the replacement index already exists.
-- A pre-existing index requires definition reconciliation.
DO $r01_new_index_preflight$
BEGIN
  IF to_regclass(
    'public.commercial_store_locations_one_primary_idx'
  ) IS NOT NULL THEN
    RAISE EXCEPTION
      'K7-09B: replacement primary index already exists; reconcile before proceeding';
  END IF;
END;
$r01_new_index_preflight$;

-- Establish the stronger invariant before removing the old index.
CREATE UNIQUE INDEX IF NOT EXISTS
  commercial_store_locations_one_primary_idx
ON public.commercial_store_locations (store_id)
WHERE is_primary = true;

-- Retire the weaker rule only after the stronger index exists.
DROP INDEX public.commercial_store_locations_one_active_primary_idx;

-- NEXT: audit event, controlled registration function and grants.

-- ============================================================
-- K7-09B: COMMERCIAL STORE LOCATION AUDIT EVENT
-- ============================================================

INSERT INTO public.audit_event_types
  (domain_code, code, name, description, active, display_order)
SELECT
  'STORE',
  'STORE_LOCATION_CREATED',
  'Sucursal comercial registrada',
  'Registro administrativo inicial de una sucursal comercial',
  true,
  20
WHERE NOT EXISTS (
  SELECT 1
  FROM public.audit_event_types
  WHERE domain_code = 'STORE'
    AND code = 'STORE_LOCATION_CREATED'
);

-- The registration function must call:
-- public.record_platform_audit_event(
--   'STORE', 'STORE_LOCATION_CREATED',
--   'COMMERCIAL_STORE_LOCATION', ...
-- )
--
-- Audit insertion must occur in the same transaction
-- as the commercial_store_locations insertion.

-- NEXT: controlled registration function, grants and COMMIT.

-- ============================================================
-- K7-09B-31: CONTROLLED COMMERCIAL STORE LOCATION REGISTRATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.create_commercial_store_location(
  p_store_id uuid,
  p_code text,
  p_name text,
  p_location_type_id uuid,
  p_address text DEFAULT NULL,
  p_address_extra text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_department text DEFAULT NULL,
  p_country_code text DEFAULT 'CO',
  p_postal_code text DEFAULT NULL,
  p_is_primary boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  store_id uuid,
  code text,
  name text,
  is_primary boolean,
  correlation_id uuid
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'pg_catalog'
AS $function$
DECLARE
  v_actor uuid;
  v_store public.commercial_stores%ROWTYPE;
  v_location public.commercial_store_locations%ROWTYPE;
  v_code text;
  v_name text;
  v_country_code text;
  v_correlation_id uuid;
BEGIN
  v_actor := auth.uid();

  IF v_actor IS NULL
     OR public.has_platform_permission('STORE_CREATE') IS NOT TRUE THEN
    RAISE EXCEPTION 'STORE_CREATE permission required'
      USING ERRCODE = '42501';
  END IF;

  SELECT *
  INTO v_store
  FROM public.commercial_stores AS s
  WHERE s.id = p_store_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commercial store not found'
      USING ERRCODE = '22023';
  END IF;

  IF v_store.status NOT IN (
    'CANDIDATE', 'UNDER_REVIEW', 'EVALUATED',
    'PARTNER_APPROVAL', 'APPROVED', 'CONTRACT_PENDING',
    'CONTRACT_SENT', 'CONTRACT_SIGNED', 'ACTIVE'
  ) THEN
    RAISE EXCEPTION 'Commercial store status does not allow location registration'
      USING ERRCODE = '22023';
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM public.commercial_location_types AS t
    WHERE t.id = p_location_type_id
      AND t.active = true
  ) THEN
    RAISE EXCEPTION 'Invalid or inactive commercial location type'
      USING ERRCODE = '22023';
  END IF;

  v_code := upper(btrim(p_code));
  v_name := btrim(p_name);
  v_country_code := upper(btrim(COALESCE(p_country_code, 'CO')));

  IF v_code IS NULL
     OR v_code !~ '^[A-Z][A-Z0-9_-]*$'
     OR v_name IS NULL
     OR v_name = ''
     OR v_country_code !~ '^[A-Z]{2}$' THEN
    RAISE EXCEPTION 'Invalid commercial location identity'
      USING ERRCODE = '22023';
  END IF;

  v_correlation_id := pg_catalog.gen_random_uuid();

  INSERT INTO public.commercial_store_locations (
    store_id, code, name, location_type_id,
    address, address_extra, city, department,
    country_code, postal_code, is_primary, active
  )
  VALUES (
    p_store_id,
    v_code,
    v_name,
    p_location_type_id,
    NULLIF(btrim(p_address), ''),
    NULLIF(btrim(p_address_extra), ''),
    NULLIF(btrim(p_city), ''),
    NULLIF(btrim(p_department), ''),
    v_country_code,
    NULLIF(btrim(p_postal_code), ''),
    COALESCE(p_is_primary, false),
    true
  )
  RETURNING * INTO v_location;

  PERFORM public.record_platform_audit_event(
    'STORE',
    'STORE_LOCATION_CREATED',
    'COMMERCIAL_STORE_LOCATION',
    v_location.id,
    'USER',
    v_actor,
    'ADMIN_API',
    v_correlation_id,
    'Registro administrativo inicial de sucursal comercial',
    NULL::jsonb,
    pg_catalog.jsonb_build_object(
      'id', v_location.id,
      'store_id', v_location.store_id,
      'code', v_location.code,
      'name', v_location.name,
      'location_type_id', v_location.location_type_id,
      'is_primary', v_location.is_primary,
      'active', v_location.active
    ),
    pg_catalog.jsonb_build_object(
      'operation', 'CREATE_COMMERCIAL_STORE_LOCATION'
    )
  );

  RETURN QUERY
  SELECT
    v_location.id,
    v_location.store_id,
    v_location.code,
    v_location.name,
    v_location.is_primary,
    v_correlation_id;
END;
$function$;

-- NEXT: grants, transaction closure and final reconciliation.

-- ============================================================
-- K7-09B-34: EXECUTION GRANTS AND TRANSACTION CLOSURE
-- ============================================================

REVOKE ALL ON FUNCTION public.create_commercial_store_location(
  uuid,text,text,uuid,text,text,text,text,text,text,boolean
) FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION public.create_commercial_store_location(
  uuid,text,text,uuid,text,text,text,text,text,text,boolean
) TO authenticated;

COMMIT;

-- K7-09B / 03B-017
