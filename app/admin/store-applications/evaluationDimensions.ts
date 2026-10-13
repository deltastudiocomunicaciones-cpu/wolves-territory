export const STORE_EVALUATION_DIMENSIONS = [
  {
    code: "BRAND_FIT",
    name: "Brand Fit",
    weight: 20,
    description: "Afinidad con la identidad y el posicionamiento de Wolves Territory.",
  },
  {
    code: "COMMERCIAL_POTENTIAL",
    name: "Commercial Potential",
    weight: 15,
    description: "Potencial de ventas y desarrollo comercial.",
  },
  {
    code: "LOCATION_MARKET",
    name: "Location & Market",
    weight: 15,
    description: "Ubicación y características del mercado atendido.",
  },
  {
    code: "OPERATIONAL_CAPACITY",
    name: "Operational Capacity",
    weight: 10,
    description: "Capacidad para ejecutar la operación comercial.",
  },
  {
    code: "CUSTODY_SECURITY",
    name: "Custody & Security",
    weight: 10,
    description: "Condiciones de custodia y protección de mercancía.",
  },
  {
    code: "BUSINESS_STRENGTH",
    name: "Business Strength",
    weight: 10,
    description: "Solidez y continuidad del establecimiento.",
  },
  {
    code: "REPUTATION",
    name: "Reputation",
    weight: 10,
    description: "Reputación y antecedentes comerciales.",
  },
  {
    code: "DIGITAL_CAPABILITY",
    name: "Digital Capability",
    weight: 5,
    description: "Capacidad de utilizar herramientas digitales de trazabilidad.",
  },
  {
    code: "STRATEGIC_POTENTIAL",
    name: "Strategic Potential",
    weight: 5,
    description: "Potencial de crecimiento y colaboración estratégica.",
  },
] as const;

export type StoreEvaluationDimensionCode =
  (typeof STORE_EVALUATION_DIMENSIONS)[number]["code"];
