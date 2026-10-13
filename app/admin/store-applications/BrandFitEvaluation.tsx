"use client";

import { useEffect, useState } from "react";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
import {
  STORE_EVALUATION_DIMENSIONS,
  type StoreEvaluationDimensionCode,
} from "./evaluationDimensions";

type SavedScore = {
  dimension_code: StoreEvaluationDimensionCode;
  score: number;
  justification: string;
  evidence_reference: string | null;
  evaluated_at: string;
};

type Draft = {
  score: number;
  justification: string;
  evidence: string;
};

const initialDraft: Draft = {
  score: 3,
  justification: "",
  evidence: "",
};

export default function BrandFitEvaluation({
  evaluationId,
}: {
  evaluationId: string;
}) {
  const [selectedCode, setSelectedCode] =
    useState<StoreEvaluationDimensionCode>("BRAND_FIT");

  const [savedScores, setSavedScores] =
    useState<Record<string, SavedScore>>({});

  const [drafts, setDrafts] =
    useState<Record<string, Draft>>({});

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const dimension = STORE_EVALUATION_DIMENSIONS.find(
    (item) => item.code === selectedCode
  )!;

  const saved = savedScores[selectedCode];

  const draft = drafts[selectedCode] ?? {
    score: saved?.score ?? initialDraft.score,
    justification: saved?.justification ?? "",
    evidence: saved?.evidence_reference ?? "",
  };

  const completed = STORE_EVALUATION_DIMENSIONS.filter(
    (item) => Boolean(savedScores[item.code])
  ).length;

  const weightedTotal = STORE_EVALUATION_DIMENSIONS.reduce(
    (total, item) => {
      const score = savedScores[item.code]?.score;
      return total + (score ? (score / 5) * item.weight : 0);
    },
    0
  );

  useEffect(() => {
    let cancelled = false;

    async function loadScores() {
      setLoading(true);
      setError("");
      setMessage("");
      setSavedScores({});
      setDrafts({});

      try {
        const supabase = getSupabaseBrowser();
        const { data } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (!token) {
          throw new Error("La sesión ha expirado.");
        }

        const response = await fetch(
          `/api/admin/store-applications/evaluation-scores?evaluationId=${encodeURIComponent(evaluationId)}`,
          {
            headers: { Authorization: `Bearer ${token}` },
            cache: "no-store",
          }
        );

        const result = await response.json();

        if (!response.ok) {
          throw new Error(
            result.error || "No fue posible recuperar las calificaciones."
          );
        }

        if (cancelled) return;

        const restored: Record<string, SavedScore> = {};

        for (const item of result.scores as SavedScore[]) {
          if (
            STORE_EVALUATION_DIMENSIONS.some(
              (dimension) => dimension.code === item.dimension_code
            )
          ) {
            restored[item.dimension_code] = item;
          }
        }

        setSavedScores(restored);
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Error al recuperar la evaluación."
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    void loadScores();

    return () => {
      cancelled = true;
    };
  }, [evaluationId]);

  function updateDraft(patch: Partial<Draft>) {
    setDrafts((current) => ({
      ...current,
      [selectedCode]: {
        ...draft,
        ...patch,
      },
    }));

    setMessage("");
    setError("");
  }

  async function saveScore() {
    if (saving || loading || !draft.justification.trim()) return;

    setSaving(true);
    setMessage("");
    setError("");

    try {
      const supabase = getSupabaseBrowser();
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;

      if (!token) {
        throw new Error("La sesión ha expirado.");
      }

      const response = await fetch(
        "/api/admin/store-applications/save-score",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            evaluationId,
            dimensionCode: selectedCode,
            score: draft.score,
            justification: draft.justification.trim(),
            evidenceReference: draft.evidence.trim() || null,
          }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.error || "No fue posible guardar la calificación."
        );
      }

      const stored: SavedScore = {
        dimension_code: selectedCode,
        score: draft.score,
        justification: draft.justification.trim(),
        evidence_reference: draft.evidence.trim() || null,
        evaluated_at: new Date().toISOString(),
      };

      setSavedScores((current) => ({
        ...current,
        [selectedCode]: stored,
      }));

      setDrafts((current) => {
        const next = { ...current };
        delete next[selectedCode];
        return next;
      });

      setMessage(`${dimension.name}: calificación guardada.`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Error inesperado al guardar."
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="mt-5 border border-black/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-black/50">
            WT Store Qualification V1
          </p>
          <h3 className="mt-2 text-xl font-semibold">
            Evaluación institucional
          </h3>
          <p className="mt-1 text-sm text-black/60">
            Nueve dimensiones · Calificación de 1 a 5
          </p>
        </div>

        <div className="text-right">
          <p className="text-2xl font-semibold">
            {weightedTotal.toFixed(1)} / 100
          </p>
          <p className="text-xs text-black/60">
            {completed} de 9 dimensiones registradas
          </p>
        </div>
      </div>

      {loading ? (
        <p className="mt-5 text-sm text-black/60">
          Recuperando calificaciones...
        </p>
      ) : (
        <>
          <div className="mt-6 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {STORE_EVALUATION_DIMENSIONS.map((item, index) => {
              const isSelected = selectedCode === item.code;
              const isSaved = Boolean(savedScores[item.code]);

              return (
                <button
                  key={item.code}
                  type="button"
                  disabled={saving}
                  onClick={() => {
                    setSelectedCode(item.code);
                    setMessage("");
                    setError("");
                  }}
                  className={`border p-3 text-left transition ${
                    isSelected
                      ? "border-black bg-black text-white"
                      : "border-black/10 bg-white text-black hover:border-black/40"
                  }`}
                >
                  <span className="block text-xs opacity-60">
                    {String(index + 1).padStart(2, "0")} / 09
                  </span>
                  <span className="mt-1 block text-sm font-semibold">
                    {item.name}
                  </span>
                  <span className="mt-1 block text-xs opacity-70">
                    Peso {item.weight}% ·{" "}
                    {isSaved ? "Registrada" : "Pendiente"}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mt-6 border-t border-black/10 pt-5">
            <div className="flex items-center justify-between gap-3">
              <h4 className="text-lg font-semibold">
                {dimension.name}
              </h4>
              <span className="text-sm font-semibold">
                Peso {dimension.weight}%
              </span>
            </div>

            <p className="mt-2 text-sm text-black/60">
              {dimension.description}
            </p>

            <label className="mt-5 block text-sm font-medium">
              Calificación (1–5)
            </label>

            <select
              value={draft.score}
              disabled={saving}
              onChange={(event) =>
                updateDraft({ score: Number(event.target.value) })
              }
              className="mt-2 w-full border border-black/20 bg-white p-3"
            >
              {[1, 2, 3, 4, 5].map((value) => (
                <option key={value} value={value}>
                  {value} / 5
                </option>
              ))}
            </select>

            <label className="mt-5 block text-sm font-medium">
              Justificación obligatoria
            </label>

            <textarea
              rows={3}
              maxLength={2000}
              value={draft.justification}
              disabled={saving}
              onChange={(event) =>
                updateDraft({ justification: event.target.value })
              }
              placeholder="Explique la calificación asignada."
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
              placeholder="Documento, fotografía, acta o referencia"
              className="mt-2 w-full border border-black/20 p-3"
            />

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-lg font-semibold">
                  {((draft.score / 5) * dimension.weight).toFixed(1)}
                  {" / "}
                  {dimension.weight} puntos
                </p>
                <p className="text-xs text-black/50">
                  Vista previa; no se registra hasta guardar.
                </p>
              </div>

              <button
                type="button"
                disabled={
                  saving ||
                  !draft.justification.trim() ||
                  Boolean(error && !saved)
                }
                onClick={() => void saveScore()}
                className="bg-black px-5 py-3 text-sm font-semibold text-white disabled:opacity-40"
              >
                {saving ? "Guardando..." : "Guardar calificación"}
              </button>
            </div>

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
    </section>
  );
}
