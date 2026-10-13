-- ============================================================
-- WOLVES TERRITORY / 03B-023
-- K7-10: ATOMIC STORE APPLICATION REGISTRATION
-- ============================================================

BEGIN;

DO $preflight$
BEGIN
    IF to_regclass('public.commercial_store_applications') IS NULL THEN
        RAISE EXCEPTION 'STORE_APPLICATION_TABLE_MISSING';
    END IF;

    IF to_regprocedure(
        'public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)'
    ) IS NULL THEN
        RAISE EXCEPTION 'STORE_AUDIT_ENGINE_MISSING';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.audit_event_types
        WHERE domain_code = 'STORE'
          AND code = 'STORE_APPLICATION_RECEIVED'
          AND active = true
    ) THEN
        RAISE EXCEPTION 'STORE_APPLICATION_RECEIVED_EVENT_MISSING';
    END IF;

    IF to_regprocedure(
        'public.register_store_application(jsonb)'
    ) IS NOT NULL THEN
        RAISE EXCEPTION 'STORE_APPLICATION_REGISTRATION_ALREADY_EXISTS';
    END IF;
END;
$preflight$;

CREATE FUNCTION public.register_store_application(
    p_application jsonb
)
RETURNS TABLE (
    application_id uuid,
    application_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'pg_catalog'
AS $function$
DECLARE
    v_application public.commercial_store_applications%ROWTYPE;
    v_branch_count integer;
    v_document_normalized text;
    v_email_normalized text;
BEGIN
    -- The caller must present the service_role JWT.
    IF auth.role() IS DISTINCT FROM 'service_role' THEN
        RAISE EXCEPTION 'STORE_APPLICATION_REGISTRATION_FORBIDDEN'
            USING ERRCODE = '42501';
    END IF;

    IF p_application IS NULL
       OR jsonb_typeof(p_application) <> 'object'
    THEN
        RAISE EXCEPTION 'STORE_APPLICATION_PAYLOAD_INVALID'
            USING ERRCODE = '22023';
    END IF;

    -- Reject unknown fields, including administrative state fields.
    IF EXISTS (
        SELECT 1
        FROM jsonb_object_keys(p_application) AS field(key)
        WHERE field.key NOT IN (
            'legal_name',
            'trade_name',
            'document_type',
            'document_number',
            'representative_name',
            'representative_document_type',
            'representative_document_number',
            'email',
            'phone',
            'city',
            'department',
            'business_address',
            'branch_count',
            'operating_cities',
            'business_description',
            'privacy_accepted',
            'terms_accepted'
        )
    ) THEN
        RAISE EXCEPTION 'STORE_APPLICATION_UNEXPECTED_FIELD'
            USING ERRCODE = '22023';
    END IF;

    -- Reject non-string values in commercial text fields.
    IF EXISTS (
        SELECT 1
        FROM jsonb_each(p_application) AS field(key, value)
        WHERE field.key IN (
            'legal_name',
            'trade_name',
            'document_type',
            'document_number',
            'representative_name',
            'representative_document_type',
            'representative_document_number',
            'email',
            'phone',
            'city',
            'department',
            'business_address',
            'operating_cities',
            'business_description'
        )
        AND (
            jsonb_typeof(field.value) <> 'string'
            AND NOT (
                field.key IN (
                    'department',
                    'operating_cities',
                    'business_description'
                )
                AND jsonb_typeof(field.value) = 'null'
            )
        )
    ) THEN
        RAISE EXCEPTION 'STORE_APPLICATION_TEXT_TYPE_INVALID'
            USING ERRCODE = '22023';
    END IF;
    -- Match the commercial field length limits enforced by the API.
    IF EXISTS (
        SELECT 1
        FROM (
            VALUES
                ('legal_name', 200),
                ('trade_name', 200),
                ('document_type', 20),
                ('document_number', 40),
                ('representative_name', 200),
                ('representative_document_type', 20),
                ('representative_document_number', 40),
                ('email', 254),
                ('phone', 40),
                ('city', 120),
                ('department', 120),
                ('business_address', 300),
                ('operating_cities', 500),
                ('business_description', 1500)
        ) AS limits(field_name, max_length)
        WHERE length(
            btrim(p_application->>limits.field_name)
        ) > limits.max_length
    ) THEN
        RAISE EXCEPTION 'STORE_APPLICATION_FIELD_TOO_LONG'
            USING ERRCODE = '22023';
    END IF;
    IF p_application->'privacy_accepted' IS DISTINCT FROM 'true'::jsonb
       OR p_application->'terms_accepted' IS DISTINCT FROM 'true'::jsonb
    THEN
        RAISE EXCEPTION 'STORE_APPLICATION_CONSENT_REQUIRED'
            USING ERRCODE = '22023';
    END IF;

    IF jsonb_typeof(p_application->'branch_count') IS DISTINCT FROM 'number'
       OR (p_application->>'branch_count') IS NULL
       OR (p_application->>'branch_count') !~ '^[0-9]{1,4}$'
    THEN
        RAISE EXCEPTION 'STORE_APPLICATION_BRANCH_COUNT_INVALID'
            USING ERRCODE = '22023';
    END IF;

    v_branch_count := (p_application->>'branch_count')::integer;

    IF v_branch_count NOT BETWEEN 1 AND 1000 THEN
        RAISE EXCEPTION 'STORE_APPLICATION_BRANCH_COUNT_INVALID'
            USING ERRCODE = '22023';
    END IF;

    IF EXISTS (
        SELECT 1
        FROM (
            VALUES
                (p_application->>'legal_name'),
                (p_application->>'trade_name'),
                (p_application->>'document_type'),
                (p_application->>'document_number'),
                (p_application->>'representative_name'),
                (p_application->>'representative_document_type'),
                (p_application->>'representative_document_number'),
                (p_application->>'email'),
                (p_application->>'phone'),
                (p_application->>'city'),
                (p_application->>'business_address')
        ) AS required_fields(value)
        WHERE value IS NULL OR btrim(value) = ''
    ) THEN
        RAISE EXCEPTION 'STORE_APPLICATION_REQUIRED_FIELD_MISSING'
            USING ERRCODE = '22023';
    END IF;

    v_document_normalized :=
        regexp_replace(
            p_application->>'document_number',
            '[^0-9]',
            '',
            'g'
        );

    v_email_normalized :=
        lower(btrim(p_application->>'email'));

    IF length(v_document_normalized) < 5
       OR length(v_email_normalized) > 254
       OR v_email_normalized !~ '^[^[:space:]@]+@[^[:space:]@]+\.[^[:space:]@]+$'
       OR length(
           regexp_replace(
               p_application->>'phone',
               '[^0-9]',
               '',
               'g'
           )
       ) < 7
    THEN
        RAISE EXCEPTION 'STORE_APPLICATION_IDENTITY_INVALID'
            USING ERRCODE = '22023';
    END IF;

    INSERT INTO public.commercial_store_applications (
        legal_name,
        trade_name,
        document_type,
        document_number,
        document_normalized,
        representative_name,
        representative_document_type,
        representative_document_number,
        email,
        email_normalized,
        phone,
        city,
        department,
        business_address,
        branch_count,
        operating_cities,
        business_description,
        privacy_accepted,
        terms_accepted,
        status
    )
    VALUES (
        btrim(p_application->>'legal_name'),
        btrim(p_application->>'trade_name'),
        upper(btrim(p_application->>'document_type')),
        btrim(p_application->>'document_number'),
        v_document_normalized,
        btrim(p_application->>'representative_name'),
        btrim(p_application->>'representative_document_type'),
        btrim(p_application->>'representative_document_number'),
        btrim(p_application->>'email'),
        v_email_normalized,
        regexp_replace(
            p_application->>'phone',
            '[^0-9]',
            '',
            'g'
        ),
        btrim(p_application->>'city'),
        nullif(btrim(p_application->>'department'), ''),
        btrim(p_application->>'business_address'),
        v_branch_count,
        nullif(btrim(p_application->>'operating_cities'), ''),
        nullif(btrim(p_application->>'business_description'), ''),
        true,
        true,
        'APPLIED'
    )
    RETURNING *
    INTO v_application;

    PERFORM public.record_platform_audit_event(
        'STORE',
        'STORE_APPLICATION_RECEIVED',
        'COMMERCIAL_STORE_APPLICATION',
        v_application.id,
        'SERVICE',
        NULL,
        'PUBLIC_STORE_APPLICATION',
        gen_random_uuid(),
        'Recepción de solicitud de afiliación comercial',
        NULL,
        jsonb_build_object(
            'id', v_application.id,
            'status', v_application.status
        ),
        jsonb_build_object(
            'operation', 'REGISTER_APPLICATION'
        )
    );

    RETURN QUERY
    SELECT v_application.id, v_application.status;
END;
$function$;

REVOKE ALL ON FUNCTION
    public.register_store_application(jsonb)
FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION
    public.register_store_application(jsonb)
TO service_role;

COMMIT;




