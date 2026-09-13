-- 03B Commercial Platform
-- Migration: 03B-003 Commercial Stores + Locations
-- Architecture Freeze: V1
--
-- Core distinction:
--   commercial_store          = legal/commercial organization
--   commercial_store_location = physical commercial point
--
-- A Store may own multiple Locations. Qualification snapshots belong to the
-- Location because WT-SQ can evaluate location-specific conditions.
-- Historical evaluations remain the source of truth; snapshots are projections.

begin;

-- Human-readable codes are DB-owned. Functions introduced later will use these
-- sequences; clients must never generate codes using max()+1 / last+1.
create sequence if not exists public.commercial_store_code_seq start 1;
create sequence if not exists public.commercial_location_code_seq start 1;

-- -----------------------------------------------------------------------------
-- COMMERCIAL STORES — ORGANIZATION
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_stores (
  id uuid primary key default gen_random_uuid(),
  store_code text not null,

  legal_name text not null,
  trade_name text,
  nit text,
  nit_normalized text,

  legal_representative_name text,
  legal_representative_document_type text,
  legal_representative_document_number text,

  primary_email text,
  primary_phone text,
  website_url text,
  instagram_url text,
  facebook_url text,
  tiktok_url text,

  status public.commercial_store_status not null default 'CANDIDATE',

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  approved_by uuid,
  approved_at timestamptz,

  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,

  suspended_by uuid,
  suspended_at timestamptz,
  suspension_reason text,

  closed_by uuid,
  closed_at timestamptz,
  closure_reason text,

  constraint commercial_stores_store_code_unique unique (store_code),
  constraint commercial_stores_store_code_not_blank check (btrim(store_code) <> ''),
  constraint commercial_stores_legal_name_not_blank check (btrim(legal_name) <> ''),
  constraint commercial_stores_nit_normalized_unique unique (nit_normalized),
  constraint commercial_stores_nit_normalized_not_blank
    check (nit_normalized is null or btrim(nit_normalized) <> ''),
  constraint commercial_stores_email_not_blank
    check (primary_email is null or btrim(primary_email) <> ''),
  constraint commercial_stores_rejection_consistency
    check (
      (rejected_at is null and rejected_by is null and rejection_reason is null)
      or
      (rejected_at is not null and rejection_reason is not null and btrim(rejection_reason) <> '')
    ),
  constraint commercial_stores_suspension_consistency
    check (
      (suspended_at is null and suspended_by is null and suspension_reason is null)
      or
      (suspended_at is not null and suspension_reason is not null and btrim(suspension_reason) <> '')
    ),
  constraint commercial_stores_closure_consistency
    check (
      (closed_at is null and closed_by is null and closure_reason is null)
      or
      (closed_at is not null and closure_reason is not null and btrim(closure_reason) <> '')
    )
);

comment on table public.commercial_stores is
  'Legal/commercial organizations participating or applying to the 03B commercial network. This is not a physical point of sale and is not the Referral partners table.';

comment on column public.commercial_stores.nit_normalized is
  'Canonical business identifier used for uniqueness/search. Normalization is server/DB-owned; clients must not be trusted to calculate it.';

-- -----------------------------------------------------------------------------
-- COMMERCIAL STORE LOCATIONS — PHYSICAL POINTS
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_store_locations (
  id uuid primary key default gen_random_uuid(),
  location_code text not null,
  store_id uuid not null
    references public.commercial_stores(id) on delete restrict,

  name text not null,
  location_type public.commercial_location_type not null,
  status public.commercial_location_status not null default 'PENDING',

  address_line1 text not null,
  address_line2 text,
  city text not null,
  department text,
  postal_code text,
  country_code text not null default 'CO',

  latitude numeric(9,6),
  longitude numeric(9,6),

  shopping_center_name text,
  local_number text,
  phone text,
  is_primary boolean not null default false,

  -- Current qualification projection. The FK to store_evaluations is added in
  -- 03B-004 after that table exists, avoiding a circular migration dependency.
  current_evaluation_id uuid,
  current_qualification_score numeric(6,2),
  current_classification public.store_classification,
  qualification_updated_at timestamptz,

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  approved_by uuid,
  approved_at timestamptz,

  rejected_by uuid,
  rejected_at timestamptz,
  rejection_reason text,

  suspended_by uuid,
  suspended_at timestamptz,
  suspension_reason text,

  closed_by uuid,
  closed_at timestamptz,
  closure_reason text,

  constraint commercial_store_locations_code_unique unique (location_code),
  constraint commercial_store_locations_code_not_blank check (btrim(location_code) <> ''),
  constraint commercial_store_locations_name_not_blank check (btrim(name) <> ''),
  constraint commercial_store_locations_address_not_blank check (btrim(address_line1) <> ''),
  constraint commercial_store_locations_city_not_blank check (btrim(city) <> ''),
  constraint commercial_store_locations_country_code_format check (country_code ~ '^[A-Z]{2}$'),
  constraint commercial_store_locations_latitude_range
    check (latitude is null or latitude between -90 and 90),
  constraint commercial_store_locations_longitude_range
    check (longitude is null or longitude between -180 and 180),
  constraint commercial_store_locations_qualification_score_range
    check (current_qualification_score is null or current_qualification_score between 0 and 100),
  constraint commercial_store_locations_qualification_snapshot_consistency
    check (
      (current_evaluation_id is null
        and current_qualification_score is null
        and current_classification is null
        and qualification_updated_at is null)
      or
      (current_evaluation_id is not null
        and current_qualification_score is not null
        and current_classification is not null
        and qualification_updated_at is not null)
    ),
  constraint commercial_store_locations_rejection_consistency
    check (
      (rejected_at is null and rejected_by is null and rejection_reason is null)
      or
      (rejected_at is not null and rejection_reason is not null and btrim(rejection_reason) <> '')
    ),
  constraint commercial_store_locations_suspension_consistency
    check (
      (suspended_at is null and suspended_by is null and suspension_reason is null)
      or
      (suspended_at is not null and suspension_reason is not null and btrim(suspension_reason) <> '')
    ),
  constraint commercial_store_locations_closure_consistency
    check (
      (closed_at is null and closed_by is null and closure_reason is null)
      or
      (closed_at is not null and closure_reason is not null and btrim(closure_reason) <> '')
    ),

  -- Enables composite foreign keys from evaluation/membership domains to prove
  -- that a Location belongs to the Store declared by the parent record.
  constraint commercial_store_locations_id_store_unique unique (id, store_id)
);

comment on table public.commercial_store_locations is
  'Physical commercial points belonging to a commercial_store. Inventory, location qualification and location-scoped access bind here.';

comment on column public.commercial_store_locations.current_evaluation_id is
  'Current qualification projection only. Historical store_evaluations remain authoritative.';

-- Exactly zero or one primary Location per Store. A Store may temporarily have
-- no primary Location while onboarding; two primaries are structurally forbidden.
create unique index if not exists commercial_store_locations_one_primary_idx
  on public.commercial_store_locations(store_id)
  where is_primary = true;

create index if not exists commercial_stores_status_idx
  on public.commercial_stores(status);

create index if not exists commercial_stores_trade_name_idx
  on public.commercial_stores(lower(trade_name))
  where trade_name is not null;

create index if not exists commercial_store_locations_store_idx
  on public.commercial_store_locations(store_id, status);

create index if not exists commercial_store_locations_geo_idx
  on public.commercial_store_locations(country_code, department, city);

create index if not exists commercial_store_locations_classification_idx
  on public.commercial_store_locations(current_classification)
  where current_classification is not null;

-- -----------------------------------------------------------------------------
-- IMPORTANT WRITE BOUNDARY
-- -----------------------------------------------------------------------------
-- These tables intentionally do not contain automatic lifecycle triggers yet.
-- State transitions, code generation, NIT normalization, updated_at handling,
-- qualification snapshot updates and audit writes will be owned by 03B command
-- functions. RLS will later deny ordinary direct mutation of critical fields.
--
-- In particular:
--   * clients must never create ACTIVE Stores directly;
--   * clients must never write qualification snapshot fields directly;
--   * clients must never generate store_code/location_code themselves;
--   * commercial_stores must never be merged with Referral `partners`.

commit;
