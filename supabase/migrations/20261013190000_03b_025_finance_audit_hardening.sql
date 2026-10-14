-- ============================================================
-- 03B-025 | FINANCE F1 — AUDIT HARDENING
-- STATUS: LOCAL DRAFT — NOT APPROVED FOR EXECUTION
-- ============================================================
--
-- Baseline: 75 audit events
-- Invalid event types: 0
-- Missing correlation IDs: 0
--
-- Objectives:
-- 1. Protect audit_events against UPDATE and DELETE.
-- 2. Preserve existing INSERT operations.
-- 3. Register FINANCE / PAYOUT_ACCOUNT_VERIFIED.
-- 4. Make bank verification and auditing atomic.
--
-- Pending:
-- Reconcile dependencies and design security controls.
--
-- DO NOT EXECUTE IN PRODUCTION.
-- ============================================================

-- ============================================================
-- F1-01 | APPEND-ONLY PROTECTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.prevent_audit_event_mutation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
SET search_path = pg_catalog
AS $$
BEGIN
  RAISE EXCEPTION
    'AUDIT_EVENTS_APPEND_ONLY: UPDATE and DELETE are prohibited'
    USING ERRCODE = '42501';
END;
$$;

CREATE TRIGGER audit_events_append_only_guard
BEFORE UPDATE OR DELETE
ON public.audit_events
FOR EACH ROW
EXECUTE FUNCTION public.prevent_audit_event_mutation();


-- Restrict direct execution of the trigger function.
REVOKE ALL ON FUNCTION public.prevent_audit_event_mutation()
FROM PUBLIC, anon, authenticated;


-- ============================================================
-- F1-02 | PROTECT BANK ACCOUNT RECORDS
-- ============================================================
-- RLS does not restrict TRUNCATE.
-- Financial verification does not require this privilege.

REVOKE TRUNCATE ON TABLE public.partner_payout_accounts
FROM PUBLIC, anon, authenticated, service_role;


-- ============================================================
-- F1-03 | PROTECT AUDIT HISTORY AGAINST TRUNCATE
-- ============================================================
-- Row-level DELETE triggers do not intercept TRUNCATE.
-- Preserve audit history by removing unnecessary privileges.

REVOKE TRUNCATE ON TABLE public.audit_events
FROM PUBLIC, anon, authenticated, service_role;


-- ============================================================
-- F1-04 | FINANCE AUDIT EVENT CATALOG
-- ============================================================
-- Register event type only.
-- Do not create retroactive audit events.

INSERT INTO public.audit_event_types (
    domain_code,
    code,
    name,
    description,
    active,
    display_order
)
VALUES (
    'FINANCE',
    'PAYOUT_ACCOUNT_VERIFIED',
    'Verificación de cuenta bancaria',
    'Registro de verificación administrativa de una cuenta bancaria de un aliado comercial.',
    true,
    10
)
ON CONFLICT (domain_code, code) DO NOTHING;


-- ============================================================
-- F1-05 | ATOMIC PAYOUT ACCOUNT VERIFICATION
-- ============================================================

CREATE OR REPLACE FUNCTION public.verify_partner_payout_account(
    p_account_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog
AS $$
DECLARE
    v_actor_id uuid;
    v_admin_role text;
    v_account public.partner_payout_accounts%ROWTYPE;
    v_event_id uuid;
BEGIN
    v_actor_id := auth.uid();

    IF v_actor_id IS NULL THEN
        RAISE EXCEPTION 'FINANCE_AUTH_REQUIRED'
            USING ERRCODE = '42501';
    END IF;

    SELECT au.role
    INTO v_admin_role
    FROM public.admin_users au
    WHERE au.auth_user_id = v_actor_id
      AND au.active = true
      AND au.role IN ('ADMIN', 'SUPER_ADMIN', 'FINANCE');

    IF v_admin_role IS NULL THEN
        RAISE EXCEPTION 'FINANCE_ACCESS_DENIED'
            USING ERRCODE = '42501';
    END IF;

    IF p_account_id IS NULL THEN
        RAISE EXCEPTION 'FINANCE_ACCOUNT_REQUIRED'
            USING ERRCODE = '22023';
    END IF;

    SELECT *
    INTO v_account
    FROM public.partner_payout_accounts
    WHERE id = p_account_id
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'FINANCE_ACCOUNT_NOT_FOUND'
            USING ERRCODE = 'P0002';
    END IF;

    IF NOT v_account.active THEN
        RAISE EXCEPTION 'FINANCE_ACCOUNT_INACTIVE'
            USING ERRCODE = '23514';
    END IF;

    IF v_account.verified THEN
        RETURN jsonb_build_object(
            'success', true,
            'alreadyVerified', true,
            'accountId', v_account.id
        );
    END IF;

    UPDATE public.partner_payout_accounts
    SET verified = true,
        verified_at = transaction_timestamp(),
        updated_at = transaction_timestamp()
    WHERE id = v_account.id;

    v_event_id := public.record_platform_audit_event(
        'FINANCE',
        'PAYOUT_ACCOUNT_VERIFIED',
        'PARTNER_PAYOUT_ACCOUNT',
        v_account.id,
        'USER',
        v_actor_id,
        'ADMIN',
        gen_random_uuid(),
        'Administrative payout account verification',
        jsonb_build_object('verified', false),
        jsonb_build_object('verified', true),
        jsonb_build_object(
            'partner_id', v_account.partner_id,
            'admin_role', v_admin_role
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'alreadyVerified', false,
        'accountId', v_account.id,
        'auditEventId', v_event_id
    );
END;
$$;

-- Restrict RPC execution to authenticated users.
REVOKE ALL ON FUNCTION public.verify_partner_payout_account(uuid)
FROM PUBLIC, anon, service_role;

GRANT EXECUTE ON FUNCTION public.verify_partner_payout_account(uuid)
TO authenticated;
