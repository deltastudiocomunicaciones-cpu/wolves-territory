-- ============================================================
-- 03B-020 / STORE APPLICATION AUDIT EVENT VOCABULARY
-- Registers event types only. No retroactive audit events.
-- ============================================================

INSERT INTO public.audit_event_types (
    domain_code,
    code,
    name,
    description,
    active,
    display_order
)
VALUES
    (
        'STORE',
        'STORE_APPLICATION_RECEIVED',
        'Solicitud de afiliación recibida',
        'Recepción de una solicitud comercial presentada por una tienda.',
        true,
        30
    ),
    (
        'STORE',
        'STORE_APPLICATION_REVIEW_STARTED',
        'Evaluación de afiliación iniciada',
        'Inicio de revisión administrativa de una solicitud STORE.',
        true,
        40
    ),
    (
        'STORE',
        'STORE_APPLICATION_APPROVED',
        'Solicitud de afiliación aprobada',
        'Decisión administrativa favorable sobre una solicitud STORE.',
        true,
        50
    ),
    (
        'STORE',
        'STORE_APPLICATION_REJECTED',
        'Solicitud de afiliación rechazada',
        'Decisión administrativa desfavorable sobre una solicitud STORE.',
        true,
        60
    )
ON CONFLICT (domain_code, code) DO NOTHING;
