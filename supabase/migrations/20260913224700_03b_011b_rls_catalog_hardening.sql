-- 03B Commercial Platform
-- Patch: 03B-011B RLS catalog hardening
--
-- Pre-flight finding:
--   raw permission catalogs / role maps are institutional security configuration
--   and should not be enumerable by every authenticated account.
--   SECURITY DEFINER RLS helpers also use the stricter fixed search_path used by
--   the command layer.

begin;

-- -----------------------------------------------------------------------------
-- SECURITY DEFINER SEARCH PATH HARDENING
-- -----------------------------------------------------------------------------

alter function public.has_active_platform_permission(text)
  set search_path = pg_catalog, public;

alter function public.has_active_store_membership(uuid)
  set search_path = pg_catalog, public;

alter function public.has_store_location_access(uuid, uuid)
  set search_path = pg_catalog, public;

alter function public.has_active_store_permission(uuid, uuid, text)
  set search_path = pg_catalog, public;

-- -----------------------------------------------------------------------------
-- RAW CAPABILITY CONFIGURATION IS NOT A GENERAL AUTHENTICATED READ SURFACE
-- -----------------------------------------------------------------------------
-- Effective capability is resolved by SECURITY DEFINER helpers/commands.
-- A Store user therefore does not need the complete institutional matrix.
-- If a future UI needs "my capabilities", expose a filtered RPC rather than
-- publishing every role -> permission relation.

DROP POLICY IF EXISTS permissions_read_authenticated
  ON public.permissions;

DROP POLICY IF EXISTS platform_role_permissions_read_authenticated
  ON public.platform_role_permissions;

DROP POLICY IF EXISTS store_role_permissions_read_authenticated
  ON public.store_role_permissions;

create policy permissions_read_authorized
  on public.permissions
  for select
  to authenticated
  using (
    public.has_active_platform_permission('platform_role.read')
    or public.has_active_platform_permission('audit.read')
  );

create policy platform_role_permissions_read_authorized
  on public.platform_role_permissions
  for select
  to authenticated
  using (
    public.has_active_platform_permission('platform_role.read')
    or public.has_active_platform_permission('audit.read')
  );

create policy store_role_permissions_read_authorized
  on public.store_role_permissions
  for select
  to authenticated
  using (
    public.has_active_platform_permission('platform_role.read')
    or public.has_active_platform_permission('audit.read')
  );

commit;
