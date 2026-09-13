-- 03B Commercial Platform
-- Migration: 03B-011 RLS + Storage Policies
-- Architecture Freeze: V1
--
-- Security thesis:
--   functions define legitimate business actions;
--   RLS defines which rows an identity may reach;
--   constraints define impossible states;
--   audit records meaningful business/security events.
--
-- Default posture: DENY unless an explicit policy grants access.

begin;

-- -----------------------------------------------------------------------------
-- HELPER FUNCTIONS FOR RLS
-- -----------------------------------------------------------------------------

create or replace function public.has_active_platform_permission(
  p_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.platform_user_roles pur
    join public.platform_role_permissions prp
      on prp.role = pur.role
    join public.permissions p
      on p.id = prp.permission_id
    where pur.user_id = auth.uid()
      and pur.status = 'ACTIVE'
      and p.code = p_permission_code
      and p.is_active = true
  );
$$;

revoke all on function public.has_active_platform_permission(text) from public;
grant execute on function public.has_active_platform_permission(text) to authenticated;

create or replace function public.has_active_store_membership(
  p_store_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.commercial_store_memberships m
    join public.commercial_stores s on s.id = m.store_id
    where m.user_id = auth.uid()
      and m.store_id = p_store_id
      and m.status = 'ACTIVE'
      and s.status not in ('CLOSED', 'REJECTED')
  );
$$;

revoke all on function public.has_active_store_membership(uuid) from public;
grant execute on function public.has_active_store_membership(uuid) to authenticated;

create or replace function public.has_store_location_access(
  p_store_id uuid,
  p_location_id uuid
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.commercial_store_memberships m
    join public.commercial_stores s on s.id = m.store_id
    join public.commercial_store_locations l
      on l.id = p_location_id
     and l.store_id = m.store_id
    where m.user_id = auth.uid()
      and m.store_id = p_store_id
      and m.status = 'ACTIVE'
      and s.status not in ('CLOSED', 'REJECTED')
      and (
        m.location_access_mode = 'ALL_LOCATIONS'
        or (
          m.location_access_mode = 'SELECTED_LOCATIONS'
          and exists (
            select 1
            from public.commercial_store_membership_locations ml
            where ml.membership_id = m.id
              and ml.store_id = m.store_id
              and ml.location_id = p_location_id
          )
        )
      )
  );
$$;

revoke all on function public.has_store_location_access(uuid, uuid) from public;
grant execute on function public.has_store_location_access(uuid, uuid) to authenticated;

create or replace function public.has_active_store_permission(
  p_store_id uuid,
  p_location_id uuid,
  p_permission_code text
)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.commercial_store_memberships m
    join public.commercial_stores s on s.id = m.store_id
    join public.store_role_permissions srp
      on srp.role = m.role
    join public.permissions p
      on p.id = srp.permission_id
    where m.user_id = auth.uid()
      and m.store_id = p_store_id
      and m.status = 'ACTIVE'
      and s.status not in ('CLOSED', 'REJECTED')
      and p.code = p_permission_code
      and p.is_active = true
      and (
        p.scope <> 'LOCATION'
        or (
          p_location_id is not null
          and public.has_store_location_access(p_store_id, p_location_id)
        )
      )
  );
$$;

revoke all on function public.has_active_store_permission(uuid, uuid, text) from public;
grant execute on function public.has_active_store_permission(uuid, uuid, text) to authenticated;

-- -----------------------------------------------------------------------------
-- ENABLE RLS
-- -----------------------------------------------------------------------------

alter table public.commercial_stores enable row level security;
alter table public.commercial_store_locations enable row level security;
alter table public.commercial_document_types enable row level security;
alter table public.commercial_store_documents enable row level security;
alter table public.evaluation_methodologies enable row level security;
alter table public.evaluation_dimensions enable row level security;
alter table public.evaluation_criteria_catalog enable row level security;
alter table public.evaluation_gate_catalog enable row level security;
alter table public.evaluation_classification_bands enable row level security;
alter table public.store_evaluations enable row level security;
alter table public.store_evaluation_items enable row level security;
alter table public.store_gate_checks enable row level security;
alter table public.store_evaluation_reviews enable row level security;
alter table public.store_evaluation_evidence enable row level security;
alter table public.commercial_store_invitations enable row level security;
alter table public.commercial_store_invitation_locations enable row level security;
alter table public.commercial_store_memberships enable row level security;
alter table public.commercial_store_membership_locations enable row level security;
alter table public.permissions enable row level security;
alter table public.platform_user_roles enable row level security;
alter table public.platform_role_permissions enable row level security;
alter table public.store_role_permissions enable row level security;
alter table public.governance_policies enable row level security;
alter table public.audit_event_types enable row level security;
alter table public.audit_events enable row level security;

-- -----------------------------------------------------------------------------
-- PLATFORM CONFIG / METHODOLOGY READ POLICIES
-- -----------------------------------------------------------------------------
-- Authenticated users may read active catalog/config rows that are needed to
-- render approved workflows. Mutations remain command-only.

create policy methodologies_read_active_or_platform
  on public.evaluation_methodologies
  for select
  to authenticated
  using (
    status = 'ACTIVE'
    or public.has_active_platform_permission('methodology.read')
  );

create policy dimensions_read_visible_methodology
  on public.evaluation_dimensions
  for select
  to authenticated
  using (
    exists (
      select 1 from public.evaluation_methodologies m
      where m.id = methodology_id
        and (
          m.status = 'ACTIVE'
          or public.has_active_platform_permission('methodology.read')
        )
    )
  );

create policy criteria_read_visible_methodology
  on public.evaluation_criteria_catalog
  for select
  to authenticated
  using (
    exists (
      select 1 from public.evaluation_methodologies m
      where m.id = methodology_id
        and (
          m.status = 'ACTIVE'
          or public.has_active_platform_permission('methodology.read')
        )
    )
  );

create policy gates_read_visible_methodology
  on public.evaluation_gate_catalog
  for select
  to authenticated
  using (
    exists (
      select 1 from public.evaluation_methodologies m
      where m.id = methodology_id
        and (
          m.status = 'ACTIVE'
          or public.has_active_platform_permission('methodology.read')
        )
    )
  );

create policy bands_read_visible_methodology
  on public.evaluation_classification_bands
  for select
  to authenticated
  using (
    exists (
      select 1 from public.evaluation_methodologies m
      where m.id = methodology_id
        and (
          m.status = 'ACTIVE'
          or public.has_active_platform_permission('methodology.read')
        )
    )
  );

create policy governance_read_active_or_platform
  on public.governance_policies
  for select
  to authenticated
  using (
    status = 'ACTIVE'
    or public.has_active_platform_permission('governance.read')
  );

create policy permissions_read_authenticated
  on public.permissions
  for select
  to authenticated
  using (is_active = true);

create policy platform_role_permissions_read_authenticated
  on public.platform_role_permissions
  for select
  to authenticated
  using (true);

create policy store_role_permissions_read_authenticated
  on public.store_role_permissions
  for select
  to authenticated
  using (true);

-- -----------------------------------------------------------------------------
-- STORES / LOCATIONS — ROW VISIBILITY
-- -----------------------------------------------------------------------------

create policy commercial_stores_select
  on public.commercial_stores
  for select
  to authenticated
  using (
    public.has_active_platform_permission('store.read')
    or public.has_active_store_membership(id)
  );

create policy commercial_store_locations_select
  on public.commercial_store_locations
  for select
  to authenticated
  using (
    public.has_active_platform_permission('store.read')
    or public.has_store_location_access(store_id, id)
  );

-- No direct INSERT/UPDATE/DELETE policies are created for Stores/Locations.
-- Controlled writes are executed through command functions.

-- -----------------------------------------------------------------------------
-- MEMBERSHIPS / INVITATIONS
-- -----------------------------------------------------------------------------

create policy store_memberships_select
  on public.commercial_store_memberships
  for select
  to authenticated
  using (
    public.has_active_platform_permission('membership.read')
    or user_id = auth.uid()
    or public.has_active_store_permission(store_id, null, 'membership.read')
  );

create policy store_membership_locations_select
  on public.commercial_store_membership_locations
  for select
  to authenticated
  using (
    public.has_active_platform_permission('membership.read')
    or exists (
      select 1
      from public.commercial_store_memberships m
      where m.id = membership_id
        and (
          m.user_id = auth.uid()
          or public.has_active_store_permission(m.store_id, null, 'membership.read')
        )
    )
  );

create policy store_invitations_select
  on public.commercial_store_invitations
  for select
  to authenticated
  using (
    public.has_active_platform_permission('membership.read')
    or public.has_active_store_permission(store_id, null, 'membership.read')
  );

create policy store_invitation_locations_select
  on public.commercial_store_invitation_locations
  for select
  to authenticated
  using (
    public.has_active_platform_permission('membership.read')
    or public.has_active_store_permission(store_id, null, 'membership.read')
  );

-- Invitation tokens are intentionally not readable from these tables because
-- only token hashes are persisted and acceptance must execute through a command.

-- -----------------------------------------------------------------------------
-- EVALUATIONS / ITEMS / GATES
-- -----------------------------------------------------------------------------

create policy store_evaluations_select
  on public.store_evaluations
  for select
  to authenticated
  using (
    public.has_active_platform_permission('evaluation.read')
    or (
      location_id is null
      and public.has_active_store_membership(store_id)
    )
    or (
      location_id is not null
      and public.has_store_location_access(store_id, location_id)
    )
  );

create policy evaluation_items_select
  on public.store_evaluation_items
  for select
  to authenticated
  using (
    exists (
      select 1 from public.store_evaluations e
      where e.id = evaluation_id
        and (
          public.has_active_platform_permission('evaluation.read')
          or (
            e.location_id is null
            and public.has_active_store_membership(e.store_id)
          )
          or (
            e.location_id is not null
            and public.has_store_location_access(e.store_id, e.location_id)
          )
        )
    )
  );

create policy gate_checks_select
  on public.store_gate_checks
  for select
  to authenticated
  using (
    exists (
      select 1 from public.store_evaluations e
      where e.id = evaluation_id
        and (
          public.has_active_platform_permission('evaluation.read')
          or (
            e.location_id is null
            and public.has_active_store_membership(e.store_id)
          )
          or (
            e.location_id is not null
            and public.has_store_location_access(e.store_id, e.location_id)
          )
        )
    )
  );

-- Partner review rows can contain internal deliberation. Raw review rows are
-- platform-only; Store users later receive a filtered projection/timeline.
create policy evaluation_reviews_select_platform
  on public.store_evaluation_reviews
  for select
  to authenticated
  using (
    public.has_active_platform_permission('evaluation.review')
    or public.has_active_platform_permission('evaluation.finalize')
    or public.has_active_platform_permission('audit.read')
  );

-- -----------------------------------------------------------------------------
-- DOCUMENTS / EVIDENCE
-- -----------------------------------------------------------------------------

create policy document_types_select_authenticated
  on public.commercial_document_types
  for select
  to authenticated
  using (is_active = true or public.has_active_platform_permission('document.read'));

create policy store_documents_select
  on public.commercial_store_documents
  for select
  to authenticated
  using (
    public.has_active_platform_permission('document.read')
    or (
      location_id is null
      and public.has_active_store_membership(store_id)
    )
    or (
      location_id is not null
      and public.has_store_location_access(store_id, location_id)
    )
  );

create policy evaluation_evidence_select
  on public.store_evaluation_evidence
  for select
  to authenticated
  using (
    exists (
      select 1 from public.store_evaluations e
      where e.id = evaluation_id
        and (
          public.has_active_platform_permission('evidence.read')
          or (
            e.location_id is null
            and public.has_active_store_membership(e.store_id)
          )
          or (
            e.location_id is not null
            and public.has_store_location_access(e.store_id, e.location_id)
          )
        )
    )
  );

-- -----------------------------------------------------------------------------
-- PLATFORM ROLES / AUDIT
-- -----------------------------------------------------------------------------

create policy platform_user_roles_select_self_or_authorized
  on public.platform_user_roles
  for select
  to authenticated
  using (
    user_id = auth.uid()
    or public.has_active_platform_permission('platform_role.read')
  );

create policy audit_event_types_select_authorized
  on public.audit_event_types
  for select
  to authenticated
  using (
    public.has_active_platform_permission('audit.read')
  );

create policy audit_events_select_authorized
  on public.audit_events
  for select
  to authenticated
  using (
    public.has_active_platform_permission('audit.read')
  );

-- No direct INSERT/UPDATE/DELETE policy is defined for audit_events.
-- Append-only writes belong to trusted internal command functions.

-- -----------------------------------------------------------------------------
-- PRIVATE STORAGE BOUNDARY
-- -----------------------------------------------------------------------------
-- This migration intentionally does NOT assume a production bucket name before
-- the real Supabase project is reconciled. Storage bucket creation and concrete
-- policies are applied only after production discovery.
--
-- Required production posture:
--   bucket private, never public;
--   DB stores bucket + object path, never a signed URL;
--   signed URLs are short-lived and generated server-side;
--   object paths are namespaced by Store / Location / Evaluation;
--   upload/download authorization mirrors DB membership + permission + scope;
--   clients never receive service_role credentials.
--
-- Recommended object prefixes:
--   commercial/stores/{store_id}/corporate/{...}
--   commercial/stores/{store_id}/locations/{location_id}/{...}
--   commercial/stores/{store_id}/evaluations/{evaluation_id}/items/{...}
--   commercial/stores/{store_id}/evaluations/{evaluation_id}/gates/{...}
--   commercial/stores/{store_id}/evaluations/{evaluation_id}/visits/{...}
--
-- Concrete storage.objects RLS should validate parsed object context against
-- DB rows rather than trusting user-supplied folder UUIDs alone.

-- -----------------------------------------------------------------------------
-- WRITE BOUNDARY / SECURITY DEFINER CONTRACT
-- -----------------------------------------------------------------------------
-- User-facing 03B mutations should use authenticated JWT + command functions.
-- service_role is reserved for trusted jobs/integrations and must not become the
-- normal application path because it bypasses RLS.
--
-- SECURITY DEFINER functions must:
--   * SET search_path explicitly;
--   * derive actor via auth.uid() for USER flows;
--   * validate permission + Store/Location context themselves;
--   * never trust caller-supplied actor identifiers;
--   * expose only required EXECUTE privileges;
--   * avoid dynamic SQL unless strictly controlled.
--
-- RLS protects rows; it does not replace governance. Quorum, self-approval,
-- critical gates and evidence completeness remain inside command validation.

-- -----------------------------------------------------------------------------
-- SECURITY TEST MATRIX — REQUIRED IN 03B-013
-- -----------------------------------------------------------------------------
-- Test at minimum:
--   * Store OWNER sees own Store and permitted Locations;
--   * INVENTORY_MANAGER sees only assigned Locations;
--   * SALES_OPERATOR cannot reach internal evaluation review rows;
--   * EVALUATOR can access evaluation data permitted by platform mapping;
--   * PARTNER_REVIEWER can review but not mutate scoring data;
--   * SUPERADMIN authority still cannot violate relational integrity;
--   * user with no membership sees zero foreign Store rows;
--   * swapping Store/Location/Evaluation UUIDs returns zero rows or DENIED;
--   * NO_LOCATION_ACCESS never becomes broad access;
--   * SELECTED_LOCATIONS with zero rows yields zero Location access;
--   * suspended/revoked membership yields no effective Store authority;
--   * raw audit remains inaccessible without explicit audit.read;
--   * service_role is absent from browser/client bundles.

commit;
