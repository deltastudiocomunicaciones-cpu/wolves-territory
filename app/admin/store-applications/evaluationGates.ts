export const STORE_EVALUATION_GATES = [
  { code: "G01", name: "Identidad legal", description: "Verificación de la identidad legal del establecimiento." },
  { code: "G02", name: "Documentación", description: "Revisión de la documentación requerida." },
  { code: "G03", name: "Representante", description: "Identificación y verificación del representante." },
  { code: "G04", name: "Ubicación", description: "Verificación de la ubicación comercial." },
  { code: "G05", name: "Aceptación de custodia", description: "Aceptación de las condiciones de custodia de mercancía." },
  { code: "G06", name: "Aceptación de PVP", description: "Aceptación de los precios de venta establecidos." },
  { code: "G07", name: "Trazabilidad digital", description: "Aceptación de los mecanismos de trazabilidad digital." },
  { code: "G08", name: "Capacidad de custodia", description: "Verificación de condiciones operativas para custodiar mercancía." },
  { code: "G09", name: "Reputación", description: "Verificación de antecedentes y reputación comercial." },
  { code: "G10", name: "Liquidación mensual", description: "Aceptación del proceso de liquidación comercial mensual." },
  { code: "G11", name: "Canales autorizados", description: "Aceptación de los canales de comercialización autorizados." },
  { code: "G12", name: "Información bancaria", description: "Verificación de la información bancaria requerida." },
] as const;

export const STORE_GATE_STATUSES = [
  { value: "PENDING", label: "Pendiente" },
  { value: "PASS", label: "Cumple" },
  { value: "FAIL", label: "No cumple" },
  { value: "NOT_APPLICABLE", label: "No aplica" },
] as const;

export type StoreEvaluationGateCode =
  (typeof STORE_EVALUATION_GATES)[number]["code"];

export type StoreEvaluationGateStatus =
  (typeof STORE_GATE_STATUSES)[number]["value"];
