
-- ============================================================
-- K7-16 / 024 — PREFLIGHT DE DEPENDENCIAS
-- No modifica datos ni estructuras.
-- ============================================================

DO $store_qualification_preflight$
BEGIN
    IF to_regprocedure(
        'public.record_platform_audit_event(text,text,text,uuid,text,uuid,text,uuid,text,jsonb,jsonb,jsonb)'
    ) IS NULL THEN
        RAISE EXCEPTION
            '03B-024: missing record_platform_audit_event dependency';
    END IF;

    IF to_regprocedure(
        'public.has_platform_permission(text)'
    ) IS NULL THEN
        RAISE EXCEPTION
            '03B-024: missing has_platform_permission dependency';
    END IF;

    IF to_regclass(
        'public.audit_event_types'
    ) IS NULL THEN
        RAISE EXCEPTION
            '03B-024: missing audit_event_types dependency';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'audit_event_types'
          AND column_name IN (
              'domain_code',
              'code',
              'name',
              'description',
              'active',
              'display_order'
          )
        GROUP BY table_schema, table_name
        HAVING COUNT(DISTINCT column_name) = 6
    ) THEN
        RAISE EXCEPTION
            '03B-024: incompatible audit_event_types schema';
    END IF;
END;
$store_qualification_preflight$;

-- ============================================================
-- WOLVES TERRITORY / STORE 03B
-- 024 — WT STORE QUALIFICATION V1
-- Motor de evaluación institucional
--
-- Primera sección: expediente de evaluación.
-- Reconstrucción declarativa de una estructura existente.
-- No ejecutar en la base actual sin reconciliación previa.
-- ============================================================

CREATE TABLE public.commercial_store_evaluations (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    application_id uuid NOT NULL
        REFERENCES public.commercial_store_applications(id),

    evaluation_version text NOT NULL
        DEFAULT 'WT-SQ-V1',

    status text NOT NULL DEFAULT 'DRAFT'
        CHECK (
            status IN (
                'DRAFT',
                'IN_PROGRESS',
                'COMPLETED',
                'CANCELLED'
            )
        ),

    qualification_score numeric(5,2)
        CHECK (
            qualification_score BETWEEN 0 AND 100
        ),

    recommendation text
        CHECK (
            recommendation IN (
                'APPROVE',
                'CONDITIONAL',
                'REJECT',
                'HOLD'
            )
        ),

    evaluation_notes text,

    created_by uuid,
    completed_by uuid,
    completed_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (application_id, evaluation_version),

    CHECK (
        status <> 'COMPLETED'
        OR (
            qualification_score IS NOT NULL
            AND recommendation IS NOT NULL
            AND completed_by IS NOT NULL
            AND completed_at IS NOT NULL
        )
    )
);

CREATE INDEX commercial_store_evaluations_application_idx
    ON public.commercial_store_evaluations(application_id);

ALTER TABLE public.commercial_store_evaluations
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.commercial_store_evaluations
    FROM PUBLIC, anon, authenticated;



-- ============================================================
-- SEGUNDA SECCIÓN
-- Nueve dimensiones de calificación STORE
-- ============================================================

CREATE TABLE public.commercial_store_evaluation_scores (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    evaluation_id uuid NOT NULL
        REFERENCES public.commercial_store_evaluations(id),

    dimension_code text NOT NULL
        CHECK (
            dimension_code IN (
                'BRAND_FIT',
                'COMMERCIAL_POTENTIAL',
                'LOCATION_MARKET',
                'OPERATIONAL_CAPACITY',
                'CUSTODY_SECURITY',
                'BUSINESS_STRENGTH',
                'REPUTATION',
                'DIGITAL_CAPABILITY',
                'STRATEGIC_POTENTIAL'
            )
        ),

    score integer NOT NULL
        CHECK (score BETWEEN 1 AND 5),

    justification text NOT NULL
        CHECK (length(btrim(justification)) > 0),

    evidence_reference text,

    evaluated_by uuid,
    evaluated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (evaluation_id, dimension_code)
);

CREATE INDEX commercial_store_evaluation_scores_evaluation_idx
    ON public.commercial_store_evaluation_scores(evaluation_id);

ALTER TABLE public.commercial_store_evaluation_scores
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.commercial_store_evaluation_scores
    FROM PUBLIC, anon, authenticated;


-- ============================================================
-- TERCERA SECCIÓN
-- Doce Gates institucionales STORE
-- ============================================================

CREATE TABLE public.commercial_store_evaluation_gates (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    evaluation_id uuid NOT NULL
        REFERENCES public.commercial_store_evaluations(id),

    gate_code text NOT NULL
        CHECK (
            gate_code IN (
                'G01', 'G02', 'G03', 'G04',
                'G05', 'G06', 'G07', 'G08',
                'G09', 'G10', 'G11', 'G12'
            )
        ),

    status text NOT NULL DEFAULT 'PENDING'
        CHECK (
            status IN (
                'PENDING',
                'PASS',
                'FAIL',
                'NOT_APPLICABLE'
            )
        ),

    justification text,
    evidence_reference text,

    verified_by uuid,
    verified_at timestamptz,

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    UNIQUE (evaluation_id, gate_code),

    CHECK (
        status = 'PENDING'
        OR (
            justification IS NOT NULL
            AND length(btrim(justification)) > 0
            AND verified_by IS NOT NULL
            AND verified_at IS NOT NULL
        )
    )
);

CREATE INDEX commercial_store_evaluation_gates_evaluation_idx
    ON public.commercial_store_evaluation_gates(evaluation_id);

ALTER TABLE public.commercial_store_evaluation_gates
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.commercial_store_evaluation_gates
    FROM PUBLIC, anon, authenticated;


-- ============================================================
-- CUARTA SECCIÓN
-- Cálculo institucional de WT Store Qualification V1
--
-- Consulta de resultados, sin modificar expedientes.
-- No autoriza afiliación ni habilitación comercial.
-- ============================================================

CREATE FUNCTION public.calculate_store_evaluation(
    p_evaluation_id uuid
)
RETURNS TABLE (
    dimensions_completed integer,
    total_dimensions integer,
    weighted_score numeric,
    classification text,
    gates_passed integer,
    gates_failed integer,
    gates_pending integer,
    gates_not_applicable integer,
    eligible_for_completion boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
    WITH weights(dimension_code, weight) AS (
        VALUES
            ('BRAND_FIT', 20),
            ('COMMERCIAL_POTENTIAL', 15),
            ('LOCATION_MARKET', 15),
            ('OPERATIONAL_CAPACITY', 10),
            ('CUSTODY_SECURITY', 10),
            ('BUSINESS_STRENGTH', 10),
            ('REPUTATION', 10),
            ('DIGITAL_CAPABILITY', 5),
            ('STRATEGIC_POTENTIAL', 5)
    ),
    scores AS (
        SELECT
            count(s.id)::integer AS completed,
            COALESCE(
                sum(s.score::numeric * w.weight / 5),
                0
            ) AS weighted_total
        FROM weights w
        LEFT JOIN public.commercial_store_evaluation_scores s
            ON s.dimension_code = w.dimension_code
           AND s.evaluation_id = p_evaluation_id
    ),
    gates AS (
        SELECT
            count(*) FILTER (
                WHERE status = 'PASS'
            )::integer AS passed,
            count(*) FILTER (
                WHERE status = 'FAIL'
            )::integer AS failed,
            count(*) FILTER (
                WHERE status = 'NOT_APPLICABLE'
            )::integer AS not_applicable,
            (
                12 - count(*) FILTER (
                    WHERE status IN (
                        'PASS',
                        'FAIL',
                        'NOT_APPLICABLE'
                    )
                )
            )::integer AS pending
        FROM public.commercial_store_evaluation_gates
        WHERE evaluation_id = p_evaluation_id
    )
    SELECT
        s.completed,
        9,
        round(s.weighted_total, 2),
        CASE
            WHEN s.completed < 9 THEN 'INCOMPLETE'
            WHEN s.weighted_total >= 90 THEN 'ELITE'
            WHEN s.weighted_total >= 80 THEN 'STRATEGIC'
            WHEN s.weighted_total >= 70 THEN 'APPROVED'
            WHEN s.weighted_total >= 60 THEN 'CONDITIONAL'
            ELSE 'NOT_RECOMMENDED'
        END,
        g.passed,
        g.failed,
        g.pending,
        g.not_applicable,
        (
            s.completed = 9
            AND g.failed = 0
            AND g.pending = 0
        )
    
    FROM scores s
    CROSS JOIN gates g
    WHERE EXISTS (
        SELECT 1
        FROM public.commercial_store_evaluations e
        WHERE e.id = p_evaluation_id
    );
$$;


REVOKE ALL ON FUNCTION public.calculate_store_evaluation(uuid)
    FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.calculate_store_evaluation(uuid)
    TO service_role;


-- ============================================================
-- QUINTA SECCIÓN
-- Apertura controlada del expediente STORE
-- ============================================================

CREATE FUNCTION public.open_store_evaluation(
    p_application_id uuid
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor uuid;
    v_status text;
    v_evaluation_id uuid;
BEGIN
    v_actor := auth.uid();

    IF v_actor IS NULL
       OR NOT public.has_platform_permission(
           'STORE_APPLICATION_REVIEW'
       )
    THEN
        RAISE EXCEPTION
            'STORE_EVALUATION_FORBIDDEN'
            USING ERRCODE = '42501';
    END IF;

    SELECT status
    INTO v_status
    FROM public.commercial_store_applications
    WHERE id = p_application_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'STORE_APPLICATION_NOT_FOUND'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_status NOT IN ('UNDER_REVIEW', 'APPROVED') THEN
        RAISE EXCEPTION
            'STORE_APPLICATION_NOT_ELIGIBLE'
            USING ERRCODE = '23514';
    END IF;

    INSERT INTO public.commercial_store_evaluations (
        application_id,
        evaluation_version,
        status,
        created_by
    )
    VALUES (
        p_application_id,
        'WT-SQ-V1',
        'DRAFT',
        v_actor
    )
    ON CONFLICT (application_id, evaluation_version)
    DO NOTHING
    RETURNING id INTO v_evaluation_id;

    IF v_evaluation_id IS NULL THEN
        SELECT id
        INTO v_evaluation_id
        FROM public.commercial_store_evaluations
        WHERE application_id = p_application_id
          AND evaluation_version = 'WT-SQ-V1';
    END IF;

    RETURN v_evaluation_id;
END;
$$;

REVOKE ALL ON FUNCTION public.open_store_evaluation(uuid)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.open_store_evaluation(uuid)
    TO authenticated;



-- ============================================================
-- SEXTA SECCIÓN
-- Registro auditado de dimensiones STORE
-- ============================================================

CREATE FUNCTION public.save_store_evaluation_score(
    p_evaluation_id uuid,
    p_dimension_code text,
    p_score integer,
    p_justification text,
    p_evidence_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor uuid;
    v_status text;
    v_previous jsonb;
    v_current jsonb;
BEGIN
    v_actor := auth.uid();

    IF v_actor IS NULL
       OR NOT public.has_platform_permission(
           'STORE_APPLICATION_REVIEW'
       )
    THEN
        RAISE EXCEPTION
            'STORE_EVALUATION_FORBIDDEN'
            USING ERRCODE = '42501';
    END IF;

    IF p_dimension_code IS NULL
   OR p_dimension_code NOT IN (
        'BRAND_FIT',
        'COMMERCIAL_POTENTIAL',
        'LOCATION_MARKET',
        'OPERATIONAL_CAPACITY',
        'CUSTODY_SECURITY',
        'BUSINESS_STRENGTH',
        'REPUTATION',
        'DIGITAL_CAPABILITY',
        'STRATEGIC_POTENTIAL'
    )
    OR p_score IS NULL
OR p_score NOT BETWEEN 1 AND 5
    OR p_justification IS NULL
    OR length(btrim(p_justification)) = 0
    THEN
        RAISE EXCEPTION
            'STORE_EVALUATION_INVALID_INPUT'
            USING ERRCODE = '22023';
    END IF;

    SELECT status
    INTO v_status
    FROM public.commercial_store_evaluations
    WHERE id = p_evaluation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'STORE_EVALUATION_NOT_FOUND'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_status NOT IN ('DRAFT', 'IN_PROGRESS') THEN
        RAISE EXCEPTION
            'STORE_EVALUATION_CLOSED'
            USING ERRCODE = '23514';
    END IF;

    SELECT jsonb_build_object(
        'score', score,
        'justification', justification,
        'evidence_reference', evidence_reference
    )
    INTO v_previous
    FROM public.commercial_store_evaluation_scores
    WHERE evaluation_id = p_evaluation_id
      AND dimension_code = p_dimension_code;

    INSERT INTO public.commercial_store_evaluation_scores (
        evaluation_id,
        dimension_code,
        score,
        justification,
        evidence_reference,
        evaluated_by,
        evaluated_at
    )
    VALUES (
        p_evaluation_id,
        p_dimension_code,
        p_score,
        
        btrim(p_justification),
        NULLIF(btrim(p_evidence_reference), ''),
        v_actor,

        now()
    )
    ON CONFLICT (evaluation_id, dimension_code)
    DO UPDATE SET
        score = EXCLUDED.score,
        justification = EXCLUDED.justification,
        evidence_reference = EXCLUDED.evidence_reference,
        evaluated_by = EXCLUDED.evaluated_by,
        evaluated_at = EXCLUDED.evaluated_at;

    UPDATE public.commercial_store_evaluations
    SET status = 'IN_PROGRESS',
        updated_at = now()
    WHERE id = p_evaluation_id;

    
SELECT jsonb_build_object(
    'score', s.score,
    'justification', s.justification,
    'evidence_reference', s.evidence_reference
)
INTO v_current
FROM public.commercial_store_evaluation_scores s
WHERE s.evaluation_id = p_evaluation_id
  AND s.dimension_code = p_dimension_code;


    PERFORM public.record_platform_audit_event(
        'STORE',
        'STORE_EVALUATION_SCORE_SAVED',
        'commercial_store_evaluation',
        p_evaluation_id,
        'USER',
        v_actor,
        'commercial_store_evaluation',
        p_evaluation_id,
        'STORE_EVALUATION_SCORE_CHANGE',
        v_previous,
        v_current,
        jsonb_build_object(
            'dimension_code', p_dimension_code
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.save_store_evaluation_score(
    uuid, text, integer, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_store_evaluation_score(
    uuid, text, integer, text, text
) TO authenticated;



-- ============================================================
-- SÉPTIMA SECCIÓN
-- Registro auditado de Gates institucionales STORE
-- ============================================================

CREATE FUNCTION public.save_store_evaluation_gate(
    p_evaluation_id uuid,
    p_gate_code text,
    p_status text,
    p_justification text DEFAULT NULL,
    p_evidence_reference text DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_actor uuid;
    v_evaluation_status text;
    v_previous jsonb;
    v_current jsonb;
    v_justification text;
    v_verified_at timestamptz;
BEGIN
    v_actor := auth.uid();

    IF v_actor IS NULL
       OR NOT public.has_platform_permission(
           'STORE_APPLICATION_REVIEW'
       )
    THEN
        RAISE EXCEPTION
            'Not authorized'
            USING ERRCODE = '42501';
    END IF;

    
    -- Validar código institucional
    IF p_gate_code IS NULL
       OR p_gate_code NOT IN (
           'G01', 'G02', 'G03', 'G04',
           'G05', 'G06', 'G07', 'G08',
           'G09', 'G10', 'G11', 'G12'
       )
    THEN
        RAISE EXCEPTION 'Invalid gate code';
    END IF;

    -- Validar estado
    IF p_status IS NULL
       OR p_status NOT IN (
           'PENDING',
           'PASS',
           'FAIL',
           'NOT_APPLICABLE'
       )
    THEN
        RAISE EXCEPTION 'Invalid gate status';
    END IF;

    -- Normalizar justificación
    v_justification := NULLIF(btrim(p_justification), '');

    -- Exigir justificación cuando corresponda
    IF p_status <> 'PENDING'
       AND v_justification IS NULL
    THEN
        RAISE EXCEPTION 'Justification required';
    END IF;

    -- Validar longitud de textos
    IF length(COALESCE(p_justification, '')) > 2000
       OR length(COALESCE(p_evidence_reference, '')) > 2000
    THEN
        RAISE EXCEPTION 'Text exceeds maximum length';
    END IF;

    SELECT status
    INTO v_evaluation_status
    FROM public.commercial_store_evaluations
    WHERE id = p_evaluation_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION
            'Evaluation not found'
            USING ERRCODE = 'P0002';
    END IF;

    IF v_evaluation_status NOT IN (
        'DRAFT',
        'IN_PROGRESS'
    ) THEN
        RAISE EXCEPTION
            'Evaluation is not editable'
            USING ERRCODE = '23514';
    END IF;



    SELECT jsonb_build_object(
        'status', status,
        'justification', justification,
        'evidence_reference', evidence_reference
    )
    INTO v_previous
    FROM public.commercial_store_evaluation_gates
    WHERE evaluation_id = p_evaluation_id
      AND gate_code = p_gate_code;

    v_verified_at := CASE
        WHEN p_status = 'PENDING' THEN NULL
        ELSE now()
    END;

    INSERT INTO public.commercial_store_evaluation_gates (
        evaluation_id,
        gate_code,
        status,
        justification,
        evidence_reference,
        verified_by,
        verified_at
    )
    VALUES (
        p_evaluation_id,
        p_gate_code,
        p_status,
        v_justification,
        NULLIF(btrim(p_evidence_reference), ''),
        CASE
            WHEN p_status = 'PENDING' THEN NULL
            ELSE v_actor
        END,
        v_verified_at
    )
    ON CONFLICT (evaluation_id, gate_code)
    DO UPDATE SET
        status = EXCLUDED.status,
        justification = EXCLUDED.justification,
        evidence_reference = EXCLUDED.evidence_reference,
        verified_by = EXCLUDED.verified_by,
        verified_at = EXCLUDED.verified_at,
        updated_at = now();

    
UPDATE public.commercial_store_evaluations
SET status = 'IN_PROGRESS',
    updated_at = now()
WHERE id = p_evaluation_id
  AND status = 'DRAFT';


   
v_current := jsonb_build_object(
    'status', p_status,
    'justification', v_justification,
    'evidence_reference',
        NULLIF(btrim(p_evidence_reference), '')
);


    PERFORM public.record_platform_audit_event(
        'STORE',
        'STORE_EVALUATION_GATE_SAVED',
        'commercial_store_evaluation',
        p_evaluation_id,
        'USER',
        v_actor,
        'commercial_store_evaluation',
        p_evaluation_id,
        'STORE_EVALUATION_GATE_CHANGE',
        v_previous,
        v_current,
        jsonb_build_object(
            'gate_code', p_gate_code
        )
    );
END;
$$;

REVOKE ALL ON FUNCTION public.save_store_evaluation_gate(
    uuid, text, text, text, text
) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.save_store_evaluation_gate(
    uuid, text, text, text, text
) TO authenticated;



-- ============================================================
-- OCTAVA SECCIÓN
-- Lectura segura de calificaciones STORE
-- ============================================================

CREATE FUNCTION public.get_store_evaluation_scores(
    p_evaluation_id uuid
)
RETURNS TABLE (
    dimension_code text,
    score integer,
    justification text,
    evidence_reference text,
    evaluated_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR NOT public.has_platform_permission(
           'STORE_APPLICATION_REVIEW'
       )
    THEN
        RAISE EXCEPTION
            'Not authorized'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.commercial_store_evaluations e
        WHERE e.id = p_evaluation_id
    ) THEN
        RAISE EXCEPTION
            'Evaluation not found'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY
    SELECT
        s.dimension_code,
        s.score,
        s.justification,
        s.evidence_reference,
        s.evaluated_at
    FROM public.commercial_store_evaluation_scores s
    WHERE s.evaluation_id = p_evaluation_id
    ORDER BY s.dimension_code;
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_evaluation_scores(uuid)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_store_evaluation_scores(uuid)
    TO authenticated;


-- ============================================================
-- NOVENA SECCIÓN
-- Lectura segura de los doce Gates institucionales
-- ============================================================

CREATE FUNCTION public.get_store_evaluation_gates(
    p_evaluation_id uuid
)
RETURNS TABLE (
    gate_code text,
    status text,
    justification text,
    evidence_reference text,
    verified_by uuid,
    verified_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    IF auth.uid() IS NULL
       OR NOT public.has_platform_permission(
           'STORE_APPLICATION_REVIEW'
       )
    THEN
        RAISE EXCEPTION
            'Not authorized'
            USING ERRCODE = '42501';
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM public.commercial_store_evaluations e
        WHERE e.id = p_evaluation_id
    ) THEN
        RAISE EXCEPTION
            'Evaluation not found'
            USING ERRCODE = 'P0002';
    END IF;

    RETURN QUERY
    SELECT
        g.gate_code,
        g.status,
        g.justification,
        g.evidence_reference,
        g.verified_by,
        g.verified_at
    FROM public.commercial_store_evaluation_gates g
    WHERE g.evaluation_id = p_evaluation_id
    ORDER BY g.gate_code;
END;
$$;

REVOKE ALL ON FUNCTION public.get_store_evaluation_gates(uuid)
    FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.get_store_evaluation_gates(uuid)
    TO authenticated;


-- ============================================================
-- DÉCIMA SECCIÓN
-- Catálogo de auditoría WT Store Qualification V1
-- ============================================================

INSERT INTO public.audit_event_types (
    domain_code,
    code,
    name,
    description,
    active,
    display_order
)
SELECT
    v.domain_code,
    v.code,
    v.name,
    v.description,
    true,
    v.display_order
FROM (
    VALUES
        (
            'STORE',
            'STORE_EVALUATION_SCORE_SAVED',
            'Calificación de dimensión STORE',
            'Registro o actualización de una dimensión de evaluación institucional.',
            100
        ),
        (
            'STORE',
            'STORE_EVALUATION_GATE_SAVED',
            'Verificación de Gate STORE',
            'Registro o actualización de un requisito institucional de evaluación.',
            110
        )
) AS v (
    domain_code,
    code,
    name,
    description,
    display_order
)
WHERE NOT EXISTS (
    SELECT 1
    FROM public.audit_event_types aet
    WHERE aet.domain_code = v.domain_code
      AND aet.code = v.code
);
