# WT-SQ-1.0 — Decisions Required Before Seed

Status: **BUSINESS CONFIGURATION PENDING**

This document exists to prevent Architecture Freeze V1 from silently turning
unapproved assumptions into executable business rules.

## Already approved

The following is considered frozen at business-concept level:

- Methodology: WT Store Qualification V1.
- Evaluation scale concept: criterion scoring from 1 to 5.
- Nine dimensions and dimension weights:
  - Brand Fit — 20
  - Commercial Potential — 15
  - Location & Market — 15
  - Operational Capacity — 10
  - Custody & Security — 10
  - Business Strength — 10
  - Reputation — 10
  - Digital Capability — 5
  - Strategic Potential — 5
- Criterion vocabulary BF01..PE05.
- Gate vocabulary G01..G12.
- Classification bands:
  - 90–100 ELITE
  - 80–<90 STRATEGIC
  - 70–<80 APPROVED
  - 60–<70 CONDITIONAL
  - 0–<60 NOT_RECOMMENDED
- Classification is not approval.
- Critical eligibility conditions may block approval independently from score.
- Governance chain includes evidence, system recommendation, partner review and
  final SUPERADMIN decision.

## Must be explicitly approved before executable WT-SQ seed

### 1. Criterion-level weights

Dimension totals are approved; distribution inside each dimension is not yet
frozen. Example: Brand Fit totals 20, but BF01/BF02/... exact shares require an
explicit decision.

Required output:

| Criterion | Weight |
| --- | ---: |
| BF01 | TBD |
| ... | ... |

Every active criterion weight must reconcile exactly to its parent dimension.

### 2. Evaluation scope per criterion and gate

For each code, decide one of:

- ORGANIZATION
- LOCATION
- COMBINED

Architecture supports all three, but the database seed must not infer scope from
the criterion's wording.

### 3. Evidence requiredness

For every criterion and gate, decide whether supporting evidence is mandatory.
`evidence_required=true/false` is a business control, not a technical default.

### 4. Gate criticality

For G01..G12 decide whether `is_critical=true`. A critical FAIL may block final
approval independently from score, so this cannot be inferred silently.

### 5. NOT_APPLICABLE policy

For each gate decide whether `allow_not_applicable=true`. If allowed, define the
expected justification/evidence rule.

### 6. System recommendation matrix

Define how score/classification + gates + evidence produce one of:

- STRONGLY_APPROVE
- APPROVE
- CONDITIONAL
- HOLD
- REJECT

Until approved, `derive_system_recommendation()` must remain fail-closed with
`WT03B_RECOMMENDATION_MATRIX_NOT_CONFIGURED`.

### 7. Partner review quorum

Define at least:

- minimum_partner_reviews
- minimum_partner_approvals

No value is assumed by the kernel.

### 8. Platform role → permission matrix

Roles available:

- SUPERADMIN
- COMMERCIAL_ADMIN
- EVALUATOR
- PARTNER_REVIEWER
- FINANCE
- AUDITOR

Map each role explicitly to approved permission codes. Role name alone never
implies authority.

### 9. Store role → permission matrix

Roles available:

- OWNER
- MANAGER
- INVENTORY_MANAGER
- SALES_OPERATOR
- VIEWER

Map each role explicitly. Location scope remains an additional authorization
condition.

### 10. Store-facing evaluation visibility

Decide whether Store members may see:

- total score;
- classification;
- individual criterion scores;
- gate states;
- evidence status;
- internal evaluator comments.

Raw partner/governance deliberation remains platform-internal by design.

### 11. HOLD lifecycle

Define what happens after a final HOLD decision: resume state, responsible role,
new review round rules and expiration/reassessment behavior. Until then HOLD is
explicitly rejected by the finalization command.

## Rule of interpretation

If a value is not listed as approved above, absence means **TBD**, not permission
to infer a convenient default.

> UNKNOWN BUSINESS RULE → FAIL CLOSED, NEVER GUESS.
