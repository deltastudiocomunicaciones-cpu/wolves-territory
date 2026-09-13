-- 03B Commercial Platform
-- Migration: 03B-012 WT Store Qualification V1 Seed
-- Architecture Freeze: V1
--
-- Seeds the approved WT-SQ-1.0 qualification methodology only.
-- It does NOT invent the pending system recommendation matrix, governance
-- quorum, role-permission matrices, HOLD lifecycle, or settlement rules.
--
-- Classification convention in V1:
--   lower bound inclusive, upper bound exclusive, except the top methodology
--   endpoint (100), which is inclusive.

begin;

do $$
declare
  v_methodology_id uuid;
  v_bf uuid;
  v_pc uuid;
  v_um uuid;
  v_co uuid;
  v_cs uuid;
  v_se uuid;
  v_re uuid;
  v_cd uuid;
  v_pe uuid;
begin
  -- Idempotent only when the exact version has not already been seeded.
  if exists (
    select 1 from public.evaluation_methodologies
    where code = 'WT-SQ' and version = '1.0'
  ) then
    raise exception using
      errcode = 'P0001',
      message = 'WT03B_WT_SQ_1_0_ALREADY_EXISTS';
  end if;

  insert into public.evaluation_methodologies (
    code, version, name, description, status, country_code, score_min, score_max
  ) values (
    'WT-SQ',
    '1.0',
    'WT Store Qualification V1',
    'Wolves Territory institutional methodology for qualification of commercial Store organizations and their physical Locations.',
    'DRAFT',
    'CO',
    0,
    100
  ) returning id into v_methodology_id;

  -- ---------------------------------------------------------------------------
  -- DIMENSIONS — TOTAL = 100
  -- ---------------------------------------------------------------------------
  insert into public.evaluation_dimensions
    (methodology_id, code, name, weight, display_order)
  values
    (v_methodology_id, 'BF', 'Brand Fit', 20, 10),
    (v_methodology_id, 'PC', 'Commercial Potential', 15, 20),
    (v_methodology_id, 'UM', 'Location & Market', 15, 30),
    (v_methodology_id, 'CO', 'Operational Capacity', 10, 40),
    (v_methodology_id, 'CS', 'Custody & Security', 10, 50),
    (v_methodology_id, 'SE', 'Business Strength', 10, 60),
    (v_methodology_id, 'RE', 'Reputation', 10, 70),
    (v_methodology_id, 'CD', 'Digital Capability', 5, 80),
    (v_methodology_id, 'PE', 'Strategic Potential', 5, 90);

  select id into v_bf from public.evaluation_dimensions where methodology_id=v_methodology_id and code='BF';
  select id into v_pc from public.evaluation_dimensions where methodology_id=v_methodology_id and code='PC';
  select id into v_um from public.evaluation_dimensions where methodology_id=v_methodology_id and code='UM';
  select id into v_co from public.evaluation_dimensions where methodology_id=v_methodology_id and code='CO';
  select id into v_cs from public.evaluation_dimensions where methodology_id=v_methodology_id and code='CS';
  select id into v_se from public.evaluation_dimensions where methodology_id=v_methodology_id and code='SE';
  select id into v_re from public.evaluation_dimensions where methodology_id=v_methodology_id and code='RE';
  select id into v_cd from public.evaluation_dimensions where methodology_id=v_methodology_id and code='CD';
  select id into v_pe from public.evaluation_dimensions where methodology_id=v_methodology_id and code='PE';

  -- ---------------------------------------------------------------------------
  -- CRITERIA — SCALE 1..5
  -- ORGANIZATION: identity/legal/reputation/strategic-company context
  -- LOCATION: physical point/location/security context
  -- COMBINED: requires organization + location operating context
  -- ---------------------------------------------------------------------------

  insert into public.evaluation_criteria_catalog
    (methodology_id, dimension_id, code, name, evaluation_scope, weight, min_score, max_score, evidence_required, display_order)
  values
    -- Brand Fit = 20
    (v_methodology_id,v_bf,'BF01','Aesthetic alignment','COMBINED',3,1,5,false,10),
    (v_methodology_id,v_bf,'BF02','Target audience alignment','COMBINED',5,1,5,false,20),
    (v_methodology_id,v_bf,'BF03','Brands currently sold','ORGANIZATION',4,1,5,false,30),
    (v_methodology_id,v_bf,'BF04','Price range compatibility','COMBINED',3,1,5,false,40),
    (v_methodology_id,v_bf,'BF05','Visual merchandising quality','LOCATION',3,1,5,true,50),
    (v_methodology_id,v_bf,'BF06','Market positioning','ORGANIZATION',2,1,5,false,60),

    -- Commercial Potential = 15
    (v_methodology_id,v_pc,'PC01','Customer traffic','LOCATION',3,1,5,false,10),
    (v_methodology_id,v_pc,'PC02','Sales conversion capability','COMBINED',3,1,5,false,20),
    (v_methodology_id,v_pc,'PC03','Average ticket compatibility','ORGANIZATION',3,1,5,false,30),
    (v_methodology_id,v_pc,'PC04','Premium / fashion retail experience','ORGANIZATION',2,1,5,false,40),
    (v_methodology_id,v_pc,'PC05','Commercial team capability','LOCATION',2,1,5,false,50),
    (v_methodology_id,v_pc,'PC06','Seasonality resilience','COMBINED',2,1,5,false,60),

    -- Location & Market = 15
    (v_methodology_id,v_um,'UM01','Location quality','LOCATION',3,1,5,true,10),
    (v_methodology_id,v_um,'UM02','Socioeconomic profile','LOCATION',3,1,5,false,20),
    (v_methodology_id,v_um,'UM03','Demographic fit','LOCATION',3,1,5,false,30),
    (v_methodology_id,v_um,'UM04','Pedestrian / customer traffic','LOCATION',3,1,5,false,40),
    (v_methodology_id,v_um,'UM05','Accessibility','LOCATION',1,1,5,false,50),
    (v_methodology_id,v_um,'UM06','Competitive / complementary environment','LOCATION',2,1,5,false,60),

    -- Operational Capacity = 10
    (v_methodology_id,v_co,'CO01','Defined inventory responsible person','LOCATION',2,1,5,false,10),
    (v_methodology_id,v_co,'CO02','Sales record discipline','ORGANIZATION',2,1,5,false,20),
    (v_methodology_id,v_co,'CO03','Administrative order','ORGANIZATION',2,1,5,false,30),
    (v_methodology_id,v_co,'CO04','Returns management','ORGANIZATION',1,1,5,false,40),
    (v_methodology_id,v_co,'CO05','Inventory reconciliation capability','COMBINED',2,1,5,false,50),
    (v_methodology_id,v_co,'CO06','Documented operating procedures','ORGANIZATION',1,1,5,false,60),

    -- Custody & Security = 10
    (v_methodology_id,v_cs,'CS01','Controlled inventory access','LOCATION',2,1,5,true,10),
    (v_methodology_id,v_cs,'CS02','Storage conditions','LOCATION',2,1,5,true,20),
    (v_methodology_id,v_cs,'CS03','Physical security measures','LOCATION',2,1,5,true,30),
    (v_methodology_id,v_cs,'CS04','Loss prevention controls','LOCATION',2,1,5,false,40),
    (v_methodology_id,v_cs,'CS05','Protection of non-display merchandise','LOCATION',1,1,5,false,50),
    (v_methodology_id,v_cs,'CS06','Incident management capability','COMBINED',1,1,5,false,60),

    -- Business Strength = 10
    (v_methodology_id,v_se,'SE01','Legal existence','ORGANIZATION',2,1,5,true,10),
    (v_methodology_id,v_se,'SE02','RUT availability','ORGANIZATION',1,1,5,true,20),
    (v_methodology_id,v_se,'SE03','Chamber of Commerce registration','ORGANIZATION',1,1,5,true,30),
    (v_methodology_id,v_se,'SE04','Authorized legal representative','ORGANIZATION',1,1,5,true,40),
    (v_methodology_id,v_se,'SE05','Business age / continuity','ORGANIZATION',1,1,5,false,50),
    (v_methodology_id,v_se,'SE06','Commercial references','ORGANIZATION',2,1,5,true,60),
    (v_methodology_id,v_se,'SE07','Administrative capacity','ORGANIZATION',2,1,5,false,70),

    -- Reputation = 10
    (v_methodology_id,v_re,'RE01','Public reputation','ORGANIZATION',2,1,5,false,10),
    (v_methodology_id,v_re,'RE02','Customer reviews','ORGANIZATION',1,1,5,false,20),
    (v_methodology_id,v_re,'RE03','Customer relationship quality','ORGANIZATION',2,1,5,false,30),
    (v_methodology_id,v_re,'RE04','Social media presence','ORGANIZATION',1,1,5,false,40),
    (v_methodology_id,v_re,'RE05','Commercial history','ORGANIZATION',2,1,5,false,50),
    (v_methodology_id,v_re,'RE06','Compatibility with Wolves Territory reputation','COMBINED',2,1,5,false,60),

    -- Digital Capability = 5
    (v_methodology_id,v_cd,'CD01','POS capability','LOCATION',1,1,5,false,10),
    (v_methodology_id,v_cd,'CD02','Data export capability','ORGANIZATION',1,1,5,false,20),
    (v_methodology_id,v_cd,'CD03','ERP / invoicing capability','ORGANIZATION',1,1,5,false,30),
    (v_methodology_id,v_cd,'CD04','Connectivity','LOCATION',1,1,5,false,40),
    (v_methodology_id,v_cd,'CD05','Platform portal adoption readiness','COMBINED',1,1,5,false,50),

    -- Strategic Potential = 5
    (v_methodology_id,v_pe,'PE01','Growth potential','ORGANIZATION',1,1,5,false,10),
    (v_methodology_id,v_pe,'PE02','Local influence','COMBINED',1,1,5,false,20),
    (v_methodology_id,v_pe,'PE03','Access to new audiences','COMBINED',1,1,5,false,30),
    (v_methodology_id,v_pe,'PE04','Activation potential','LOCATION',1,1,5,false,40),
    (v_methodology_id,v_pe,'PE05','Expansion potential','ORGANIZATION',1,1,5,false,50);

  -- ---------------------------------------------------------------------------
  -- GATES G01-G12 — all critical in WT-SQ-1.0
  -- ---------------------------------------------------------------------------

  insert into public.evaluation_gate_catalog
    (methodology_id, code, name, description, evaluation_scope, is_critical, allow_not_applicable, evidence_required, display_order)
  values
    (v_methodology_id,'G01','Legal identity verified','The commercial organization has a verifiable legal identity.','ORGANIZATION',true,false,true,10),
    (v_methodology_id,'G02','Minimum documentation complete','Minimum institutional documentation required for qualification is available.','ORGANIZATION',true,false,true,20),
    (v_methodology_id,'G03','Authorized representative verified','The person representing the organization is duly identified/authorized.','ORGANIZATION',true,false,true,30),
    (v_methodology_id,'G04','Physical point verified','The proposed physical commercial point has been verified.','LOCATION',true,false,true,40),
    (v_methodology_id,'G05','Custody model accepted','The Store accepts that merchandise remains property of Wolves while held in custody.','COMBINED',true,false,true,50),
    (v_methodology_id,'G06','Controlled PVP accepted','The Store accepts Wolves-controlled retail pricing and restrictions on unauthorized discounts/surcharges/promotions.','COMBINED',true,false,true,60),
    (v_methodology_id,'G07','Digital traceability accepted','The Store accepts digital inventory/sales traceability through the platform.','COMBINED',true,false,true,70),
    (v_methodology_id,'G08','Custody capacity verified','The physical point demonstrates adequate capacity to safeguard merchandise in custody.','LOCATION',true,false,true,80),
    (v_methodology_id,'G09','No critical reputation alert','No unresolved critical reputation condition blocks the relationship.','ORGANIZATION',true,false,true,90),
    (v_methodology_id,'G10','Monthly settlement accepted','The Store accepts the monthly settlement model; the exact payment deadline is defined separately and is not invented here.','COMBINED',true,false,true,100),
    (v_methodology_id,'G11','Authorized channels accepted','The Store accepts the authorized physical/digital channel rules.','COMBINED',true,false,true,110),
    (v_methodology_id,'G12','Financial information available','Required financial/commercial information for evaluation is available.','ORGANIZATION',true,false,true,120);

  -- ---------------------------------------------------------------------------
  -- CLASSIFICATION BANDS
  -- Semantics consumed by command functions:
  -- [min,max), except the final score_max endpoint is inclusive.
  -- ---------------------------------------------------------------------------

  insert into public.evaluation_classification_bands
    (methodology_id, classification, min_score, max_score, display_order)
  values
    (v_methodology_id,'NOT_RECOMMENDED',0,60,10),
    (v_methodology_id,'CONDITIONAL',60,70,20),
    (v_methodology_id,'APPROVED',70,80,30),
    (v_methodology_id,'STRATEGIC',80,90,40),
    (v_methodology_id,'ELITE',90,100,50);

end $$;

-- -----------------------------------------------------------------------------
-- IMPORTANT ACTIVATION BOUNDARY
-- -----------------------------------------------------------------------------
-- WT-SQ-1.0 is deliberately seeded as DRAFT.
-- Do NOT manually UPDATE it to ACTIVE.
-- Production activation must occur through activate_evaluation_methodology()
-- after the real Wolves Territory Supabase project has been identified and the
-- full migration chain has passed validation/regression tests.
--
-- This seed intentionally does NOT define:
--   * system recommendation matrix (TBD)
--   * partner review quorum (TBD)
--   * platform/store role-permission matrices (TBD)
--   * HOLD lifecycle (TBD)
--   * monthly settlement payment deadline (TBD)
--
-- Score classification is not approval. Critical gates and governance remain
-- independent blockers even for an ELITE numerical result.

commit;
