-- 03B Commercial Platform
-- Migration: 03B-012 Kernel Catalog Seed
-- Architecture Freeze: V1
--
-- Seeds ONLY technical vocabularies already referenced by the 03B kernel.
-- It intentionally does NOT seed role-permission matrices, platform users,
-- governance quorum, recommendation rules, Store Qualification criterion
-- weights/scopes/evidence rules, or any other pending business decision.
--
-- Result after this migration is deliberately fail-closed: permissions exist,
-- but no human receives them until an approved mapping/provisioning decision is
-- applied through a later controlled migration/command.

begin;

-- -----------------------------------------------------------------------------
-- PERMISSION VOCABULARY USED BY 03B-010 / 03B-011
-- -----------------------------------------------------------------------------

insert into public.permissions
  (code, name, description, scope, domain, risk_level, is_active)
values
  ('methodology.read',     'Read methodologies',        'Read methodology definitions permitted by platform policy.',                 'PLATFORM', 'methodology', 'LOW',      true),
  ('methodology.activate', 'Activate methodology',      'Activate a validated methodology version.',                                 'PLATFORM', 'methodology', 'CRITICAL', true),
  ('governance.read',      'Read governance policies',  'Read governance policy definitions permitted by platform policy.',           'PLATFORM', 'governance',  'HIGH',     true),
  ('governance.activate',  'Activate governance policy','Activate a validated governance policy version.',                            'PLATFORM', 'governance',  'CRITICAL', true),
  ('store.read',           'Read commercial stores',    'Read commercial Store and Location records within authorized context.',       'STORE',    'store',       'LOW',      true),
  ('membership.read',      'Read memberships',          'Read Store membership/invitation records within authorized context.',         'STORE',    'membership',  'MEDIUM',   true),
  ('evaluation.read',      'Read evaluations',          'Read Store qualification evaluations and scored/gate data.',                  'STORE',    'evaluation',  'MEDIUM',   true),
  ('evaluation.create',    'Create evaluations',        'Create a Store qualification evaluation under active methodology/policy.',   'PLATFORM', 'evaluation',  'HIGH',     true),
  ('evaluation.score',     'Score evaluations',         'Score criteria and verify gate status while an evaluation is editable.',      'PLATFORM', 'evaluation',  'HIGH',     true),
  ('evaluation.submit',    'Submit evaluations',        'Submit a complete evaluation for governed review.',                          'PLATFORM', 'evaluation',  'HIGH',     true),
  ('evaluation.review',    'Review evaluations',        'Submit partner/governance review decisions.',                                'PLATFORM', 'evaluation',  'HIGH',     true),
  ('evaluation.finalize',  'Finalize evaluations',      'Issue final governed decision for a Store qualification evaluation.',         'PLATFORM', 'evaluation',  'CRITICAL', true),
  ('document.read',        'Read Store documents',      'Read Store/Location institutional documents within authorized context.',      'STORE',    'document',    'MEDIUM',   true),
  ('evidence.read',        'Read evaluation evidence',  'Read evaluation evidence within authorized Store/Location context.',          'STORE',    'evidence',    'MEDIUM',   true),
  ('platform_role.read',   'Read platform roles',       'Read platform role assignments when institutionally authorized.',             'PLATFORM', 'security',    'HIGH',     true),
  ('audit.read',           'Read audit ledger',         'Read the raw institutional audit ledger.',                                   'PLATFORM', 'audit',       'CRITICAL', true)
on conflict (code) do nothing;

-- -----------------------------------------------------------------------------
-- AUDIT EVENT VOCABULARY USED BY CURRENT COMMAND FUNCTIONS
-- -----------------------------------------------------------------------------
-- requires_reason remains false unless an already-approved command rule
-- explicitly mandates a reason. We do not create new business obligations here.

insert into public.audit_event_types
  (code, domain, description, risk_level, requires_reason, is_active)
values
  ('methodology.activated',                'methodology', 'A methodology version was activated after validation.',                    'CRITICAL', false, true),
  ('governance_policy.activated',          'governance',  'A governance policy version was activated after validation.',              'CRITICAL', false, true),
  ('evaluation.created',                   'evaluation',  'A Store qualification evaluation dossier was created.',                    'HIGH',     false, true),
  ('evaluation.started',                   'evaluation',  'A Store qualification evaluation entered active scoring.',                 'MEDIUM',   false, true),
  ('evaluation.item_scored',               'evaluation',  'A scored criterion was set or changed through the command layer.',          'MEDIUM',   false, true),
  ('evaluation.gate_changed',              'evaluation',  'An eligibility gate status was set or changed through the command layer.',  'HIGH',     false, true),
  ('evaluation.submitted',                 'evaluation',  'A complete evaluation was submitted for governed review.',                 'HIGH',     false, true),
  ('evaluation.partner_review_submitted',  'evaluation',  'A partner/governance review decision was recorded.',                       'HIGH',     false, true),
  ('evaluation.finalized',                 'evaluation',  'A final governed evaluation decision was recorded.',                       'CRITICAL', false, true)
on conflict (code) do nothing;

commit;
