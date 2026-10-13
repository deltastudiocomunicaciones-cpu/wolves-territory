-- ============================================================
-- 03B-019 / K7-10
-- STORE APPLICATION ACCESS GOVERNANCE
-- ============================================================

BEGIN;

-- Permission catalog: create only when absent.
INSERT INTO public.platform_permissions (
    code,
    name,
    description,
    active
)
SELECT
    'STORE_APPLICATION_VIEW',
    'Consultar solicitudes de afiliación STORE',
    'Acceso a expedientes comerciales y datos de representantes de tiendas solicitantes.',
    true
WHERE NOT EXISTS (
    SELECT 1
    FROM public.platform_permissions
    WHERE code = 'STORE_APPLICATION_VIEW'
);

-- Fail closed if the permission catalog is ambiguous or inactive.
DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.platform_permissions
        WHERE code = 'STORE_APPLICATION_VIEW'
          AND active = true
    ) <> 1 THEN
        RAISE EXCEPTION 'STORE_APPLICATION_VIEW_PERMISSION_INVALID';
    END IF;
END;
$$;

-- SUPER_ADMIN receives the application-specific permission.
INSERT INTO public.platform_role_permissions (
    role_code,
    permission_id,
    active
)
SELECT
    'SUPER_ADMIN',
    p.id,
    true
FROM public.platform_permissions p
WHERE p.code = 'STORE_APPLICATION_VIEW'
  AND NOT EXISTS (
      SELECT 1
      FROM public.platform_role_permissions prp
      WHERE prp.permission_id = p.id
        AND prp.role_code = 'SUPER_ADMIN'
  );

-- Verify that only SUPER_ADMIN has this active capability.
DO $$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.platform_role_permissions prp
        JOIN public.platform_permissions pp
          ON pp.id = prp.permission_id
        WHERE pp.code = 'STORE_APPLICATION_VIEW'
          AND pp.active = true
          AND prp.active = true
    ) <> 1
    OR NOT EXISTS (
        SELECT 1
        FROM public.platform_role_permissions prp
        JOIN public.platform_permissions pp
          ON pp.id = prp.permission_id
        WHERE pp.code = 'STORE_APPLICATION_VIEW'
          AND pp.active = true
          AND prp.active = true
          AND prp.role_code = 'SUPER_ADMIN'
    ) THEN
        RAISE EXCEPTION 'STORE_APPLICATION_VIEW_ASSIGNMENT_INVALID';
    END IF;
END;
$$;

-- Read-only administrative RPC.
CREATE OR REPLACE FUNCTION public.get_commercial_store_applications()
RETURNS TABLE (
    id uuid,
    legal_name text,
    trade_name text,
    document_type text,
    document_number text,
    representative_name text,
    representative_document_type text,
    representative_document_number text,
    email text,
    phone text,
    city text,
    department text,
    business_address text,
    branch_count integer,
    operating_cities text,
    business_description text,
    status text,
    created_at timestamptz,
    reviewed_at timestamptz,
    review_notes text,
    commercial_store_id uuid
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = 'pg_catalog'
AS $function$
BEGIN
    IF auth.uid() IS NULL
       OR public.has_platform_permission('STORE_APPLICATION_VIEW')
          IS DISTINCT FROM TRUE THEN
        RAISE EXCEPTION
            'STORE_APPLICATION_VIEW_PERMISSION_DENIED'
            USING ERRCODE = '42501';
    END IF;

    RETURN QUERY
    SELECT
        a.id,
        a.legal_name,
        a.trade_name,
        a.document_type,
        a.document_number,
        a.representative_name,
        a.representative_document_type,
        a.representative_document_number,
        a.email,
        a.phone,
        a.city,
        a.department,
        a.business_address,
        a.branch_count,
        a.operating_cities,
        a.business_description,
        a.status,
        a.created_at,
        a.reviewed_at,
        a.review_notes,
        a.commercial_store_id
    FROM public.commercial_store_applications a
    ORDER BY a.created_at DESC, a.id DESC;
END;
$function$;

REVOKE ALL
ON FUNCTION public.get_commercial_store_applications()
FROM PUBLIC, anon;

GRANT EXECUTE
ON FUNCTION public.get_commercial_store_applications()
TO authenticated;

COMMIT;
