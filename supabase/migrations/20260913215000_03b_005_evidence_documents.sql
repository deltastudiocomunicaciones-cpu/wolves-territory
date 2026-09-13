-- 03B Commercial Platform
-- Migration: 03B-005 Evidence + Documents
-- Architecture Freeze: V1
--
-- Core distinctions:
--   document != evidence
--   record   != file
--   upload   != verification
--   verification != validity
--   current document != document history
--   evidence exists != evidence accepted
--
-- Storage objects remain private. PostgreSQL stores provenance and references;
-- short-lived signed URLs are generated server-side and are never persisted.

begin;

-- -----------------------------------------------------------------------------
-- DOCUMENT TYPE CATALOG
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_document_types (
  id uuid primary key default gen_random_uuid(),
  code text not null,
  name text not null,
  description text,
  country_code text,
  allowed_for_organization boolean not null default true,
  allowed_for_location boolean not null default false,
  requires_number boolean not null default false,
  requires_issue_date boolean not null default false,
  requires_expiration_date boolean not null default false,
  is_sensitive boolean not null default false,
  is_active boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint commercial_document_types_code_unique unique (code),
  constraint commercial_document_types_code_not_blank check (btrim(code) <> ''),
  constraint commercial_document_types_name_not_blank check (btrim(name) <> ''),
  constraint commercial_document_types_country_code_format
    check (country_code is null or country_code ~ '^[A-Z]{2}$'),
  constraint commercial_document_types_scope_required
    check (allowed_for_organization or allowed_for_location),
  constraint commercial_document_types_display_order
    check (display_order >= 0)
);

comment on table public.commercial_document_types is
  'Catalog of institutional document types. Requiredness is contextual and intentionally not modeled as one global is_required flag.';

-- -----------------------------------------------------------------------------
-- STORE / LOCATION INSTITUTIONAL DOCUMENTS
-- -----------------------------------------------------------------------------

create table if not exists public.commercial_store_documents (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null,
  location_id uuid,
  document_type_id uuid not null
    references public.commercial_document_types(id) on delete restrict,

  document_number text,
  issued_at date,
  expires_at date,

  storage_bucket text not null,
  storage_path text not null,
  original_file_name text not null,
  mime_type text,
  file_size_bytes bigint,
  file_sha256 text,

  verification_status public.store_document_verification_status not null default 'PENDING',
  verified_by uuid,
  verified_at timestamptz,
  verification_notes text,

  uploaded_by uuid,
  uploaded_at timestamptz not null default now(),
  supersedes_document_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint commercial_store_documents_store_fk
    foreign key (store_id)
    references public.commercial_stores(id)
    on delete restrict,
  constraint commercial_store_documents_location_store_fk
    foreign key (location_id, store_id)
    references public.commercial_store_locations(id, store_id)
    on delete restrict,
  constraint commercial_store_documents_supersedes_fk
    foreign key (supersedes_document_id)
    references public.commercial_store_documents(id)
    on delete restrict,
  constraint commercial_store_documents_storage_bucket_not_blank
    check (btrim(storage_bucket) <> ''),
  constraint commercial_store_documents_storage_path_not_blank
    check (btrim(storage_path) <> ''),
  constraint commercial_store_documents_filename_not_blank
    check (btrim(original_file_name) <> ''),
  constraint commercial_store_documents_file_size_nonnegative
    check (file_size_bytes is null or file_size_bytes >= 0),
  constraint commercial_store_documents_sha256_format
    check (file_sha256 is null or file_sha256 ~ '^[0-9a-fA-F]{64}$'),
  constraint commercial_store_documents_dates
    check (expires_at is null or issued_at is null or expires_at >= issued_at),
  constraint commercial_store_documents_verification_consistency
    check (
      (verification_status = 'PENDING' and verified_at is null and verified_by is null)
      or
      (verification_status <> 'PENDING' and verified_at is not null)
    ),
  constraint commercial_store_documents_no_self_supersede
    check (supersedes_document_id is null or supersedes_document_id <> id),
  constraint commercial_store_documents_storage_unique
    unique (storage_bucket, storage_path),
  constraint commercial_store_documents_id_store_location_unique
    unique (id, store_id, location_id)
);

comment on table public.commercial_store_documents is
  'Version-preserving institutional documents belonging to a Store or Store Location. Renewal creates a new record and links supersedes_document_id; prior records remain historical.';

comment on column public.commercial_store_documents.expires_at is
  'Effective validity is derived from this date. Expiration does not rewrite historical verification_status.';

-- -----------------------------------------------------------------------------
-- EVALUATION EVIDENCE
-- -----------------------------------------------------------------------------

create table if not exists public.store_evaluation_evidence (
  id uuid primary key default gen_random_uuid(),
  evaluation_id uuid not null,
  evaluation_item_id uuid,
  gate_check_id uuid,

  evidence_type public.evaluation_evidence_type not null,

  -- Exactly one source channel is allowed: private file, external URL, or a
  -- reusable institutional Store document.
  storage_bucket text,
  storage_path text,
  external_url text,
  store_document_id uuid,

  original_file_name text,
  mime_type text,
  file_size_bytes bigint,
  file_sha256 text,

  description text,
  captured_at timestamptz,

  verification_status public.evidence_verification_status not null default 'PENDING',
  verified_by uuid,
  verified_at timestamptz,
  verification_notes text,

  uploaded_by uuid,
  created_at timestamptz not null default now(),

  constraint store_evaluation_evidence_evaluation_fk
    foreign key (evaluation_id)
    references public.store_evaluations(id)
    on delete restrict,
  constraint store_evaluation_evidence_item_fk
    foreign key (evaluation_item_id)
    references public.store_evaluation_items(id)
    on delete restrict,
  constraint store_evaluation_evidence_gate_fk
    foreign key (gate_check_id)
    references public.store_gate_checks(id)
    on delete restrict,
  constraint store_evaluation_evidence_store_document_fk
    foreign key (store_document_id)
    references public.commercial_store_documents(id)
    on delete restrict,

  -- Evidence must prove exactly one evaluation subject: criterion OR gate.
  constraint store_evaluation_evidence_subject_xor
    check (num_nonnulls(evaluation_item_id, gate_check_id) = 1),

  -- Evidence provenance must have exactly one source. A private file counts as
  -- one source only when both bucket and path exist.
  constraint store_evaluation_evidence_source_xor
    check (
      (
        case when storage_bucket is not null and storage_path is not null then 1 else 0 end
        + case when external_url is not null then 1 else 0 end
        + case when store_document_id is not null then 1 else 0 end
      ) = 1
      and ((storage_bucket is null) = (storage_path is null))
    ),
  constraint store_evaluation_evidence_storage_bucket_not_blank
    check (storage_bucket is null or btrim(storage_bucket) <> ''),
  constraint store_evaluation_evidence_storage_path_not_blank
    check (storage_path is null or btrim(storage_path) <> ''),
  constraint store_evaluation_evidence_external_url_not_blank
    check (external_url is null or btrim(external_url) <> ''),
  constraint store_evaluation_evidence_file_size_nonnegative
    check (file_size_bytes is null or file_size_bytes >= 0),
  constraint store_evaluation_evidence_sha256_format
    check (file_sha256 is null or file_sha256 ~ '^[0-9a-fA-F]{64}$'),
  constraint store_evaluation_evidence_verification_consistency
    check (
      (verification_status = 'PENDING' and verified_at is null and verified_by is null)
      or
      (verification_status <> 'PENDING' and verified_at is not null)
    ),
  constraint store_evaluation_evidence_private_storage_unique
    unique (storage_bucket, storage_path)
);

comment on table public.store_evaluation_evidence is
  'Evidence attached to exactly one evaluation criterion or gate. It may reference a private evaluation file, external URL, or reusable institutional Store document.';

-- -----------------------------------------------------------------------------
-- CONTEXTUAL INTEGRITY
-- -----------------------------------------------------------------------------
-- Add composite uniqueness needed to prove that an Item/Gate belongs to the
-- declared Evaluation without relying on application code.

alter table public.store_evaluation_items
  add constraint store_evaluation_items_id_evaluation_unique
  unique (id, evaluation_id);

alter table public.store_gate_checks
  add constraint store_gate_checks_id_evaluation_unique
  unique (id, evaluation_id);

alter table public.store_evaluation_evidence
  add constraint store_evaluation_evidence_item_context_fk
  foreign key (evaluation_item_id, evaluation_id)
  references public.store_evaluation_items(id, evaluation_id)
  on delete restrict;

alter table public.store_evaluation_evidence
  add constraint store_evaluation_evidence_gate_context_fk
  foreign key (gate_check_id, evaluation_id)
  references public.store_gate_checks(id, evaluation_id)
  on delete restrict;

-- -----------------------------------------------------------------------------
-- INDEXES
-- -----------------------------------------------------------------------------

create index if not exists commercial_store_documents_store_idx
  on public.commercial_store_documents(store_id, document_type_id, uploaded_at desc);

create index if not exists commercial_store_documents_location_idx
  on public.commercial_store_documents(location_id, document_type_id, uploaded_at desc)
  where location_id is not null;

create index if not exists commercial_store_documents_verification_idx
  on public.commercial_store_documents(verification_status);

create index if not exists commercial_store_documents_expiration_idx
  on public.commercial_store_documents(expires_at)
  where expires_at is not null;

create index if not exists commercial_store_documents_supersedes_idx
  on public.commercial_store_documents(supersedes_document_id)
  where supersedes_document_id is not null;

create index if not exists store_evaluation_evidence_evaluation_idx
  on public.store_evaluation_evidence(evaluation_id, verification_status);

create index if not exists store_evaluation_evidence_item_idx
  on public.store_evaluation_evidence(evaluation_item_id)
  where evaluation_item_id is not null;

create index if not exists store_evaluation_evidence_gate_idx
  on public.store_evaluation_evidence(gate_check_id)
  where gate_check_id is not null;

create index if not exists store_evaluation_evidence_document_idx
  on public.store_evaluation_evidence(store_document_id)
  where store_document_id is not null;

-- -----------------------------------------------------------------------------
-- COMMAND / STORAGE BOUNDARY
-- -----------------------------------------------------------------------------
-- Future command functions must additionally enforce rules that depend on data
-- from multiple tables and therefore cannot be safely represented by a CHECK:
--
-- register_store_document():
--   * validates document type scope (organization/location);
--   * validates conditional metadata requirements (number/issue/expiration);
--   * validates location belongs to Store;
--   * validates superseded document belongs to same Store, compatible Location
--     and same document type;
--   * computes/validates canonical storage path and metadata;
--   * records audit event.
--
-- verify_store_document() / reject_store_document():
--   * require explicit permission;
--   * preserve prior document versions;
--   * never convert expiration into verification state.
--
-- register_evaluation_evidence():
--   * proves Item/Gate belongs to Evaluation;
--   * when store_document_id is used, proves document belongs to the same Store
--     and compatible Location context as the Evaluation;
--   * enforces evidence type/source compatibility;
--   * recalculates parent evidence_status server-side.
--
-- verify_evaluation_evidence() / reject_evaluation_evidence():
--   * require explicit permission;
--   * update evidence summary status transactionally;
--   * preserve rejected evidence rather than deleting it.
--
-- STORAGE:
--   * Supabase buckets for 03B evidence/documents are PRIVATE;
--   * signed URLs are short-lived and server-generated;
--   * no signed/public URL is persisted in these tables;
--   * recommended paths:
--       commercial/stores/{store_id}/corporate/
--       commercial/stores/{store_id}/locations/{location_id}/
--       commercial/stores/{store_id}/evaluations/{evaluation_id}/items/
--       commercial/stores/{store_id}/evaluations/{evaluation_id}/gates/
--       commercial/stores/{store_id}/evaluations/{evaluation_id}/visits/
--   * PostgreSQL + Storage are not one ACID transaction; upload workflows must
--     implement compensation/cleanup for partial failures.

commit;
