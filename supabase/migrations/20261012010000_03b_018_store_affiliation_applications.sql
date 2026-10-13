-- ============================================================
-- WOLVES TERRITORY / 03B-018
-- K7-10: PUBLIC STORE AFFILIATION APPLICATIONS
-- ============================================================

BEGIN;

CREATE TABLE IF NOT EXISTS public.commercial_store_applications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

    legal_name text NOT NULL,
    trade_name text NOT NULL,

    document_type text NOT NULL DEFAULT 'NIT',
    document_number text NOT NULL,
    document_normalized text NOT NULL,

    representative_name text NOT NULL,
    representative_document_type text NOT NULL,
    representative_document_number text NOT NULL,

    email text NOT NULL,
    email_normalized text NOT NULL,
    phone text NOT NULL,

    city text NOT NULL,
    department text,
    business_address text NOT NULL,

    branch_count integer NOT NULL DEFAULT 1,
    operating_cities text,
    business_description text,

    privacy_accepted boolean NOT NULL DEFAULT false,
    terms_accepted boolean NOT NULL DEFAULT false,

    status text NOT NULL DEFAULT 'APPLIED',

    reviewed_at timestamptz,
    reviewed_by uuid,
    review_notes text,

    commercial_store_id uuid
        REFERENCES public.commercial_stores(id),

    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now(),

    CONSTRAINT store_application_branch_count_check
        CHECK (branch_count >= 1),

    CONSTRAINT store_application_status_check
        CHECK (
            status IN (
                'APPLIED',
                'UNDER_REVIEW',
                'APPROVED',
                'REJECTED'
            )
        ),

    CONSTRAINT store_application_consents_check
        CHECK (
            privacy_accepted = true
            AND terms_accepted = true
        ),

    CONSTRAINT store_application_document_unique
        UNIQUE (document_type, document_normalized),

    CONSTRAINT store_application_email_unique
        UNIQUE (email_normalized)
);

CREATE INDEX IF NOT EXISTS
    commercial_store_applications_status_idx
ON public.commercial_store_applications (
    status,
    created_at DESC
);

ALTER TABLE public.commercial_store_applications
    ENABLE ROW LEVEL SECURITY;

REVOKE ALL
ON public.commercial_store_applications
FROM PUBLIC, anon, authenticated;

COMMIT;
