-- ============================================================
-- 03B-015 — INVENTORY PHYSICAL CONTROL ENGINE
-- K5 — Physical counts and controlled stock adjustments
-- ============================================================
--
-- PURPOSE
-- -------
-- Introduce the institutional workflow for physical inventory
-- counts and controlled stock adjustments.
--
-- CORE PRINCIPLES
-- ---------------
-- 1. A physical count never modifies inventory by itself.
-- 2. variance = physical_stock - system_stock.
-- 3. system_stock and system_reserved are database snapshots.
-- 4. OPERATIONS may create and submit counts.
-- 5. Only authority with INVENTORY_ADJUST_APPROVE may approve
--    a stock adjustment.
-- 6. Adjustment application is atomic:
--
--      inventory.stock
--          +
--      inventory_movements (ADJUSTMENT)
--          +
--      institutional audit event
--
-- 7. Zero variance produces no inventory movement.
-- 8. Stale inventory snapshots must never be silently applied.
-- 9. Adjusted stock must never fall below reserved_stock.
-- 10. Adjustment movements must use deterministic idempotency.
--
-- SECURITY MODEL
-- --------------
-- INVENTORY_COUNT_CREATE
-- INVENTORY_COUNT_SUBMIT
-- INVENTORY_ADJUST_APPROVE
--
-- TARGET ENTITIES
-- ---------------
-- public.inventory_counts
-- public.inventory_count_items
--
-- TARGET COMMANDS
-- ---------------
-- public.create_inventory_count(...)
-- public.upsert_inventory_count_item(...)
-- public.submit_inventory_count(...)
-- public.review_inventory_adjustment(...)
--
-- LEDGER
-- ------
-- Existing public.inventory_movements remains the authoritative
-- stock movement ledger.
--
-- Physical differences use:
--
--   movement_type = 'ADJUSTMENT'
--   order_id      = NULL
--
-- No parallel adjustment ledger is introduced.
--
-- ============================================================


-- ============================================================
-- 1. PHYSICAL INVENTORY COUNTS
-- ============================================================

create table public.inventory_counts (
    id uuid primary key default gen_random_uuid(),

    reference text not null unique,

    status text not null default 'DRAFT',

    count_type text not null default 'STANDARD',

    notes text,

    created_by uuid not null
        references auth.users(id),

    submitted_by uuid
        references auth.users(id),

    submitted_at timestamptz,

    reviewed_by uuid
        references auth.users(id),

    reviewed_at timestamptz,

    review_reason text,

    correlation_id uuid not null default gen_random_uuid(),

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint inventory_counts_reference_format_check
        check (
            reference ~ '^WT-CNT-[A-Z0-9_-]+$'
        ),

    constraint inventory_counts_status_check
        check (
            status in (
                'DRAFT',
                'IN_PROGRESS',
                'SUBMITTED',
                'APPROVED',
                'REJECTED'
            )
        ),

    constraint inventory_counts_count_type_check
        check (
            count_type in (
                'STANDARD',
                'FULL'
            )
        ),

    constraint inventory_counts_submission_pair_check
        check (
            (
                submitted_by is null
                and submitted_at is null
            )
            or
            (
                submitted_by is not null
                and submitted_at is not null
            )
        ),

    constraint inventory_counts_review_pair_check
        check (
            (
                reviewed_by is null
                and reviewed_at is null
            )
            or
            (
                reviewed_by is not null
                and reviewed_at is not null
            )
        )
);


-- ============================================================
-- 2. PHYSICAL INVENTORY COUNT ITEMS
-- ============================================================

create table public.inventory_count_items (
    id uuid primary key default gen_random_uuid(),

    count_id uuid not null
        references public.inventory_counts(id)
        on delete restrict,

    inventory_id uuid not null
        references public.inventory(id)
        on delete restrict,

    sku text not null,

    system_stock integer not null,

    system_reserved integer not null,

    physical_stock integer,

    variance integer generated always as (
        case
            when physical_stock is null then null
            else physical_stock - system_stock
        end
    ) stored,

    observation text,

    created_at timestamptz not null default now(),

    updated_at timestamptz not null default now(),

    constraint inventory_count_items_count_inventory_key
        unique (count_id, inventory_id),

    constraint inventory_count_items_count_sku_key
        unique (count_id, sku),

    constraint inventory_count_items_system_stock_check
        check (system_stock >= 0),

    constraint inventory_count_items_system_reserved_check
        check (system_reserved >= 0),

    constraint inventory_count_items_reserved_snapshot_check
        check (system_reserved <= system_stock),

    constraint inventory_count_items_physical_stock_check
        check (
            physical_stock is null
            or physical_stock >= 0
        )
);


-- ============================================================
-- 3. INDEXES
-- ============================================================

create index idx_inventory_counts_status
    on public.inventory_counts(status);

create index idx_inventory_counts_created_by
    on public.inventory_counts(created_by);

create index idx_inventory_counts_created_at
    on public.inventory_counts(created_at);

create index idx_inventory_count_items_count
    on public.inventory_count_items(count_id);

create index idx_inventory_count_items_inventory
    on public.inventory_count_items(inventory_id);

create index idx_inventory_count_items_sku
    on public.inventory_count_items(sku);


-- ============================================================
-- 4. ROW LEVEL SECURITY BOUNDARY
-- ============================================================

alter table public.inventory_counts
    enable row level security;

alter table public.inventory_count_items
    enable row level security;


-- ============================================================
-- 5. COMMAND — CREATE INVENTORY COUNT
-- ============================================================
--
-- Creates the institutional header for a physical inventory
-- count.
--
-- SECURITY
-- --------
-- Caller identity is obtained exclusively from auth.uid().
-- Authorization is delegated to the platform permission kernel.
--
-- This command DOES NOT:
-- - modify inventory
-- - create inventory movements
-- - accept caller-provided actor identity
-- - accept caller-provided count reference
-- ============================================================

create or replace function public.create_inventory_count(
    p_count_type text default 'STANDARD',
    p_notes text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$

declare
    v_actor_id uuid;
    v_count_id uuid;
    v_reference text;
    v_count_type text;
    v_correlation_id uuid := gen_random_uuid();

begin

    -- ========================================================
    -- 1. AUTHORIZATION
    -- ========================================================

    perform public.assert_platform_permission(
        'INVENTORY_COUNT_CREATE'
    );


    -- ========================================================
    -- 2. TRUSTED ACTOR
    -- ========================================================

    v_actor_id := auth.uid();

    if v_actor_id is null then
        raise exception 'AUTHENTICATION_REQUIRED'
            using errcode = '42501';
    end if;


    -- ========================================================
    -- 3. NORMALIZE AND VALIDATE INPUT
    -- ========================================================

    v_count_type :=
        upper(
            btrim(
                coalesce(
                    p_count_type,
                    'STANDARD'
                )
            )
        );

    if v_count_type not in (
        'STANDARD',
        'FULL'
    ) then
        raise exception 'INVENTORY_COUNT_TYPE_INVALID'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 4. GENERATE SERVER-SIDE IDENTITY
    -- ========================================================

    v_count_id := gen_random_uuid();

    v_reference :=
        'WT-CNT-' ||
        upper(
            replace(
                v_count_id::text,
                '-',
                ''
            )
        );


    -- ========================================================
    -- 5. CREATE COUNT
    -- ========================================================

    insert into public.inventory_counts (
        id,
        reference,
        status,
        count_type,
        notes,
        created_by,
        correlation_id
    )
    values (
        v_count_id,
        v_reference,
        'DRAFT',
        v_count_type,
        nullif(
            btrim(p_notes),
            ''
        ),
        v_actor_id,
        v_correlation_id
    );


    -- ========================================================
    -- 6. INSTITUTIONAL AUDIT
    -- ========================================================

    perform public.record_platform_audit_event(
        'INVENTORY',
        'COUNT_CREATED',
        'INVENTORY_COUNT',
        v_count_id,
        'USER',
        v_actor_id,
        'INVENTORY_COUNT_ENGINE',
        v_correlation_id,
        null,
        null,
        jsonb_build_object(
            'status', 'DRAFT',
            'reference', v_reference,
            'count_type', v_count_type
        ),
        jsonb_build_object(
            'permission',
            'INVENTORY_COUNT_CREATE'
        )
    );


    -- ========================================================
    -- 7. RESULT
    -- ========================================================

    return jsonb_build_object(
        'created',
        true,
        'count_id',
        v_count_id,
        'reference',
        v_reference,
        'status',
        'DRAFT',
        'count_type',
        v_count_type,
        'correlation_id',
        v_correlation_id
    );

end;

$function$;


-- ============================================================
-- 6. K5 AUDIT EVENT VOCABULARY
-- ============================================================
--
-- Controlled institutional vocabulary for physical inventory
-- counts and stock adjustments.
--
-- Approval and application are separate AUDIT FACTS but occur
-- atomically inside the same approval command.
--
--   review_inventory_adjustment(APPROVE)
--          |
--          +--> ADJUSTMENT_APPROVED
--          |
--          +--> inventory.stock mutation
--          |
--          +--> inventory_movements (ADJUSTMENT)
--          |
--          +--> ADJUSTMENT_APPLIED
--
-- Workflow semantics:
--
--   APPROVED = adjustment authorized and successfully applied.
--
-- There is intentionally no intermediate APPROVED-but-not-applied
-- operational state in K5.
--
-- ============================================================

insert into public.audit_event_types (
    domain_code,
    code,
    name,
    description,
    active
)
values
    (
        'INVENTORY',
        'COUNT_CREATED',
        'Conteo de inventario creado',
        'Se creó un nuevo conteo físico de inventario.',
        true
    ),
    (
        'INVENTORY',
        'COUNT_UPDATED',
        'Conteo de inventario actualizado',
        'Se registraron o modificaron cantidades físicas dentro de un conteo de inventario editable.',
        true
    ),
    (
        'INVENTORY',
        'COUNT_SUBMITTED',
        'Conteo de inventario enviado a revisión',
        'El conteo físico fue cerrado por operación y enviado a revisión administrativa.',
        true
    ),
    (
        'INVENTORY',
        'ADJUSTMENT_APPROVED',
        'Ajuste de inventario aprobado',
        'Las diferencias físicas del conteo fueron aprobadas para su aplicación controlada al inventario.',
        true
    ),
    (
        'INVENTORY',
        'ADJUSTMENT_REJECTED',
        'Ajuste de inventario rechazado',
        'Las diferencias físicas del conteo fueron rechazadas durante la revisión administrativa.',
        true
    ),
    (
        'INVENTORY',
        'ADJUSTMENT_APPLIED',
        'Ajuste de inventario aplicado',
        'Las diferencias físicas aprobadas fueron aplicadas al inventario y registradas en el ledger de movimientos.',
        true
    )
on conflict (domain_code, code)
do update set
    name = excluded.name,
    description = excluded.description,
    active = excluded.active;



-- ============================================================
-- 7. COMMAND — UPSERT INVENTORY COUNT ITEM
-- ============================================================
--
-- Registers a physical stock observation inside an editable
-- inventory count.
--
-- TRUST BOUNDARY
-- --------------
-- Caller provides only:
--
--   count_id
--   inventory_id
--   physical_stock
--   observation
--
-- The authoritative SKU, system stock and reserved stock are
-- captured directly from public.inventory.
--
-- This command DOES NOT modify inventory.
-- ============================================================

create or replace function public.upsert_inventory_count_item(
    p_count_id uuid,
    p_inventory_id uuid,
    p_physical_stock integer,
    p_observation text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$

declare
    v_actor_id uuid;

    v_count record;
    v_inventory record;

    v_item_id uuid;
    v_variance integer;

begin

    -- ========================================================
    -- 1. AUTHORIZATION
    -- ========================================================

    perform public.assert_platform_permission(
        'INVENTORY_COUNT_CREATE'
    );


    -- ========================================================
    -- 2. TRUSTED ACTOR
    -- ========================================================

    v_actor_id := auth.uid();

    if v_actor_id is null then
        raise exception 'AUTHENTICATION_REQUIRED'
            using errcode = '42501';
    end if;


    -- ========================================================
    -- 3. INPUT CONTRACT
    -- ========================================================

    if p_count_id is null then
        raise exception 'INVENTORY_COUNT_ID_REQUIRED'
            using errcode = '22023';
    end if;

    if p_inventory_id is null then
        raise exception 'INVENTORY_ID_REQUIRED'
            using errcode = '22023';
    end if;

    if p_physical_stock is null then
        raise exception 'PHYSICAL_STOCK_REQUIRED'
            using errcode = '22023';
    end if;

    if p_physical_stock < 0 then
        raise exception 'PHYSICAL_STOCK_INVALID'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 4. LOCK AND VALIDATE COUNT
    -- ========================================================

    select
        c.id,
        c.reference,
        c.status,
        c.created_by,
        c.correlation_id

    into v_count

    from public.inventory_counts c

    where c.id = p_count_id

    for update;


    if v_count.id is null then
        raise exception 'INVENTORY_COUNT_NOT_FOUND'
            using errcode = '22023';
    end if;


    if v_count.status not in (
        'DRAFT',
        'IN_PROGRESS'
    ) then
        raise exception
            'INVENTORY_COUNT_NOT_EDITABLE: status=%',
            v_count.status
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 5. LOCK AUTHORITATIVE INVENTORY ROW
    -- ========================================================

    select
        i.id,
        i.sku,
        i.stock,
        i.reserved_stock,
        i.active

    into v_inventory

    from public.inventory i

    where i.id = p_inventory_id

    for update;


    if v_inventory.id is null then
        raise exception 'INVENTORY_NOT_FOUND'
            using errcode = '22023';
    end if;


    if v_inventory.active is not true then
        raise exception 'INVENTORY_INACTIVE'
            using errcode = '22023';
    end if;


    if v_inventory.sku is null
       or btrim(v_inventory.sku) = '' then
        raise exception 'INVENTORY_SKU_REQUIRED'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 6. UPSERT PHYSICAL OBSERVATION
    --
    -- IMPORTANT:
    -- Existing item updates intentionally refresh the system
    -- snapshot while the count remains editable.
    -- ========================================================

    insert into public.inventory_count_items (
        count_id,
        inventory_id,
        sku,
        system_stock,
        system_reserved,
        physical_stock,
        observation
    )
    values (
        p_count_id,
        v_inventory.id,
        v_inventory.sku,
        v_inventory.stock,
        v_inventory.reserved_stock,
        p_physical_stock,
        nullif(
            btrim(p_observation),
            ''
        )
    )

    on conflict (count_id, inventory_id)

    do update set
        sku = excluded.sku,
        system_stock = excluded.system_stock,
        system_reserved = excluded.system_reserved,
        physical_stock = excluded.physical_stock,
        observation = excluded.observation,
        updated_at = now()

    returning
        id,
        variance

    into
        v_item_id,
        v_variance;


    -- ========================================================
    -- 7. ADVANCE DRAFT → IN_PROGRESS
    -- ========================================================

    if v_count.status = 'DRAFT' then

        update public.inventory_counts

        set
            status = 'IN_PROGRESS',
            updated_at = now()

        where id = p_count_id;

    else

        update public.inventory_counts

        set updated_at = now()

        where id = p_count_id;

    end if;


    -- ========================================================
    -- 8. INSTITUTIONAL AUDIT
    -- ========================================================

    perform public.record_platform_audit_event(
        'INVENTORY',
        'COUNT_UPDATED',
        'INVENTORY_COUNT',
        p_count_id,
        'USER',
        v_actor_id,
        'INVENTORY_COUNT_ENGINE',
        v_count.correlation_id,
        null,
        null,
        jsonb_build_object(
            'status',
            'IN_PROGRESS',
            'inventory_id',
            v_inventory.id,
            'sku',
            v_inventory.sku,
            'system_stock',
            v_inventory.stock,
            'system_reserved',
            v_inventory.reserved_stock,
            'physical_stock',
            p_physical_stock,
            'variance',
            v_variance
        ),
        jsonb_build_object(
            'permission',
            'INVENTORY_COUNT_CREATE',
            'count_item_id',
            v_item_id
        )
    );


    -- ========================================================
    -- 9. RESULT
    -- ========================================================

    return jsonb_build_object(
        'updated',
        true,
        'count_id',
        p_count_id,
        'count_item_id',
        v_item_id,
        'inventory_id',
        v_inventory.id,
        'sku',
        v_inventory.sku,
        'system_stock',
        v_inventory.stock,
        'system_reserved',
        v_inventory.reserved_stock,
        'physical_stock',
        p_physical_stock,
        'variance',
        v_variance,
        'status',
        'IN_PROGRESS',
        'correlation_id',
        v_count.correlation_id
    );

end;

$function$;


-- ============================================================
-- 8. COMMAND — SUBMIT INVENTORY COUNT
-- ============================================================
--
-- Closes the operational counting phase and sends the physical
-- inventory count to administrative review.
--
-- IMPORTANT:
-- Submission DOES NOT modify inventory and DOES NOT create
-- inventory movements.
--
-- Once submitted, count items are no longer editable.
-- ============================================================

create or replace function public.submit_inventory_count(
    p_count_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$

declare
    v_actor_id uuid;
    v_count record;

    v_item_count integer;
    v_variance_units integer;

begin

    -- ========================================================
    -- 1. AUTHORIZATION
    -- ========================================================

    perform public.assert_platform_permission(
        'INVENTORY_COUNT_SUBMIT'
    );


    -- ========================================================
    -- 2. TRUSTED ACTOR
    -- ========================================================

    v_actor_id := auth.uid();

    if v_actor_id is null then
        raise exception 'AUTHENTICATION_REQUIRED'
            using errcode = '42501';
    end if;


    -- ========================================================
    -- 3. INPUT CONTRACT
    -- ========================================================

    if p_count_id is null then
        raise exception 'INVENTORY_COUNT_ID_REQUIRED'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 4. LOCK COUNT
    -- ========================================================

    select
        c.id,
        c.reference,
        c.status,
        c.created_by,
        c.correlation_id

    into v_count

    from public.inventory_counts c

    where c.id = p_count_id

    for update;


    if v_count.id is null then
        raise exception 'INVENTORY_COUNT_NOT_FOUND'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 5. STATE CONTRACT
    -- ========================================================

    if v_count.status not in (
        'DRAFT',
        'IN_PROGRESS'
    ) then
        raise exception
            'INVENTORY_COUNT_NOT_SUBMITTABLE: status=%',
            v_count.status
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 6. COUNT MUST CONTAIN ITEMS
    -- ========================================================

    select
        count(*),
        coalesce(
            sum(abs(ici.variance)),
            0
        )

    into
        v_item_count,
        v_variance_units

    from public.inventory_count_items ici

    where ici.count_id = p_count_id;


    if v_item_count = 0 then
        raise exception 'INVENTORY_COUNT_HAS_NO_ITEMS'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 7. CLOSE OPERATIONAL COUNT
    -- ========================================================

    update public.inventory_counts

    set
        status = 'SUBMITTED',
        submitted_by = v_actor_id,
        submitted_at = now(),
        updated_at = now()

    where id = p_count_id;


    -- ========================================================
    -- 8. INSTITUTIONAL AUDIT
    -- ========================================================

    perform public.record_platform_audit_event(
        'INVENTORY',
        'COUNT_SUBMITTED',
        'INVENTORY_COUNT',
        p_count_id,
        'USER',
        v_actor_id,
        'INVENTORY_COUNT_ENGINE',
        v_count.correlation_id,
        null,
        jsonb_build_object(
            'status',
            v_count.status
        ),
        jsonb_build_object(
            'status',
            'SUBMITTED',
            'item_count',
            v_item_count,
            'absolute_variance_units',
            v_variance_units
        ),
        jsonb_build_object(
            'permission',
            'INVENTORY_COUNT_SUBMIT'
        )
    );


    -- ========================================================
    -- 9. RESULT
    -- ========================================================

    return jsonb_build_object(
        'submitted',
        true,
        'count_id',
        p_count_id,
        'reference',
        v_count.reference,
        'status',
        'SUBMITTED',
        'item_count',
        v_item_count,
        'absolute_variance_units',
        v_variance_units,
        'correlation_id',
        v_count.correlation_id
    );

end;

$function$;


-- ============================================================
-- 9. COMMAND — REVIEW INVENTORY ADJUSTMENT
-- ============================================================
--
-- Administrative authority reviews a submitted physical count.
--
-- DECISIONS
-- ---------
-- APPROVE
--   Validates every inventory snapshot, applies non-zero
--   variances atomically, writes ADJUSTMENT movements and
--   records institutional approval/application audit events.
--
-- REJECT
--   Rejects the proposed adjustment without modifying stock
--   or creating inventory movements.
--
-- SAFETY
-- ------
-- - Only SUBMITTED counts may be reviewed.
-- - Current stock and reserved stock must still match the
--   snapshots captured during physical counting.
-- - Resulting stock may never fall below reserved_stock.
-- - Zero variance creates no inventory movement.
-- - Movement idempotency is deterministic per count item.
-- - The entire approval path executes in one transaction.
-- ============================================================

create or replace function public.review_inventory_adjustment(
    p_count_id uuid,
    p_decision text,
    p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$

declare
    v_actor_id uuid;
    v_count record;
    v_item record;
    v_inventory record;

    v_decision text;
    v_reason text;

    v_item_count integer := 0;
    v_adjusted_item_count integer := 0;
    v_adjusted_units integer := 0;

    v_stock_after integer;
    v_idempotency_key text;

begin

    -- ========================================================
    -- 1. AUTHORIZATION
    -- ========================================================

    perform public.assert_platform_permission(
        'INVENTORY_ADJUST_APPROVE'
    );


    -- ========================================================
    -- 2. TRUSTED ACTOR
    -- ========================================================

    v_actor_id := auth.uid();

    if v_actor_id is null then
        raise exception 'AUTHENTICATION_REQUIRED'
            using errcode = '42501';
    end if;


    -- ========================================================
    -- 3. INPUT CONTRACT
    -- ========================================================

    if p_count_id is null then
        raise exception 'INVENTORY_COUNT_ID_REQUIRED'
            using errcode = '22023';
    end if;

    v_decision :=
        upper(
            btrim(
                coalesce(
                    p_decision,
                    ''
                )
            )
        );

    if v_decision not in (
        'APPROVE',
        'REJECT'
    ) then
        raise exception 'INVENTORY_ADJUSTMENT_DECISION_INVALID'
            using errcode = '22023';
    end if;

    v_reason :=
        nullif(
            btrim(p_reason),
            ''
        );

    if v_decision = 'REJECT'
       and v_reason is null then
        raise exception 'INVENTORY_ADJUSTMENT_REJECTION_REASON_REQUIRED'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 4. LOCK COUNT
    -- ========================================================

    select
        c.id,
        c.reference,
        c.status,
        c.created_by,
        c.submitted_by,
        c.submitted_at,
        c.correlation_id

    into v_count

    from public.inventory_counts c

    where c.id = p_count_id

    for update;


    if v_count.id is null then
        raise exception 'INVENTORY_COUNT_NOT_FOUND'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 5. STATE CONTRACT
    -- ========================================================

    if v_count.status <> 'SUBMITTED' then
        raise exception
            'INVENTORY_COUNT_NOT_REVIEWABLE: status=%',
            v_count.status
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 6. COUNT MUST STILL CONTAIN ITEMS
    -- ========================================================

    select count(*)
    into v_item_count
    from public.inventory_count_items ici
    where ici.count_id = p_count_id;

    if v_item_count = 0 then
        raise exception 'INVENTORY_COUNT_HAS_NO_ITEMS'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 7. REJECTION PATH
    -- ========================================================

    if v_decision = 'REJECT' then

        update public.inventory_counts

        set
            status = 'REJECTED',
            reviewed_by = v_actor_id,
            reviewed_at = now(),
            review_reason = v_reason,
            updated_at = now()

        where id = p_count_id;


        perform public.record_platform_audit_event(
            'INVENTORY',
            'ADJUSTMENT_REJECTED',
            'INVENTORY_COUNT',
            p_count_id,
            'USER',
            v_actor_id,
            'INVENTORY_ADJUSTMENT_ENGINE',
            v_count.correlation_id,
            v_reason,
            jsonb_build_object(
                'status',
                'SUBMITTED'
            ),
            jsonb_build_object(
                'status',
                'REJECTED'
            ),
            jsonb_build_object(
                'permission',
                'INVENTORY_ADJUST_APPROVE',
                'item_count',
                v_item_count
            )
        );


        return jsonb_build_object(
            'reviewed',
            true,
            'approved',
            false,
            'applied',
            false,
            'count_id',
            p_count_id,
            'reference',
            v_count.reference,
            'status',
            'REJECTED',
            'item_count',
            v_item_count,
            'correlation_id',
            v_count.correlation_id
        );

    end if;


    -- ========================================================
    -- 8. APPROVAL — PROCESS ITEMS
    -- ========================================================
    --
    -- Inventory rows are locked in deterministic UUID order.
    -- Snapshot equality is mandatory before any adjustment.
    -- ========================================================

    for v_item in

        select
            ici.id,
            ici.inventory_id,
            ici.sku,
            ici.system_stock,
            ici.system_reserved,
            ici.physical_stock,
            ici.variance

        from public.inventory_count_items ici

        where ici.count_id = p_count_id

        order by
            ici.inventory_id,
            ici.id

    loop

        -- ----------------------------------------------------
        -- LOCK CURRENT INVENTORY
        -- ----------------------------------------------------

        select
            i.id,
            i.product_id,
            i.sku,
            i.stock,
            i.reserved_stock,
            i.active

        into v_inventory

        from public.inventory i

        where i.id = v_item.inventory_id

        for update;


        if v_inventory.id is null then
            raise exception
                'INVENTORY_NOT_FOUND: inventory_id=%',
                v_item.inventory_id
                using errcode = '22023';
        end if;


        -- ----------------------------------------------------
        -- IDENTITY CONTRACT
        -- ----------------------------------------------------

        if v_inventory.sku is distinct from v_item.sku then
            raise exception
                'INVENTORY_COUNT_SKU_MISMATCH: inventory_id=%',
                v_item.inventory_id
                using errcode = '22023';
        end if;


        -- ----------------------------------------------------
        -- STALE SNAPSHOT GUARD
        -- ----------------------------------------------------

        if v_inventory.stock <> v_item.system_stock
           or v_inventory.reserved_stock <> v_item.system_reserved then

            raise exception
                'INVENTORY_COUNT_SNAPSHOT_STALE: sku=% system_stock=% current_stock=% system_reserved=% current_reserved=%',
                v_item.sku,
                v_item.system_stock,
                v_inventory.stock,
                v_item.system_reserved,
                v_inventory.reserved_stock
                using errcode = '40001';

        end if;


        -- ----------------------------------------------------
        -- RESULTING STOCK
        -- ----------------------------------------------------

        v_stock_after :=
            v_inventory.stock +
            v_item.variance;


        if v_stock_after < 0 then
            raise exception
                'INVENTORY_ADJUSTMENT_NEGATIVE_STOCK: sku=% stock_after=%',
                v_item.sku,
                v_stock_after
                using errcode = '22023';
        end if;


        if v_stock_after < v_inventory.reserved_stock then
            raise exception
                'INVENTORY_ADJUSTMENT_BELOW_RESERVED: sku=% stock_after=% reserved=%',
                v_item.sku,
                v_stock_after,
                v_inventory.reserved_stock
                using errcode = '22023';
        end if;


        -- ----------------------------------------------------
        -- ZERO VARIANCE
        -- ----------------------------------------------------

        if v_item.variance = 0 then
            continue;
        end if;


        -- ----------------------------------------------------
        -- DETERMINISTIC IDEMPOTENCY
        -- ----------------------------------------------------

        v_idempotency_key :=
            'INV-ADJ:' ||
            p_count_id::text ||
            ':' ||
            v_item.id::text;


        if exists (
            select 1
            from public.inventory_movements im
            where im.idempotency_key = v_idempotency_key
        ) then
            raise exception
                'INVENTORY_ADJUSTMENT_ALREADY_APPLIED: count_item_id=%',
                v_item.id
                using errcode = '23505';
        end if;


        -- ----------------------------------------------------
        -- APPLY STOCK
        -- ----------------------------------------------------

        update public.inventory

        set
            stock = v_stock_after,
            updated_at = now()

        where id = v_inventory.id;


        -- ----------------------------------------------------
        -- AUTHORITATIVE MOVEMENT LEDGER
        -- ----------------------------------------------------

        insert into public.inventory_movements (
            inventory_id,
            order_id,
            product_id,
            sku,
            movement_type,
            quantity_delta,
            stock_before,
            stock_after,
            reference,
            idempotency_key
        )
        values (
            v_inventory.id,
            null,
            v_inventory.product_id,
            v_inventory.sku,
            'ADJUSTMENT',
            v_item.variance,
            v_inventory.stock,
            v_stock_after,
            v_count.reference,
            v_idempotency_key
        );


        v_adjusted_item_count :=
            v_adjusted_item_count + 1;

        v_adjusted_units :=
            v_adjusted_units +
            abs(v_item.variance);

    end loop;


    -- ========================================================
    -- 9. RECORD APPROVAL
    -- ========================================================

    update public.inventory_counts

    set
        status = 'APPROVED',
        reviewed_by = v_actor_id,
        reviewed_at = now(),
        review_reason = v_reason,
        updated_at = now()

    where id = p_count_id;


    -- ========================================================
    -- 10. AUDIT — AUTHORITY DECISION
    -- ========================================================

    perform public.record_platform_audit_event(
        'INVENTORY',
        'ADJUSTMENT_APPROVED',
        'INVENTORY_COUNT',
        p_count_id,
        'USER',
        v_actor_id,
        'INVENTORY_ADJUSTMENT_ENGINE',
        v_count.correlation_id,
        v_reason,
        jsonb_build_object(
            'status',
            'SUBMITTED'
        ),
        jsonb_build_object(
            'status',
            'APPROVED'
        ),
        jsonb_build_object(
            'permission',
            'INVENTORY_ADJUST_APPROVE',
            'item_count',
            v_item_count
        )
    );


    -- ========================================================
    -- 11. AUDIT — PHYSICAL APPLICATION
    -- ========================================================

    perform public.record_platform_audit_event(
        'INVENTORY',
        'ADJUSTMENT_APPLIED',
        'INVENTORY_COUNT',
        p_count_id,
        'USER',
        v_actor_id,
        'INVENTORY_ADJUSTMENT_ENGINE',
        v_count.correlation_id,
        v_reason,
        jsonb_build_object(
            'status',
            'SUBMITTED'
        ),
        jsonb_build_object(
            'status',
            'APPROVED',
            'adjusted_item_count',
            v_adjusted_item_count,
            'absolute_adjusted_units',
            v_adjusted_units
        ),
        jsonb_build_object(
            'permission',
            'INVENTORY_ADJUST_APPROVE',
            'movement_type',
            'ADJUSTMENT'
        )
    );


    -- ========================================================
    -- 12. RESULT
    -- ========================================================

    return jsonb_build_object(
        'reviewed',
        true,
        'approved',
        true,
        'applied',
        true,
        'count_id',
        p_count_id,
        'reference',
        v_count.reference,
        'status',
        'APPROVED',
        'item_count',
        v_item_count,
        'adjusted_item_count',
        v_adjusted_item_count,
        'absolute_adjusted_units',
        v_adjusted_units,
        'correlation_id',
        v_count.correlation_id
    );

end;

$function$;


-- ============================================================
-- 10. SECURITY HARDENING
-- ============================================================
--
-- K5 uses a command-only mutation surface.
--
-- Direct table mutation is not exposed to API roles.
-- Authenticated clients execute institutional commands, which:
--
--   1. derive identity from auth.uid()
--   2. assert platform permission
--   3. execute under SECURITY DEFINER
--   4. preserve audit and ledger invariants
--
-- RLS remains enabled as defense in depth.
-- ============================================================


-- ============================================================
-- 10.1 TABLE PRIVILEGE BOUNDARY
-- ============================================================

revoke all on table public.inventory_counts
from public, anon, authenticated;

revoke all on table public.inventory_count_items
from public, anon, authenticated;


-- ============================================================
-- 10.2 COMMAND EXECUTION SURFACE
-- ============================================================

revoke all on function public.create_inventory_count(
    text,
    text
)
from public, anon;

grant execute on function public.create_inventory_count(
    text,
    text
)
to authenticated;


revoke all on function public.upsert_inventory_count_item(
    uuid,
    uuid,
    integer,
    text
)
from public, anon;

grant execute on function public.upsert_inventory_count_item(
    uuid,
    uuid,
    integer,
    text
)
to authenticated;


revoke all on function public.submit_inventory_count(
    uuid
)
from public, anon;

grant execute on function public.submit_inventory_count(
    uuid
)
to authenticated;


revoke all on function public.review_inventory_adjustment(
    uuid,
    text,
    text
)
from public, anon;

grant execute on function public.review_inventory_adjustment(
    uuid,
    text,
    text
)
to authenticated;


-- ============================================================
-- 10.3 SECURITY CONTRACT
-- ============================================================
--
-- No direct table policies are intentionally introduced here.
--
-- RLS + revoked table privileges prevent direct client access.
--
-- Business mutation is available only through the authenticated
-- command RPC surface above.
--
-- Each command remains responsible for its own institutional
-- authorization through assert_platform_permission(...).
--
-- ============================================================


