-- ============================================================
-- 03B-021 / STORE APPLICATION REVIEW PERMISSION
-- Exclusive assignment: SUPER_ADMIN
-- ============================================================

BEGIN;

INSERT INTO public.platform_permissions (
    code,
    name,
    active
)
VALUES (
    'STORE_APPLICATION_REVIEW',
    'Gestionar evaluación de solicitudes STORE',
    true
)
ON CONFLICT (code) DO NOTHING;

INSERT INTO public.platform_role_permissions (
    role_code,
    permission_id
)
SELECT
    'SUPER_ADMIN',
    p.id
FROM public.platform_permissions p
WHERE p.code = 'STORE_APPLICATION_REVIEW'
  AND p.active = true
ON CONFLICT DO NOTHING;

DO $guard$
BEGIN
    IF (
        SELECT COUNT(*)
        FROM public.platform_role_permissions r
        JOIN public.platform_permissions p
          ON p.id = r.permission_id
        WHERE p.code = 'STORE_APPLICATION_REVIEW'
    ) <> 1
    OR NOT EXISTS (
        SELECT 1
        FROM public.platform_role_permissions r
        JOIN public.platform_permissions p
          ON p.id = r.permission_id
        WHERE p.code = 'STORE_APPLICATION_REVIEW'
          AND p.active = true
          AND r.role_code = 'SUPER_ADMIN'
    ) THEN
        RAISE EXCEPTION
            'K7-10: STORE_APPLICATION_REVIEW must belong exclusively to SUPER_ADMIN';
    END IF;
END;
$guard$;

COMMIT;
