# 03B Commercial Platform — Technical Reconnaissance

Status: Architecture Freeze V1 approved. This document records the technical baseline before implementation.

## Source of truth

The production e-commerce codebase is this repository: `deltastudiocomunicaciones-cpu/wolves-territory`.

The Supabase project previously named `wolves-os` is a prototype and is explicitly excluded from the 03B implementation baseline.

## Existing application architecture observed in repository

### Existing functional areas

- `app/admin`
  - seller applications
  - payouts
  - settlements
- `app/api`
  - admin
  - checkout
  - seller
  - Wompi
- `app/seller`
  - current referral/seller experience
- `lib/order-store.ts`
  - order persistence
  - commission recognition
- `lib/inventory-store.ts`
  - inventory RPC bridge
- `lib/supabase-server.ts`
  - trusted server client using `SUPABASE_SERVICE_ROLE_KEY`

## Existing persistence contracts inferred from code

The current Referral implementation expects at least the following database objects:

### Tables

- `orders`
- `order_items`
- `partners`
- `commissions`
- `seller_applications`
- `admin_users`
- `seller_settlements`
- `partner_payout_accounts`

### RPC / database functions

- `approve_seller_application`
- `process_order_inventory`

These are existing Referral-domain contracts and MUST NOT be renamed or repurposed by 03B without a dedicated migration/refactor plan.

## Current commercial flow observed

```text
REFERRAL / SELLER
      ↓
partner code validation
      ↓
checkout
      ↓
orders + order_items
      ↓
Wompi webhook
      ↓
order status
      ↓
commission recognition
      ↓
inventory processing
      ↓
settlement / payout
```

The 03B Store/Custody model must remain a separate domain while later integrating with shared engines where appropriate.

## Architecture boundary

```text
SELLERS / REFERRALS                 STORES / 03B
        │                               │
        └──────────┐         ┌──────────┘
                   ▼         ▼
                 SALES ENGINE
                      ↓
              COMMISSION ENGINE
                      ↓
                 SETTLEMENTS
                      ↓
                   SADI/ERP
```

03B will not overload `partners` to represent physical commercial stores.

## Security finding

`lib/supabase-server.ts` creates a trusted Supabase client using `SUPABASE_SERVICE_ROLE_KEY`.

This is valid for trusted server/system operations, but 03B must distinguish two execution paths:

```text
NORMAL USER OPERATIONS
User JWT → RLS → Command Functions

TRUSTED SYSTEM OPERATIONS
Server only → service role → narrowly scoped system operations
```

The service-role client must never become the default authorization model for the Store Portal.

## REUSE / ADAPT / CREATE map

| Area | Decision | Notes |
| --- | --- | --- |
| Storefront / checkout | REUSE | Existing purchase flow remains operational |
| Wompi integration | REUSE | Existing signed webhook flow remains authoritative |
| Referral Sellers | REUSE | Separate commercial acquisition model |
| Orders / order items | REUSE | Candidate shared Sales Engine foundation |
| Referral commissions | REUSE | Existing Seller commission path remains intact |
| Seller settlements | REUSE / ADAPT LATER | Candidate shared settlement concepts, not merged prematurely |
| Admin portal | ADAPT | Add 03B modules without rebuilding current admin |
| Server Supabase admin client | RESTRICT | System operations only |
| Versioned Supabase migrations in repo | CREATE | 03B will introduce repository-owned schema history |
| Commercial Store core | CREATE | New domain |
| Store Locations | CREATE | New domain |
| Methodology Engine | CREATE | New domain |
| Evaluation / Gates / Evidence | CREATE | New domain |
| Membership / Invitations | CREATE | New domain |
| Governance / Permissions | CREATE | New domain |
| Business Audit | CREATE | New cross-domain engine |
| 03B RLS | CREATE | Default-deny model |

## Frozen 03B principles

1. Identity is not authority.
2. Organization is not location.
3. Score is not approval.
4. Evidence is not verification.
5. Role is not permission.
6. Permission is not governance.
7. Policy cannot break integrity.
8. Business actions are not raw updates.
9. Current state is not history.
10. No critical rule depends only on the frontend.

## Implementation strategy

No existing Referral tables are modified in the first 03B kernel migration.

The first implementation sequence is:

```text
03B-001  foundational enums and structural types
03B-002  methodology engine
03B-003  commercial stores + locations
03B-004  evaluations + items + gates
03B-005  evidence + documents
03B-006  memberships + invitations
03B-007  permissions + platform roles
03B-008  governance policies
03B-009  audit engine
03B-010  command/validation functions
03B-011  RLS + storage policies
03B-012  WT-SQ-1.0 seed
03B-013  security / regression tests
```

Exact migration filenames may be consolidated before production deployment, but dependency order must be preserved.

## Non-goals of the first kernel

The first 03B implementation does not yet create:

- commercial agreements / contracts
- custody inventory
- store sales
- store commissions
- store settlements
- SADI synchronization
- multi-tenant FASI SaaS infrastructure

Those domains begin only after the Store qualification/governance kernel is stable.

## Release rule

Every implementation block must pass:

1. Schema validity
2. Business-rule validity
3. Security validity
4. Existing Referral regression/build validity

No 03B migration is applied to a production database until the actual production Supabase project backing this repository has been identified and reconciled against the inferred existing schema.
