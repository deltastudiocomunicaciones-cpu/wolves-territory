-- ============================================================
-- Wolves Territory — 03B Commercial Platform
-- K3-D — Dispatch Engine
-- ============================================================
--
-- Purpose:
--   Complete the physical inventory boundary:
--
--       PACKED -> DISPATCHED
--
--   Dispatch consumes inventory previously reserved by
--   reserve_order_for_fulfillment().
--
-- Invariant:
--
--   stock_after          = stock_before - quantity
--   reserved_after       = reserved_before - quantity
--   available_after      = available_before
--
-- Safety:
--   - SECURITY DEFINER
--   - hardened search_path
--   - authenticated active admin
--   - explicit platform permission
--   - row locks
--   - deterministic inventory ledger idempotency
--   - atomic PostgreSQL transaction
-- ============================================================


-- ============================================================
-- 1. INVENTORY MOVEMENT VOCABULARY
-- ============================================================

alter table public.inventory_movements
    drop constraint if exists inventory_movements_movement_type_check;

alter table public.inventory_movements
    add constraint inventory_movements_movement_type_check
    check (
        movement_type = any (
            array[
                'SALE'::text,
                'RESTOCK'::text,
                'RETURN'::text,
                'ADJUSTMENT'::text,
                'DISPATCH'::text
            ]
        )
    );


-- ============================================================
-- 2. DISPATCH AUTHORITY
-- ============================================================

create or replace function public.dispatch_fulfillment(
    p_fulfillment_id uuid,
    p_carrier text,
    p_tracking_number text,
    p_tracking_url text default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'pg_catalog'
as $function$

declare
    v_auth_user_id uuid;
v_admin_user_id uuid;
    v_fulfillment public.fulfillments%rowtype;
    v_item record;
    v_inventory public.inventory%rowtype;

    v_carrier text;
    v_tracking_number text;
    v_tracking_url text;

    v_stock_before integer;
    v_stock_after integer;
    v_reserved_before integer;
    v_reserved_after integer;

    v_idempotency_key text;
    v_existing_movement_id uuid;

    v_before_state jsonb;
    v_after_state jsonb;

begin

    -- ========================================================
    -- 1. AUTHENTICATED ACTOR
    -- ========================================================

   v_auth_user_id := auth.uid();

if v_auth_user_id is null then
    raise exception
        'AUTHENTICATION_REQUIRED'
        using errcode = '42501';
end if;


    -- ========================================================
    -- 2. PLATFORM AUTHORITY
    -- ========================================================

    perform public.assert_platform_permission(
        'FULFILLMENT_DISPATCH'
    );

    select au.id
into v_admin_user_id
from public.admin_users au
where au.auth_user_id = v_auth_user_id
  and au.active = true
limit 1;

if v_admin_user_id is null then
    raise exception
        'ACTIVE_ADMIN_USER_REQUIRED'
        using errcode = '42501';
end if;


    -- ========================================================
    -- 3. NORMALIZE LOGISTICS INPUT
    -- ========================================================

    v_carrier :=
        nullif(btrim(p_carrier), '');

    v_tracking_number :=
        nullif(btrim(p_tracking_number), '');

    v_tracking_url :=
        nullif(btrim(p_tracking_url), '');

    if v_carrier is null then
        raise exception
            'FULFILLMENT_CARRIER_REQUIRED'
            using errcode = '22023';
    end if;

    if v_tracking_number is null then
        raise exception
            'FULFILLMENT_TRACKING_NUMBER_REQUIRED'
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 4. LOCK FULFILLMENT
    -- ========================================================

    select f.*
    into v_fulfillment
    from public.fulfillments f
    where f.id = p_fulfillment_id
    for update;

    if not found then
        raise exception
            'FULFILLMENT_NOT_FOUND'
            using errcode = 'P0002';
    end if;


    -- ========================================================
    -- 5. IDEMPOTENT RETRY
    -- ========================================================

    if v_fulfillment.status = 'DISPATCHED' then

            if v_fulfillment.carrier is distinct from v_carrier
           or v_fulfillment.tracking_number is distinct from v_tracking_number
           or v_fulfillment.tracking_url is distinct from v_tracking_url then
            raise exception
                'FULFILLMENT_DISPATCH_RETRY_CONFLICT'
                using errcode = '22023';
        end if;


        return jsonb_build_object(
            'fulfillment_id',
            v_fulfillment.id,
            'order_id',
            v_fulfillment.order_id,
            'reference',
            v_fulfillment.reference,
            'status',
            v_fulfillment.status,
            'carrier',
            v_fulfillment.carrier,
            'tracking_number',
            v_fulfillment.tracking_number,
            'tracking_url',
            v_fulfillment.tracking_url,
            'dispatched_at',
            v_fulfillment.dispatched_at,
            'idempotent',
            true
        );

    end if;


    -- ========================================================
    -- 6. STATE TRANSITION
    -- ========================================================

    if v_fulfillment.status <> 'PACKED' then
        raise exception
            'FULFILLMENT_DISPATCH_INVALID_STATE: %',
            v_fulfillment.status
            using errcode = '22023';
    end if;


    -- ========================================================
    -- 7. AUDIT BEFORE STATE
    -- ========================================================

    v_before_state := jsonb_build_object(
        'status',
        v_fulfillment.status,
        'carrier',
        v_fulfillment.carrier,
        'tracking_number',
        v_fulfillment.tracking_number,
        'tracking_url',
        v_fulfillment.tracking_url,
        'dispatched_by',
        v_fulfillment.dispatched_by,
        'dispatched_at',
        v_fulfillment.dispatched_at
    );


    -- ========================================================
    -- 8. CONSUME RESERVED PHYSICAL INVENTORY
    -- ========================================================

         if not exists (
        select 1
        from public.fulfillment_items fi
        where fi.fulfillment_id = v_fulfillment.id
    ) then
        raise exception
            'FULFILLMENT_ITEMS_REQUIRED'
            using errcode = '22023';
    end if;


    for v_item in
        select
            fi.id as fulfillment_item_id,
            fi.inventory_id,
            fi.product_id,
            fi.sku,
            fi.quantity
        from public.fulfillment_items fi
        where fi.fulfillment_id = v_fulfillment.id
        order by fi.inventory_id
    loop

        select i.*
        into v_inventory
        from public.inventory i
        where i.id = v_item.inventory_id
        for update;

        if not found then
            raise exception
                'FULFILLMENT_INVENTORY_NOT_FOUND: %',
                v_item.inventory_id
                using errcode = 'P0002';
        end if;

        if v_item.quantity is null
           or v_item.quantity <= 0 then
            raise exception
                'FULFILLMENT_ITEM_QUANTITY_INVALID'
                using errcode = '22023';
        end if;

        if v_inventory.stock < v_item.quantity then
            raise exception
                'FULFILLMENT_STOCK_INSUFFICIENT: inventory=% stock=% required=%',
                v_inventory.id,
                v_inventory.stock,
                v_item.quantity
                using errcode = '22023';
        end if;

        if coalesce(v_inventory.reserved_stock, 0)
           < v_item.quantity then
            raise exception
                'FULFILLMENT_RESERVED_STOCK_INSUFFICIENT: inventory=% reserved=% required=%',
                v_inventory.id,
                coalesce(v_inventory.reserved_stock, 0),
                v_item.quantity
                using errcode = '22023';
        end if;

        v_stock_before :=
            v_inventory.stock;

        v_stock_after :=
            v_inventory.stock - v_item.quantity;

        v_reserved_before :=
            coalesce(v_inventory.reserved_stock, 0);

        v_reserved_after :=
            v_reserved_before - v_item.quantity;

        v_idempotency_key :=
            'DISPATCH:'
            || v_fulfillment.id::text
            || ':'
            || v_inventory.id::text;


        -- ----------------------------------------------------
        -- Defense in depth:
        -- a movement for this fulfillment/inventory pair must
        -- never be materialized twice.
        -- ----------------------------------------------------

        select im.id
        into v_existing_movement_id
        from public.inventory_movements im
        where im.idempotency_key = v_idempotency_key
        limit 1;

        if v_existing_movement_id is not null then
            raise exception
                'FULFILLMENT_DISPATCH_MOVEMENT_ALREADY_EXISTS: %',
                v_idempotency_key
                using errcode = '23505';
        end if;


        update public.inventory
        set
            stock = v_stock_after,
            reserved_stock = v_reserved_after,
            updated_at = now()
        where id = v_inventory.id;


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
            v_fulfillment.order_id,
            v_item.product_id,
            v_item.sku,
            'DISPATCH',
            -v_item.quantity,
            v_stock_before,
            v_stock_after,
            v_fulfillment.reference,
            v_idempotency_key
        );

    end loop;


    -- ========================================================
    -- 9. MATERIALIZE DISPATCH
    -- ========================================================

    update public.fulfillments
    set
        status = 'DISPATCHED',
        carrier = v_carrier,
        tracking_number = v_tracking_number,
        tracking_url = v_tracking_url,
        dispatched_by = v_admin_user_id,
        dispatched_at = now(),
        updated_at = now()
    where id = v_fulfillment.id
    returning *
    into v_fulfillment;


    -- ========================================================
    -- 10. AUDIT AFTER STATE
    -- ========================================================

    v_after_state := jsonb_build_object(
        'status',
        v_fulfillment.status,
        'carrier',
        v_fulfillment.carrier,
        'tracking_number',
        v_fulfillment.tracking_number,
        'tracking_url',
        v_fulfillment.tracking_url,
        'dispatched_by',
        v_fulfillment.dispatched_by,
        'dispatched_at',
        v_fulfillment.dispatched_at
    );


    -- ========================================================
    -- 11. INSTITUTIONAL AUDIT
    -- ========================================================

    perform public.record_platform_audit_event(
        'FULFILLMENT',
        'ORDER_DISPATCHED',
        'FULFILLMENT',
        v_fulfillment.id,
        'USER',
        v_admin_user_id,
        'OPERATIONS',
        v_fulfillment.correlation_id,
        'Physical order dispatch confirmed',
        v_before_state,
        v_after_state,
        jsonb_build_object(
            'order_id',
            v_fulfillment.order_id,
            'reference',
            v_fulfillment.reference,
            'carrier',
            v_carrier,
            'tracking_number',
            v_tracking_number
        )
    );


    -- ========================================================
    -- 12. RESULT
    -- ========================================================

    return jsonb_build_object(
        'fulfillment_id',
        v_fulfillment.id,
        'order_id',
        v_fulfillment.order_id,
        'reference',
        v_fulfillment.reference,
        'status',
        v_fulfillment.status,
        'carrier',
        v_fulfillment.carrier,
        'tracking_number',
        v_fulfillment.tracking_number,
        'tracking_url',
        v_fulfillment.tracking_url,
        'dispatched_at',
        v_fulfillment.dispatched_at,
        'idempotent',
        false
    );

end;

$function$;


-- ============================================================
-- 3. EXECUTION HARDENING
-- ============================================================

revoke all on function public.dispatch_fulfillment(
    uuid,
    text,
    text,
    text
) from public;

revoke all on function public.dispatch_fulfillment(
    uuid,
    text,
    text,
    text
) from anon;

grant execute on function public.dispatch_fulfillment(
    uuid,
    text,
    text,
    text
) to authenticated;