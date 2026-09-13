-- 03B Commercial Platform
-- Migration: 03B-002 Methodology Engine
-- Architecture Freeze: V1
--
-- This migration creates the reusable evaluation methodology model.
-- It DOES NOT seed WT-SQ-1.0 yet; seed data is intentionally deferred until
-- the complete kernel and activation validation functions exist.
--
-- Core rule:
--   methodology = versioned institutional definition of HOW a Store is measured
--   evaluation  = historical execution of one methodology version

begin;

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- METHODOLOGIES
-- -----------------------------------------------------------------------------

create table if not exists public.evaluation_methodologies (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  version text not null,
  name text not null,
  description text,
  status public.methodology_status not null default 'DRAFT',
  country_code text,
  score_min numeric(6,2) not null default 0,
  score_max numeric(6,2) not null default 100,
  created_by uuid,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  retired_at timestamptz,

  constraint evaluation_methodologies_code_not_blank
    check (btrim(code) <> ''),
  constraint evaluation_methodologies_version_not_blank
    check (btrim(version) <> ''),
  constraint evaluation_methodologies_name_not_blank
    check (btrim(name) <> ''),
  constraint evaluation_methodologies_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint evaluation_methodologies_score_range
    check (score_min >= 0 and score_max > score_min),
  constraint evaluation_methodologies_code_version_unique
    unique (code, version)
);

comment on table public.evaluation_methodologies is
  'Versioned institutional definitions used to qualify commercial Stores. ACTIVE versions are treated as immutable by command functions.';

-- -----------------------------------------------------------------------------
-- DIMENSIONS
-- -----------------------------------------------------------------------------

create table if not exists public.evaluation_dimensions (
  id uuid primary key default gen_random_uuid(),
  methodology_id uuid not null
    references public.evaluation_methodologies(id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  weight numeric(6,2) not null,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint evaluation_dimensions_code_not_blank
    check (btrim(code) <> ''),
  constraint evaluation_dimensions_name_not_blank
    check (btrim(name) <> ''),
  constraint evaluation_dimensions_weight
    check (weight > 0 and weight <= 100),
  constraint evaluation_dimensions_display_order
    check (display_order >= 0),
  constraint evaluation_dimensions_methodology_code_unique
    unique (methodology_id, code),
  constraint evaluation_dimensions_id_methodology_unique
    unique (id, methodology_id)
);

comment on table public.evaluation_dimensions is
  'Weighted dimensions inside one methodology version. Active dimension weights must total 100 before methodology activation.';

-- -----------------------------------------------------------------------------
-- CRITERIA CATALOG
-- -----------------------------------------------------------------------------

create table if not exists public.evaluation_criteria_catalog (
  id uuid primary key default gen_random_uuid(),
  methodology_id uuid not null,
  dimension_id uuid not null,
  code text not null,
  name text not null,
  description text,
  evaluation_scope public.evaluation_scope not null,
  weight numeric(6,2) not null,
  min_score smallint not null default 1,
  max_score smallint not null default 5,
  evidence_required boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint evaluation_criteria_methodology_fk
    foreign key (methodology_id)
    references public.evaluation_methodologies(id)
    on delete restrict,
  constraint evaluation_criteria_dimension_context_fk
    foreign key (dimension_id, methodology_id)
    references public.evaluation_dimensions(id, methodology_id)
    on delete restrict,
  constraint evaluation_criteria_code_not_blank
    check (btrim(code) <> ''),
  constraint evaluation_criteria_name_not_blank
    check (btrim(name) <> ''),
  constraint evaluation_criteria_weight
    check (weight > 0 and weight <= 100),
  constraint evaluation_criteria_score_range
    check (min_score >= 0 and max_score > min_score),
  constraint evaluation_criteria_display_order
    check (display_order >= 0),
  constraint evaluation_criteria_methodology_code_unique
    unique (methodology_id, code),
  constraint evaluation_criteria_id_methodology_unique
    unique (id, methodology_id)
);

comment on table public.evaluation_criteria_catalog is
  'Scored criteria belonging to a methodology and dimension. Criterion weights must reconcile with their parent dimension before activation.';

-- -----------------------------------------------------------------------------
-- GATE CATALOG
-- -----------------------------------------------------------------------------

create table if not exists public.evaluation_gate_catalog (
  id uuid primary key default gen_random_uuid(),
  methodology_id uuid not null
    references public.evaluation_methodologies(id) on delete restrict,
  code text not null,
  name text not null,
  description text,
  evaluation_scope public.evaluation_scope not null,
  is_critical boolean not null default true,
  allow_not_applicable boolean not null default false,
  evidence_required boolean not null default false,
  display_order integer not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),

  constraint evaluation_gate_code_not_blank
    check (btrim(code) <> ''),
  constraint evaluation_gate_name_not_blank
    check (btrim(name) <> ''),
  constraint evaluation_gate_display_order
    check (display_order >= 0),
  constraint evaluation_gate_methodology_code_unique
    unique (methodology_id, code),
  constraint evaluation_gate_id_methodology_unique
    unique (id, methodology_id)
);

comment on table public.evaluation_gate_catalog is
  'Non-scored eligibility gates. Critical gate failure can block approval independently from numerical classification.';

-- -----------------------------------------------------------------------------
-- CLASSIFICATION BANDS
-- -----------------------------------------------------------------------------

create table if not exists public.evaluation_classification_bands (
  id uuid primary key default gen_random_uuid(),
  methodology_id uuid not null
    references public.evaluation_methodologies(id) on delete restrict,
  classification public.store_classification not null,
  min_score numeric(6,2) not null,
  max_score numeric(6,2) not null,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint evaluation_classification_band_range
    check (
      min_score >= 0
      and max_score <= 100
      and max_score > min_score
    ),
  constraint evaluation_classification_band_display_order
    check (display_order >= 0),
  constraint evaluation_classification_band_unique
    unique (methodology_id, classification)
);

comment on table public.evaluation_classification_bands is
  'Methodology-owned score bands. Activation validation must prove complete 0-100 coverage with no gaps or overlaps.';

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

create index if not exists evaluation_methodologies_status_idx
  on public.evaluation_methodologies(status);

create index if not exists evaluation_dimensions_methodology_idx
  on public.evaluation_dimensions(methodology_id, display_order)
  where is_active = true;

create index if not exists evaluation_criteria_methodology_idx
  on public.evaluation_criteria_catalog(methodology_id, display_order)
  where is_active = true;

create index if not exists evaluation_criteria_dimension_idx
  on public.evaluation_criteria_catalog(dimension_id, display_order)
  where is_active = true;

create index if not exists evaluation_gates_methodology_idx
  on public.evaluation_gate_catalog(methodology_id, display_order)
  where is_active = true;

create index if not exists evaluation_classification_bands_methodology_idx
  on public.evaluation_classification_bands(methodology_id, min_score, max_score);

-- -----------------------------------------------------------------------------
-- WRITE BOUNDARY PREPARATION
-- -----------------------------------------------------------------------------
-- RLS and command-function-only writes are installed later as one coherent
-- security layer. Until then these objects are schema definitions only and this
-- migration must not be applied independently to production.
--
-- Activation will later require validate_evaluation_methodology() to prove:
--   1. active dimension weights total 100;
--   2. active criterion weights reconcile with every parent dimension;
--   3. criterion score ranges are valid;
--   4. required gates exist and are internally consistent;
--   5. classification bands cover the complete methodology score range;
--   6. classification bands have no gaps or overlaps;
--   7. methodology has at least one active dimension, criterion and gate.

commit;
