-- 03B Commercial Platform
-- Migration: 03B-007 Permissions + Platform Roles
-- Architecture Freeze: V1
--
-- Core distinctions:
--   identity   != role
--   role       != permission
--   permission != governance
--   platform role != Store role
--
-- Roles are structural V1 groupings. Permissions are the unified vocabulary of
-- executable capabilities. Governance will later decide whether an otherwise
-- permitted critical action is institutionally approvable.

begin;

-- -----------------------------------------------------------------------------
-- UNIFIED PERMISSION CATALOG
-- -----------------------------------------------------------------------------

create table if not exists public.permissions (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  scope public.permission_scope not null,
  domain text not null,
  risk_level public.risk_level not null default 'LOW',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint permissions_code_unique unique (code),
  constraint permissions_code_not_blank check (btrim(code) <> ''),
  constraint permissions_code_format
    check (code ~ '^[a-z][a-z0-9_]*(\.[a-z][a-z0-9_]*)+$'),
  constraint permissions_name_not_blank check (btrim(name) <> ''),
  constraint permissions_domain_not_blank check (btrim(domain) <> '')
);

comment on table public.permissions is
  'Unified capability catalog shared by platform and Store role mappings. Permission answers WHAT may be executed, not whether governance approves the decision.';

-- -----------------------------------------------------------------------------
-- PLATFORM USER ROLES
-- -----------------------------------------------------------------------------

create table if not exists public.platform_user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  role public.platform_role not null,
  status public.platform_role_status not null default 'ACTIVE',

  granted_by uuid,
  granted_at timestamptz not null default now(),

  suspended_by uuid,
  suspended_at timestamptz,
  suspension_reason text,

  revoked_by uuid,
  revoked_at timestamptz,
  revocation_reason text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint platform_user_roles_user_role_unique unique (user_id, role),
  constraint platform_user_roles_suspension_consistency
    check (
      (status = 'SUSPENDED' and suspended_at is not null and suspension_reason is not null and btrim(suspension_reason) <> '')
      or
      (status <> 'SUSPENDED' and suspended_by is null and suspended_at is null and suspension_reason is null)
    ),
  constraint platform_user_roles_revocation_consistency
    check (
      (status = 'REVOKED' and revoked_at is not null and revocation_reason is not null and btrim(revocation_reason) <> '')
      or
      (status <> 'REVOKED' and revoked_by is null and revoked_at is null and revocation_reason is null)
    )
);

comment on table public.platform_user_roles is
  'Platform-side institutional roles such as SUPERADMIN, EVALUATOR and FINANCE. These are separate from commercial Store memberships.';

-- -----------------------------------------------------------------------------
-- PLATFORM ROLE -> PERMISSION MAP
-- -----------------------------------------------------------------------------

create table if not exists public.platform_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.platform_role not null,
  permission_id uuid not null
    references public.permissions(id) on delete restrict,
  granted_by uuid,
  granted_at timestamptz not null default now(),

  constraint platform_role_permissions_unique unique (role, permission_id)
);

comment on table public.platform_role_permissions is
  'Capability map for platform roles. Role membership alone is not evaluated as a capability; authorization resolves through this mapping.';

-- -----------------------------------------------------------------------------
-- STORE ROLE -> PERMISSION MAP
-- -----------------------------------------------------------------------------

create table if not exists public.store_role_permissions (
  id uuid primary key default gen_random_uuid(),
  role public.commercial_store_member_role not null,
  permission_id uuid not null
    references public.permissions(id) on delete restrict,
  granted_by uuid,
  granted_at timestamptz not null default now(),

  constraint store_role_permissions_unique unique (role, permission_id)
);

comment on table public.store_role_permissions is
  'Capability map for Store membership roles. Effective access additionally requires ACTIVE membership, commercial context and valid Location scope.';

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

create index if not exists permissions_scope_domain_idx
  on public.permissions(scope, domain)
  where is_active = true;

create index if not exists permissions_risk_idx
  on public.permissions(risk_level)
  where is_active = true;

create index if not exists platform_user_roles_user_status_idx
  on public.platform_user_roles(user_id, status);

create index if not exists platform_user_roles_role_status_idx
  on public.platform_user_roles(role, status);

create index if not exists platform_role_permissions_permission_idx
  on public.platform_role_permissions(permission_id, role);

create index if not exists store_role_permissions_permission_idx
  on public.store_role_permissions(permission_id, role);

-- -----------------------------------------------------------------------------
-- AUTHORITY MODEL
-- -----------------------------------------------------------------------------
-- Store-side effective capability:
--
--   authenticated identity
--     + ACTIVE Store membership
--     + ACTIVE/allowed Store commercial context
--     + valid Location scope when permission scope = LOCATION
--     + active permission mapped to membership role
--     = technically executable capability
--
-- Platform-side effective capability:
--
--   authenticated identity
--     + ACTIVE platform role
--     + active permission mapped to that role
--     = technically executable capability
--
-- This still does NOT equal final decision authority for governed actions.
-- 03B-008 will add policy/quorum/maker-checker rules above permissions.
--
-- There is intentionally no numeric role hierarchy such as SUPERADMIN > ADMIN
-- > EVALUATOR. Authorization is capability-based. A role either maps to a
-- permission in context or it does not.

-- -----------------------------------------------------------------------------
-- COMMAND BOUNDARY
-- -----------------------------------------------------------------------------
-- grant_platform_role():
--   * derives acting user from auth.uid();
--   * requires explicit authority to manage platform roles;
--   * prevents ordinary self-grant of SUPERADMIN;
--   * preserves grant/revocation history;
--   * writes audit event in same transaction.
--
-- revoke_platform_role() / suspend_platform_role():
--   * do not DELETE the role record;
--   * immediately remove effective authority;
--   * require reason for sensitive changes;
--   * write audit event.
--
-- has_platform_permission(user, permission_code):
--   * resolves ACTIVE role -> active permission mapping;
--   * must not infer authority from role names.
--
-- has_store_permission(user, store, location, permission_code):
--   * resolves ACTIVE membership -> role permission;
--   * validates Store state and Location scope;
--   * NO_LOCATION_ACCESS never inherits broad access;
--   * SELECTED_LOCATIONS requires an explicit membership-location row;
--   * ALL_LOCATIONS is still constrained to Locations belonging to that Store.
--
-- Permission catalog and role maps are configuration, not user-editable data.
-- Initial Wolves-specific permission seeds/matrices are intentionally deferred
-- until the approved V1 role-permission matrix is frozen. We do not invent it.
--
-- Candidate permission vocabulary reserved for later controlled seed includes:
--   store.read
--   store.create
--   evaluation.create
--   evaluation.score
--   evaluation.submit
--   evaluation.review
--   evaluation.finalize
--   document.upload
--   document.verify
--   evidence.upload
--   evidence.verify
--   membership.invite
--   membership.change_role
--   membership.change_scope
--   membership.suspend
--   membership.revoke
--   settlement.review
--   settlement.approve
--   audit.read
--
-- Future domains may add contract.*, inventory.*, sales.*, incident.* without
-- changing this authorization architecture.

commit;
