-- ============================================================
-- 03B-022 / START STORE APPLICATION REVIEW
-- Atomic transition: APPLIED -> UNDER_REVIEW
-- Requires STORE_APPLICATION_REVIEW
-- ============================================================

CREATE OR REPLACE FUNCTION public.start_store_application_review(
    p_application_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog'
AS $function$
DECLARE
    v_actor_id uuid;
    v_before public.commercial_store_applications%ROWTYPE;
    v_after public.commercial_store_applications%ROWTYPE;
    v_correlation_id uuid;
BEGIN
    v_actor_id := auth.uid();

    IF v_actor_id IS NULL
       OR public.has_platform_permission(
           'STORE_APPLICATION_REVIEW'
       ) IS DISTINCT FROM TRUE
    THEN
        RAISE EXCEPTION 'STORE_APPLICATION_REVIEW_FORBIDDEN'
            USING ERRCODE = '42501';
    END IF;

    IF p_application_id IS NULL THEN
        RAISE EXCEPTION 'STORE_APPLICATION_ID_REQUIRED'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_before
    FROM public.commercial_store_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STORE_APPLICATION_NOT_FOUND'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_before.status <> 'APPLIED' THEN
        RAISE EXCEPTION
            'STORE_APPLICATION_INVALID_TRANSITION: %',
            v_before.status
            USING ERRCODE = '23514';
    END IF;

    UPDATE public.commercial_store_applications
    SET
        status = 'UNDER_REVIEW',
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        updated_at = now()
    WHERE id = p_application_id
      AND status = 'APPLIED'
    RETURNING *
    INTO v_after;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'STORE_APPLICATION_CONCURRENT_CHANGE'
            USING ERRCODE = '40001';
    END IF;

    v_correlation_id := gen_random_uuid();

    PERFORM public.record_platform_audit_event(
        'STORE',
        'STORE_APPLICATION_REVIEW_STARTED',
        'COMMERCIAL_STORE_APPLICATION',
        p_application_id,
        'USER',
        v_actor_id,
        'ADMIN_STORE_APPLICATIONS',
        v_correlation_id,
        'Inicio de evaluación administrativa',
        to_jsonb(v_before),
        to_jsonb(v_after),
        jsonb_build_object(
            'operation', 'START_REVIEW'
        )
    );

    RETURN p_application_id;
END;
$function$;

REVOKE ALL ON FUNCTION
    public.start_store_application_review(uuid)
FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION
    public.start_store_application_review(uuid)
TO authenticated;
