
"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  STORE_EVALUATION_GATES,
  STORE_GATE_STATUSES,
  type StoreEvaluationGateCode,
  type StoreEvaluationGateStatus,
} from "./evaluationGates";

type GateRecord = {
  gate_code: StoreEvaluationGateCode;
  status: StoreEvaluationGateStatus;
  justification: string | null;
  evidence_reference: string | null;
  verified_by: string | null;
  verified_at: string | null;
};

type GateDraft = {
  status: StoreEvaluationGateStatus;
  justification: string;
  evidence: string;
};

export default function StoreEvaluationGates({
  evaluationId,
}: {
  evaluationId: string;
}) {
  const [selectedCode, setSelectedCode] =
    useState<StoreEvaluationGateCode>("G01");
  const [records, setRecords] =
    useState<Record<string, GateRecord>>({});
  const [drafts, setDrafts] =
    useState<Record<string, GateDraft>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const selectedGate = STORE_EVALUATION_GATES.find(
    (gate) => gate.code === selectedCode
  )!;

  const saved = records[selectedCode];

  const draft = drafts[selectedCode] ?? {
    status: saved?.status ?? "PENDING",
    justification: saved?.justification ?? "",
    evidence: saved?.evidence_reference ?? "",
  };

  const verified = STORE_EVALUATION_GATES.filter(
    (gate) =>
      records[gate.code] &&
      records[gate.code].status !== "PENDING"
  ).length;

  const failed = STORE_EVALUATION_GATES.filter(
    (gate) => records[gate.code]?.status === "FAIL"
  ).length;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError("");
      setRecords({});
      setDrafts({});

      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) throw new Error("Sesión expirada.");

        const response = await fetch(
          `/api/admin/store-applications/evaluation-gates?evaluationId=${encodeURIComponent(evaluationId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "No fue posible recuperar los Gates."
          );
        }

        if (cancelled) return;

        const restored: Record<string, GateRecord> = {};

        for (const item of result.gates as GateRecord[]) {
          if (
            STORE_EVALUATION_GATES.some(
              (gate) => gate.code === item.gate_code
            )
          ) {
            restored[item.gate_code] = item;
          }
        }

        setRecords(restored);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error ? cause.message : "Error de lectura."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  function updateDraft(patch: Partial<GateDraft>) {
    setDrafts((current) => ({
      ...current,
      [selectedCode]: { ...draft, ...patch },
    }));
    setError("");
    setMessage("");
  }

  async function save() {
    if (
      loading ||
      saving ||
      (draft.status !== "PENDING" && !draft.justification.trim())
    ) return;

    const code = selectedCode;
    const values = { ...draft };

    setSaving(true);
    setError("");
    setMessage("");

    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) throw new Error("Sesión expirada.");

      const response = await fetch(
        "/api/admin/store-applications/evaluation-gates",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            evaluationId,
            gateCode: code,
            status: values.status,
            justification: values.justification.trim(),
            evidenceReference: values.evidence.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "No fue posible guardar el Gate."
        );
      }

      setRecords((current) => ({
        ...current,
        [code]: {
          gate_code: code,
          status: values.status,
          justification: values.justification.trim() || null,
          evidence_reference: values.evidence.trim() || null,
          verified_by: null,
          verified_at: null,
        },
      }));

      setDrafts((current) => {
        const next = { ...current };
        delete next[code];
        return next;
      });

      setMessage(`${code}: verificación registrada.`);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Error al guardar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-6 border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-black/50">
            WT Store Qualification V1
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            Requisitos institucionales
          </h3>
          <p className="mt-1 text-sm text-black/60">
            Doce Gates · Verificación documental y operativa
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-semibold">{verified} / 12</p>
          <p className="text-xs text-black/60">
            Requisitos verificados
          </p>
          {failed > 0 && (
            <p className="mt-1 text-xs font-semibold text-red-700">
              {failed} no cumplen
            </p>
          )}
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-black/60">
          Recuperando requisitos...
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_EVALUATION_GATES.map((gate) => {
              const active = selectedCode === gate.code;
              const status = records[gate.code]?.status ?? "PENDING";

              return (
                <button
                  key={gate.code}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setSelectedCode(gate.code);
                    setError("");
                    setMessage("");
                  }}
                  className={`border p-3 text-left ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black"
                  }`}
                >
                  <span className="text-xs opacity-60">{gate.code}</span>
                  <span className="mt-1 block text-sm font-semibold">
                    {gate.name}
                  </span>
                  <span className="mt-1 block text-xs opacity-70">
                    {STORE_GATE_STATUSES.find(
                      (item) => item.value === status
                    )?.label}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-black/10 pt-5">
            <h4 className="text-lg font-semibold">
              {selectedGate.code} · {selectedGate.name}
            </h4>
            <p className="mt-2 text-sm text-black/60">
              {selectedGate.description}
            </p>

            <label className="mt-5 block text-sm font-medium">
              Estado del requisito
            </label>
            <select
              value={draft.status}
              disabled={saving}
              onChange={(event) =>
                updateDraft({
                  status: event.target.value as StoreEvaluationGateStatus,
                })
              }
              className="mt-2 w-full border border-black/20 bg-white p-3"
            >
              {STORE_GATE_STATUSES.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.label}
                </option>
              ))}
            </select>

            <label className="mt-5 block text-sm font-medium">
              Justificación
            </label>
            <textarea
              rows={3}
              maxLength={2000}
              value={draft.justification}
              disabled={saving}
              onChange={(event) =>
                updateDraft({ justification: event.target.value })
              }
              placeholder="Documente el resultado de la verificación."
              className="mt-2 w-full border border-black/20 p-3"
            />

            <label className="mt-5 block text-sm font-medium">
              Referencia de evidencia
            </label>
            <input
              maxLength={2000}
              value={draft.evidence}
              disabled={saving}
              onChange={(event) =>
                updateDraft({ evidence: event.target.value })
              }
              placeholder="Documento, acta o referencia"
              className="mt-2 w-full border border-black/20 p-3"
            />

            <button
              type="button"
              disabled={
                saving ||
                (draft.status !== "PENDING" &&
                  !draft.justification.trim())
              }
              onClick={() => void save()}
              className="mt-5 bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
            >
              {saving ? "Guardando..." : "Guardar verificación"}
            </button>

            {message && (
              <p role="status" className="mt-4 text-sm text-green-700">
                {message}
              </p>
            )}
          </div>
        </>
      )}

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-700">
          {error}
        </p>
      )}

      <p className="mt-5 text-xs text-black/50">
        La verificación de requisitos no habilita automáticamente
        inventario, ventas, liquidaciones ni pagos.
      </p>
    </section>
  );
}
