-- 03B Commercial Platform
-- Migration: 03B-006 Memberships + Invitations
-- Architecture Freeze: V1
--
-- Core distinctions:
--   identity   != membership
--   invitation != membership
--   membership != permission
--   role       != permission
--   Store scope != Location scope
--
-- Supabase Auth proves who the human is. These tables model which commercial
-- organization that identity may represent and at which physical locations.

begin;

-- -----------------------------------------------------------------------------
-- INVITATIONS
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_store_invitations (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null
    references public.commercial_stores(id) on delete restrict,

  invited_email text not null,
  invited_email_normalized text not null,
  proposed_role public.commercial_store_member_role not null,
  location_access_mode public.commercial_location_access_mode not null,

  status public.commercial_store_invitation_status not null default 'PENDING',

  -- Store only a cryptographic hash. The invitation secret itself must never be
  -- persisted in plaintext.
  token_hash text not null,

  invited_by uuid not null,
  invited_at timestamptz not null default now(),
  expires_at timestamptz not null,

  accepted_by_user_id uuid,
  accepted_at timestamptz,

  revoked_by uuid,
  revoked_at timestamptz,
  revocation_reason text,

  created_at timestamptz not null default now(),

  constraint commercial_store_invitations_email_not_blank
    check (btrim(invited_email) <> ''),
  constraint commercial_store_invitations_email_normalized_not_blank
    check (btrim(invited_email_normalized) <> ''),
  constraint commercial_store_invitations_email_normalized_canonical
    check (invited_email_normalized = lower(btrim(invited_email_normalized))),
  constraint commercial_store_invitations_token_hash_not_blank
    check (btrim(token_hash) <> ''),
  constraint commercial_store_invitations_expiration
    check (expires_at > invited_at),
  constraint commercial_store_invitations_acceptance_consistency
    check (
      (status = 'ACCEPTED' and accepted_by_user_id is not null and accepted_at is not null)
      or
      (status <> 'ACCEPTED' and accepted_by_user_id is null and accepted_at is null)
    ),
  constraint commercial_store_invitations_revocation_consistency
    check (
      (status = 'REVOKED' and revoked_at is not null and revocation_reason is not null and btrim(revocation_reason) <> '')
      or
      (status <> 'REVOKED' and revoked_by is null and revoked_at is null and revocation_reason is null)
    ),
  constraint commercial_store_invitations_id_store_unique
    unique (id, store_id)
);

comment on table public.commercial_store_invitations is
  'Pre-membership invitation intent. It grants no data access or authority until atomically accepted into an ACTIVE membership.';

-- Prevent two live pending invitations for the same normalized email in one Store.
create unique index if not exists commercial_store_invitations_one_pending_idx
  on public.commercial_store_invitations(store_id, invited_email_normalized)
  where status = 'PENDING';

-- -----------------------------------------------------------------------------
-- INVITATION LOCATION SCOPE
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_store_invitation_locations (
  id uuid primary key default gen_random_uuid(),
  invitation_id uuid not null,
  store_id uuid not null,
  location_id uuid not null,
  created_at timestamptz not null default now(),

  constraint commercial_store_invitation_locations_invitation_store_fk
    foreign key (invitation_id, store_id)
    references public.commercial_store_invitations(id, store_id)
    on delete restrict,
  constraint commercial_store_invitation_locations_location_store_fk
    foreign key (location_id, store_id)
    references public.commercial_store_locations(id, store_id)
    on delete restrict,
  constraint commercial_store_invitation_locations_unique
    unique (invitation_id, location_id)
);

comment on table public.commercial_store_invitation_locations is
  'Complete proposed Location scope for invitations using SELECTED_LOCATIONS. Invitation acceptance copies this scope transactionally into membership locations.';

-- -----------------------------------------------------------------------------
-- MEMBERSHIPS
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_store_memberships (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null
    references public.commercial_stores(id) on delete restrict,
  user_id uuid not null,

  role public.commercial_store_member_role not null,
  status public.commercial_store_membership_status not null default 'ACTIVE',
  location_access_mode public.commercial_location_access_mode not null,

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

  constraint commercial_store_memberships_store_user_unique
    unique (store_id, user_id),
  constraint commercial_store_memberships_id_store_unique
    unique (id, store_id),
  constraint commercial_store_memberships_suspension_consistency
    check (
      (status = 'SUSPENDED' and suspended_at is not null and suspension_reason is not null and btrim(suspension_reason) <> '')
      or
      (status <> 'SUSPENDED' and suspended_by is null and suspended_at is null and suspension_reason is null)
    ),
  constraint commercial_store_memberships_revocation_consistency
    check (
      (status = 'REVOKED' and revoked_at is not null and revocation_reason is not null and btrim(revocation_reason) <> '')
      or
      (status <> 'REVOKED' and revoked_by is null and revoked_at is null and revocation_reason is null)
    )
);

comment on table public.commercial_store_memberships is
  'Persistent relationship between an authenticated user and a commercial Store. OWNER means principal digital account authority, not legal ownership or legal representation.';

comment on column public.commercial_store_memberships.location_access_mode is
  'Explicit scope semantics. NO_LOCATION_ACCESS means zero Location rows; absence of child rows must never be interpreted as ALL_LOCATIONS.';

-- -----------------------------------------------------------------------------
-- MEMBERSHIP LOCATION SCOPE
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_store_membership_locations (
  id uuid primary key default gen_random_uuid(),
  membership_id uuid not null,
  store_id uuid not null,
  location_id uuid not null,
  granted_by uuid,
  granted_at timestamptz not null default now(),
  created_at timestamptz not null default now(),

  constraint commercial_store_membership_locations_membership_store_fk
    foreign key (membership_id, store_id)
    references public.commercial_store_memberships(id, store_id)
    on delete restrict,
  constraint commercial_store_membership_locations_location_store_fk
    foreign key (location_id, store_id)
    references public.commercial_store_locations(id, store_id)
    on delete restrict,
  constraint commercial_store_membership_locations_unique
    unique (membership_id, location_id)
);

comment on table public.commercial_store_membership_locations is
  'Explicit authorized Locations for memberships using SELECTED_LOCATIONS. Rows are not used to imply global access.';

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

create index if not exists commercial_store_invitations_store_status_idx
  on public.commercial_store_invitations(store_id, status);

create index if not exists commercial_store_invitations_email_idx
  on public.commercial_store_invitations(invited_email_normalized, status);

create index if not exists commercial_store_invitations_expiry_idx
  on public.commercial_store_invitations(expires_at)
  where status = 'PENDING';

create index if not exists commercial_store_invitation_locations_invitation_idx
  on public.commercial_store_invitation_locations(invitation_id, location_id);

create index if not exists commercial_store_memberships_user_store_status_idx
  on public.commercial_store_memberships(user_id, store_id, status);

create index if not exists commercial_store_memberships_store_status_idx
  on public.commercial_store_memberships(store_id, status);

create index if not exists commercial_store_membership_locations_membership_idx
  on public.commercial_store_membership_locations(membership_id, location_id);

create index if not exists commercial_store_membership_locations_location_idx
  on public.commercial_store_membership_locations(location_id, membership_id);

-- -----------------------------------------------------------------------------
-- AUTH / COMMAND BOUNDARY
-- -----------------------------------------------------------------------------
-- The production schema reconciliation will decide whether user_id actor columns
-- receive direct auth.users foreign keys. We deliberately avoid binding them in
-- draft migrations until the real Wolves Territory Supabase project is known.
-- Authorization will still derive runtime identity from auth.uid(), never from a
-- client-provided user_id parameter.
--
-- invite_store_member():
--   * requires membership.invite permission in Store context;
--   * normalizes email server-side;
--   * generates a cryptographically strong secret and stores only token_hash;
--   * validates proposed role and Location scope;
--   * SELECTED_LOCATIONS requires >= 1 invitation location;
--   * ALL_LOCATIONS / NO_LOCATION_ACCESS require zero invitation-location rows;
--   * records audit event transactionally.
--
-- accept_store_invitation():
--   * derives actor from auth.uid();
--   * validates token hash, email ownership, PENDING status and expiry;
--   * is atomic and idempotent;
--   * creates/activates exactly one Store membership;
--   * copies invitation Location scope into membership locations;
--   * marks invitation ACCEPTED only after membership creation succeeds;
--   * records correlated audit events.
--
-- change_store_member_role():
--   * role change is controlled and audited;
--   * OWNER transfer is sensitive and receives stronger governance later;
--   * role does not directly imply permission outside the role-permission map.
--
-- change_store_member_location_scope():
--   * ALL_LOCATIONS: no child Location rows required;
--   * SELECTED_LOCATIONS: explicit complete set of authorized Location rows;
--   * NO_LOCATION_ACCESS: zero Location access even if membership is ACTIVE;
--   * transition is atomic so temporary accidental broad access cannot occur.
--
-- suspend_store_membership() / revoke_store_membership():
--   * memberships are never normally deleted;
--   * history is preserved;
--   * suspended/revoked memberships grant no effective authority.
--
-- Effective authority will later be evaluated as:
--   AUTHENTICATED IDENTITY
--     + ACTIVE MEMBERSHIP
--     + ACTIVE COMMERCIAL CONTEXT
--     + LOCATION SCOPE
--     + GRANTED PERMISSION
--
-- An ACTIVE membership alone is intentionally insufficient.

commit;
