-- 03B Commercial Platform
-- Migration: 03B-004 Evaluations + Items + Gates
-- Architecture Freeze: V1
--
-- Core distinctions:
--   score          != classification
--   classification != system recommendation
--   recommendation != human final decision
--   completeness   != eligibility
--
-- An evaluation is a historical decision dossier. It is never the Store itself.

begin;

create sequence if not exists public.store_evaluation_code_seq start 1;

-- -----------------------------------------------------------------------------
-- STORE EVALUATIONS
-- -----------------------------------------------------------------------------

create table if not exists public.store_evaluations (
  id uuid primary key default gen_random_uuid(),
  evaluation_code text not null,

  store_id uuid not null,
  location_id uuid,
  methodology_id uuid not null
    references public.evaluation_methodologies(id) on delete restrict,

  -- Added as a FK in 03B-008 once governance_policies exists.
  governance_policy_id uuid,

  evaluation_number integer not null,
  status public.store_evaluation_status not null default 'DRAFT',

  total_score numeric(6,2),
  classification public.store_classification,
  system_recommendation public.store_recommendation,
  final_decision public.store_final_decision not null default 'PENDING',

  current_review_round integer not null default 1,

  started_by uuid,
  started_at timestamptz,
  submitted_by uuid,
  submitted_at timestamptz,

  final_decision_by uuid,
  final_decision_at timestamptz,
  final_decision_notes text,

  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint store_evaluations_store_fk
    foreign key (store_id)
    references public.commercial_stores(id)
    on delete restrict,

  -- If location_id exists, PostgreSQL proves that it belongs to store_id.
  constraint store_evaluations_location_store_fk
    foreign key (location_id, store_id)
    references public.commercial_store_locations(id, store_id)
    on delete restrict,

  constraint store_evaluations_code_unique unique (evaluation_code),
  constraint store_evaluations_code_not_blank check (btrim(evaluation_code) <> ''),
  constraint store_evaluations_number_positive check (evaluation_number > 0),
  constraint store_evaluations_store_number_unique unique (store_id, evaluation_number),
  constraint store_evaluations_review_round_positive check (current_review_round > 0),
  constraint store_evaluations_total_score_range
    check (total_score is null or total_score between 0 and 100),
  constraint store_evaluations_score_classification_pair
    check (
      (total_score is null and classification is null)
      or
      (total_score is not null and classification is not null)
    ),
  constraint store_evaluations_final_decision_consistency
    check (
      (final_decision = 'PENDING' and final_decision_at is null and final_decision_by is null)
      or
      (final_decision <> 'PENDING' and final_decision_at is not null)
    )
);

comment on table public.store_evaluations is
  'Historical qualification/decision dossier for one Store and optional Location under one immutable methodology version.';

comment on column public.store_evaluations.location_id is
  'Structurally nullable because methodologies may be organization-only. Context validation will require it for methodologies containing LOCATION/COMBINED criteria or gates.';

-- Complete the current Location qualification snapshot FK introduced in 03B-003.
alter table public.commercial_store_locations
  add constraint commercial_store_locations_current_evaluation_fk
  foreign key (current_evaluation_id)
  references public.store_evaluations(id)
  on delete restrict;

-- -----------------------------------------------------------------------------
-- EVALUATION ITEMS — SCORED CRITERIA
-- -----------------------------------------------------------------------------

create table if not exists public.store_evaluation_items (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null
    references public.store_evaluations(id) on delete restrict,
  methodology_id uuid not null,
  criterion_id uuid not null,

  score smallint,
  weighted_score numeric(8,4),
  comment text,
  evidence_status public.evaluation_evidence_status not null default 'PENDING',

  scored_by uuid,
  scored_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint store_evaluation_items_evaluation_methodology_fk
    foreign key (evaluation_id, methodology_id)
    references public.store_evaluations(id, methodology_id)
    on delete restrict,
  constraint store_evaluation_items_criterion_methodology_fk
    foreign key (criterion_id, methodology_id)
    references public.evaluation_criteria_catalog(id, methodology_id)
    on delete restrict,
  constraint store_evaluation_items_unique unique (evaluation_id, criterion_id),
  constraint store_evaluation_items_score_range
    check (score is null or score between 1 and 5),
  constraint store_evaluation_items_weighted_score_nonnegative
    check (weighted_score is null or weighted_score >= 0),
  constraint store_evaluation_items_score_pair
    check (
      (score is null and weighted_score is null and scored_at is null)
      or
      (score is not null and weighted_score is not null and scored_at is not null)
    )
);

comment on table public.store_evaluation_items is
  'Instantiated scored criteria for one evaluation. NULL score means not evaluated; zero is never used as a substitute for missing assessment.';

-- Composite key required by the contextual FK above.
alter table public.store_evaluations
  add constraint store_evaluations_id_methodology_unique
  unique (id, methodology_id);

-- -----------------------------------------------------------------------------
-- GATE CHECKS — NON-SCORED ELIGIBILITY
-- -----------------------------------------------------------------------------

create table if not exists public.store_gate_checks (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null,
  methodology_id uuid not null,
  gate_id uuid not null,

  status public.store_gate_status not null default 'PENDING',
  comment text,
  evidence_status public.evaluation_evidence_status not null default 'PENDING',

  verified_by uuid,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint store_gate_checks_evaluation_methodology_fk
    foreign key (evaluation_id, methodology_id)
    references public.store_evaluations(id, methodology_id)
    on delete restrict,
  constraint store_gate_checks_gate_methodology_fk
    foreign key (gate_id, methodology_id)
    references public.evaluation_gate_catalog(id, methodology_id)
    on delete restrict,
  constraint store_gate_checks_unique unique (evaluation_id, gate_id),
  constraint store_gate_checks_fail_comment_required
    check (
      status <> 'FAIL'
      or (comment is not null and btrim(comment) <> '')
    ),
  constraint store_gate_checks_na_comment_required
    check (
      status <> 'NOT_APPLICABLE'
      or (comment is not null and btrim(comment) <> '')
    ),
  constraint store_gate_checks_verification_pair
    check (
      (status = 'PENDING' and verified_at is null)
      or
      (status <> 'PENDING' and verified_at is not null)
    )
);

comment on table public.store_gate_checks is
  'Instantiated non-scored eligibility gates. Critical FAIL may block approval regardless of numerical score.';

-- -----------------------------------------------------------------------------
-- PARTNER / GOVERNANCE REVIEWS
-- -----------------------------------------------------------------------------

create table if not exists public.store_evaluation_reviews (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null
    references public.store_evaluations(id) on delete restrict,
  reviewer_user_id uuid not null,
  decision public.store_review_decision not null,
  comment text,
  review_round integer not null,
  reviewed_at timestamptz not null default now(),

  constraint store_evaluation_reviews_round_positive check (review_round > 0),
  constraint store_evaluation_reviews_unique_round_reviewer
    unique (evaluation_id, reviewer_user_id, review_round),
  constraint store_evaluation_reviews_request_changes_comment
    check (
      decision <> 'REQUEST_CHANGES'
      or (comment is not null and btrim(comment) <> '')
    ),
  constraint store_evaluation_reviews_reject_comment
    check (
      decision <> 'REJECT'
      or (comment is not null and btrim(comment) <> '')
    )
);

comment on table public.store_evaluation_reviews is
  'Immutable partner/governance review decisions by review round. A new round preserves previous review history rather than overwriting it.';

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

create index if not exists store_evaluations_store_status_idx
  on public.store_evaluations(store_id, status);

create index if not exists store_evaluations_location_status_idx
  on public.store_evaluations(location_id, status)
  where location_id is not null;

create index if not exists store_evaluations_methodology_idx
  on public.store_evaluations(methodology_id);

create index if not exists store_evaluation_items_evaluation_idx
  on public.store_evaluation_items(evaluation_id);

create index if not exists store_gate_checks_evaluation_idx
  on public.store_gate_checks(evaluation_id);

create index if not exists store_evaluation_reviews_evaluation_round_idx
  on public.store_evaluation_reviews(evaluation_id, review_round);

-- -----------------------------------------------------------------------------
-- COMMAND-FUNCTION BOUNDARY
-- -----------------------------------------------------------------------------
-- The following invariants intentionally belong to command/validation functions
-- and will NOT be trusted to clients:
--
-- create_store_evaluation():
--   * accepts only an ACTIVE methodology;
--   * assigns evaluation_code from DB sequence;
--   * assigns the next evaluation_number atomically;
--   * validates Store/Location context;
--   * requires location when methodology contains LOCATION/COMBINED scope;
--   * instantiates every active criterion into store_evaluation_items;
--   * instantiates every active gate into store_gate_checks;
--   * copies methodology_id into child rows;
--   * writes the audit event in the same transaction.
--
-- score_evaluation_item():
--   * only while evaluation is editable;
--   * validates criterion min/max score from catalog;
--   * computes weighted_score server-side as (score / max_score) * weight;
--   * never trusts a client-provided weighted score.
--
-- set_gate_status():
--   * validates NOT_APPLICABLE against allow_not_applicable;
--   * requires justification for FAIL / NOT_APPLICABLE;
--   * controls evidence requirements.
--
-- submit_store_evaluation():
--   * validates completeness;
--   * calculates total_score;
--   * derives classification from methodology bands;
--   * evaluates critical gates independently from score;
--   * generates system recommendation using a future approved matrix;
--   * freezes substantive evaluation data for review.
--
-- finalize_store_evaluation():
--   * validates governance policy, quorum and maker-checker;
--   * prevents self-approval;
--   * writes final decision and audit atomically;
--   * updates the Location qualification snapshot when appropriate;
--   * may advance Store macro status to APPROVED;
--   * NEVER activates custody/inventory merely because evaluation was approved.

commit;
