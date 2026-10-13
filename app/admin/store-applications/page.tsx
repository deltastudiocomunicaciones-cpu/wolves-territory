"use client";
import BrandFitEvaluation from "./BrandFitEvaluation";
import StoreEvaluationGates from "./StoreEvaluationGates";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Application = {
  id: string;
  legal_name: string;
  trade_name: string;
  document_type: string;
  document_number: string;
  representative_name: string;
  representative_document_type: string;
  representative_document_number: string;
  email: string;
  phone: string;
  city: string;
  department: string | null;
  business_address: string;
  branch_count: number;
  operating_cities: string | null;
  business_description: string | null;
  status: string;
  created_at: string;
  reviewed_at: string | null;
  review_notes: string | null;
  commercial_store_id: string | null;
};

const statusLabels: Record<string, string> = {
  APPLIED: "RECIBIDA",
  UNDER_REVIEW: "EN EVALUACIÓN",
  APPROVED: "APROBADA",
  REJECTED: "RECHAZADA",
};

function formatDate(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Fecha no disponible"
    : new Intl.DateTimeFormat("es-CO", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }).format(date);
}

export default function StoreApplicationsPage() {
  const router = useRouter();
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState("");
  const [decisionNotes, setDecisionNotes] = useState("");
  const [decidingId, setDecidingId] = useState<string | null>(null);
  const [openingEvaluationId, setOpeningEvaluationId] = useState<string | null>(null);
  const [evaluationIds, setEvaluationIds] = useState<Record<string, string>>({});



  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          router.replace("/admin/login");
          return;
        }

        const { data: profile, error: profileError } = await supabase
          .from("admin_users")
          .select("role, active")
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();

        if (
          profileError ||
          !profile?.active ||
          profile.role !== "SUPER_ADMIN"
        ) {
          router.replace("/admin");
          return;
        }

        const { data: sessionData } = await supabase.auth.getSession();
        const token = sessionData.session?.access_token;

        if (!token) {
          throw new Error("No se encontró una sesión válida.");
        }

        const response = await fetch("/api/admin/store-applications", {
          headers: { Authorization: `Bearer ${token}` },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(
            response.status === 403
              ? "No tienes permiso para consultar las solicitudes."
              : "No fue posible cargar las solicitudes comerciales."
          );
        }

        const payload = await response.json();

        if (!cancelled) {
          setApplications(
            Array.isArray(payload.applications)
              ? payload.applications
              : []
          );
        }
      } catch (cause) {
        if (!cancelled) {
          setError(
            cause instanceof Error
              ? cause.message
              : "Ocurrió un error inesperado."
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
  }, [router]);

  async function startReview(applicationId: string) {
    if (reviewingId) return;

    setReviewError("");
    setReviewingId(applicationId);

    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Tu sesión ha expirado. Ingresa nuevamente.");
      }

      const response = await fetch(
        "/api/admin/store-applications/start-review",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ applicationId }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("No tienes permiso para iniciar esta evaluación.");
        }
        if (response.status === 404) {
          throw new Error("La solicitud ya no existe.");
        }
        if (response.status === 409) {
          throw new Error(
            "La solicitud cambió de estado. Actualiza el expediente."
          );
        }
        throw new Error("No fue posible iniciar la evaluación.");
      }

      const refresh = await fetch("/api/admin/store-applications", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });

      if (!refresh.ok) {
        throw new Error(
          "La evaluación se inició, pero no fue posible actualizar la bandeja. Recarga la página."
        );
      }

      const payload = await refresh.json();

      if (!Array.isArray(payload.applications)) {
        throw new Error(
          "La evaluación se inició, pero la respuesta de actualización no es válida."
        );
      }

      setApplications(payload.applications);
    } catch (cause) {
      setReviewError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setReviewingId(null);
    }
  }
  async function decideApplication(
    applicationId: string,
    decision: "APPROVED" | "REJECTED"
  ) {
    if (reviewingId || decidingId) return;

    const notes = decisionNotes.trim();

    if (decision === "REJECTED" && !notes) {
      setReviewError("Debes indicar el motivo del rechazo.");
      return;
    }

    if (notes.length > 2000) {
      setReviewError("Las observaciones no pueden superar 2000 caracteres.");
      return;
    }

    const action = decision === "APPROVED" ? "aprobar" : "rechazar";

    if (
      !window.confirm(
        `¿Confirmas que deseas ${action} esta solicitud comercial?`
      )
    ) {
      return;
    }

    setReviewError("");
    setDecidingId(applicationId);

    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Tu sesión ha expirado. Ingresa nuevamente.");
      }

      const response = await fetch(
        "/api/admin/store-applications/decide",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            applicationId,
            decision,
            notes: notes || null,
          }),
          cache: "no-store",
        }
      );

      if (!response.ok) {
        if (response.status === 403) {
          throw new Error("No tienes permiso para tomar esta decisión.");
        }
        if (response.status === 404) {
          throw new Error("La solicitud ya no existe.");
        }
        if (response.status === 409) {
          throw new Error(
            "El expediente cambió de estado. Actualiza la página."
          );
        }
        if (response.status === 400) {
          throw new Error("Revisa la decisión y las observaciones.");
        }
        throw new Error("No fue posible registrar la decisión.");
      }

      setApplications((current) =>
        current.map((item) =>
          item.id === applicationId
            ? {
                ...item,
                status: decision,
                review_notes: notes || null,
                reviewed_at: new Date().toISOString(),
              }
            : item
        )
      );

      setDecisionNotes("");
    } catch (cause) {
      setReviewError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setDecidingId(null);
    }
  }
  async function openEvaluation(applicationId: string) {
    if (openingEvaluationId) return;

    setReviewError("");
    setOpeningEvaluationId(applicationId);

    try {
      const supabase = getSupabaseBrowser();
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;

      if (!token) {
        throw new Error("Tu sesión ha expirado. Ingresa nuevamente.");
      }

      const response = await fetch(
        "/api/admin/store-applications/open-evaluation",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ applicationId }),
          cache: "no-store",
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          typeof payload.error === "string"
            ? payload.error
            : "No fue posible abrir la evaluación."
        );
      }

      if (typeof payload.evaluationId !== "string") {
        throw new Error("El servidor no devolvió un expediente válido.");
      }

      setEvaluationIds((current) => ({
        ...current,
        [applicationId]: payload.evaluationId,
      }));
    } catch (cause) {
      setReviewError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setOpeningEvaluationId(null);
    }
  }
  const filtered = useMemo(
    () =>
      filter === "ALL"
        ? applications
        : applications.filter((item) => item.status === filter),
    [applications, filter]
  );

  const selected = applications.find((item) => item.id === selectedId);

  const pending = applications.filter(
    (item) => item.status === "APPLIED"
  ).length;

  const inReview = applications.filter(
    (item) => item.status === "UNDER_REVIEW"
  ).length;

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#171717]">
      <div className="mx-auto max-w-[1500px] px-5 py-8 sm:px-10 sm:py-12">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-[11px] font-semibold uppercase tracking-[0.16em] text-black/50 hover:text-black"
        >
          ← Territory Control
        </button>

        <div className="mt-12 flex flex-wrap items-end justify-between gap-6 border-b border-black/15 pb-9">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-black/40">
              Wolves Territory / Retail Network
            </p>
            <h1 className="mt-5 text-4xl font-semibold uppercase tracking-[-0.065em] sm:text-6xl">
              Store.
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-7 text-black/55">
              Centro de vinculación comercial. Solicitudes recibidas,
              evaluación documental y seguimiento de tiendas aliadas.
            </p>
          </div>
          <span className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em]">
            Bandeja administrativa
          </span>
        </div>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { label: "Solicitudes totales", value: applications.length },
            { label: "Por revisar", value: pending },
            { label: "En evaluación", value: inReview },
          ].map((metric) => (
            <div
              key={metric.label}
              className="border border-black/10 bg-white p-6"
            >
              <p className="text-[10px] uppercase tracking-[0.17em] text-black/45">
                {metric.label}
              </p>
              <p className="mt-7 text-4xl font-semibold tracking-[-0.07em] tabular-nums">
                {loading ? "—" : metric.value}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-wrap gap-2">
          {[
            ["ALL", "Todas"],
            ["APPLIED", "Recibidas"],
            ["UNDER_REVIEW", "En evaluación"],
            ["APPROVED", "Aprobadas"],
            ["REJECTED", "Rechazadas"],
          ].map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={
                "rounded-full border px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] transition " +
                (filter === value
                  ? "border-[#171717] bg-[#171717] text-white"
                  : "border-black/15 text-black/55 hover:border-black")
              }
            >
              {label}
            </button>
          ))}
        </div>

        {error && (
          <div role="alert" className="mt-6 border border-red-300 bg-red-50 p-5 text-sm text-red-800">
            {error}
          </div>
        )}

        <section className="mt-6 overflow-hidden border border-black/10 bg-white">
          <div className="flex items-center justify-between border-b border-black/10 px-6 py-5">
            <h2 className="text-xs font-bold uppercase tracking-[0.17em]">
              Expedientes comerciales
            </h2>
            <span className="text-[11px] text-black/40">
              {loading ? "Cargando..." : `${filtered.length} registros`}
            </span>
          </div>

          {loading ? (
            <p className="p-10 text-sm text-black/50">
              Consultando solicitudes...
            </p>
          ) : !error && filtered.length === 0 ? (
            <div className="px-6 py-20 text-center">
              <p className="text-xl font-semibold tracking-[-0.04em]">
                Sin solicitudes en esta categoría.
              </p>
              <p className="mt-3 text-sm text-black/45">
                Los registros aparecerán cuando se reciban postulaciones reales.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {filtered.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className="flex w-full flex-wrap items-center justify-between gap-5 px-6 py-6 text-left transition hover:bg-[#f7f5f0]"
                >
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.15em] text-black/40">
                      {item.city}{item.department ? ` / ${item.department}` : ""}
                    </p>
                    <h3 className="mt-2 text-lg font-semibold tracking-[-0.035em]">
                      {item.trade_name}
                    </h3>
                    <p className="mt-1 text-xs text-black/45">
                      {item.legal_name}
                    </p>
                  </div>
                  <div className="flex items-center gap-5">
                    <div className="text-right">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                        {statusLabels[item.status] ?? item.status}
                      </p>
                      <p className="mt-2 text-[11px] text-black/40">
                        {item.branch_count} sede(s) · {formatDate(item.created_at)}
                      </p>
                    </div>
                    <span aria-hidden="true" className="text-xl">↗</span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/60">
          <button
            type="button"
            aria-label="Cerrar expediente"
            onClick={() => setSelectedId(null)}
            className="absolute inset-0 cursor-default"
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-label="Expediente comercial"
            className="relative z-10 h-full w-full max-w-6xl overflow-y-auto bg-[#f5f3ef] p-5 shadow-2xl sm:p-8 lg:p-10"
          >
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="text-xs font-semibold uppercase tracking-[0.16em] text-black/50"
            >
              ← Cerrar expediente
            </button>

            <p className="mt-12 text-[10px] uppercase tracking-[0.2em] text-black/40">
              Expediente de afiliación
            </p>
            <h2 className="mt-4 text-3xl font-semibold tracking-[-0.06em]">
              {selected.trade_name}
            </h2>
            <p className="mt-3 text-xs font-semibold uppercase tracking-[0.13em]">
              {statusLabels[selected.status] ?? selected.status}
            </p>

            <div className="mt-10 space-y-6">
              {[
                ["Razón social", selected.legal_name],
                ["Documento", `${selected.document_type} ${selected.document_number}`],
                ["Representante", selected.representative_name],
                [
                  "Identificación representante",
                  `${selected.representative_document_type} ${selected.representative_document_number}`,
                ],
                ["Correo", selected.email],
                ["Teléfono", selected.phone],
                ["Ciudad", selected.city],
                ["Departamento", selected.department],
                ["Dirección comercial", selected.business_address],
                ["Sucursales declaradas", String(selected.branch_count)],
                ["Ciudades de operación", selected.operating_cities],
                ["Descripción", selected.business_description],
                ["Fecha de solicitud", formatDate(selected.created_at)],
                ["Observaciones de revisión", selected.review_notes],
              ].map(([label, value]) => (
                <div key={label} className="border-b border-black/10 pb-5">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-black/40">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm leading-6">
                    {value || "No informado"}
                  </p>
                </div>
              ))}
            </div>

            <div className="mt-10 border-t border-black/15 pt-6">
              {selected.status === "APPLIED" && (
                <div className="border border-black/15 bg-white p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                    Gestión administrativa
                  </p>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                    Iniciar evaluación
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-black/55">
                    La solicitud pasará a evaluación y la decisión quedará
                    registrada con la identidad del administrador responsable.
                  </p>
                  <button
                    type="button"
                    disabled={reviewingId !== null}
                    onClick={() => void startReview(selected.id)}
                    className="mt-6 w-full bg-[#171717] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {reviewingId === selected.id
                      ? "Iniciando evaluación..."
                      : "Iniciar evaluación →"}
                  </button>
                </div>
              )}

              {selected.status === "UNDER_REVIEW" && (
                <div className="border border-black/15 bg-white p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                    Decisión administrativa
                  </p>
                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                    Resolver solicitud
                  </h3>
                  <p className="mt-3 text-sm leading-6 text-black/55">
                    Evalúa la información comercial y registra tu decisión.
                    La aprobación no habilita automáticamente operaciones,
                    inventario ni pagos.
                  </p>
                  <label
                    htmlFor="store-decision-notes"
                    className="mt-6 block text-[10px] font-semibold uppercase tracking-[0.14em] text-black/50"
                  >
                    Observaciones / motivo de rechazo
                  </label>
                  <textarea
                    id="store-decision-notes"
                    value={decisionNotes}
                    onChange={(event) => setDecisionNotes(event.target.value)}
                    maxLength={2000}
                    rows={4}
                    disabled={decidingId !== null}
                    placeholder="Escribe las observaciones de la evaluación..."
                    className="mt-3 w-full resize-y border border-black/20 bg-[#f5f3ef] p-4 text-sm outline-none focus:border-black disabled:opacity-50"
                  />
                  <p className="mt-2 text-xs text-black/45">
                    Obligatorio para rechazar. Máximo 2000 caracteres.
                  </p>
                  <div className="mt-6 grid gap-3 sm:grid-cols-2">
                    <button
                      type="button"
                      disabled={decidingId !== null}
                      onClick={() =>
                        void decideApplication(selected.id, "APPROVED")
                      }
                      className="bg-[#171717] px-4 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-white transition hover:bg-black/80 disabled:opacity-50"
                    >
                      {decidingId === selected.id
                        ? "Procesando..."
                        : "Aprobar solicitud"}
                    </button>
                    <button
                      type="button"
                      disabled={decidingId !== null}
                      onClick={() =>
                        void decideApplication(selected.id, "REJECTED")
                      }
                      className="border border-red-800 px-4 py-4 text-xs font-semibold uppercase tracking-[0.1em] text-red-800 transition hover:bg-red-50 disabled:opacity-50"
                    >
                      Rechazar solicitud
                    </button>
                  </div>
                </div>
              )}
              {(selected.status === "UNDER_REVIEW" ||
                selected.status === "APPROVED") && (
                <div className="mt-6 border border-black/15 bg-white p-6">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-black/45">
                    WT Store Qualification V1
                  </p>

                  <h3 className="mt-4 text-xl font-semibold tracking-[-0.04em]">
                    Calificación institucional
                  </h3>

                  <p className="mt-3 text-sm leading-6 text-black/55">
                    Expediente de nueve dimensiones y doce requisitos
                    obligatorios. Su apertura no habilita operaciones,
                    inventario ni pagos.
                  </p>

                  {evaluationIds[selected.id] && (
  <>
    <BrandFitEvaluation
      key={`scores-${evaluationIds[selected.id]}`}
      evaluationId={evaluationIds[selected.id]}
    />

    <StoreEvaluationGates
      key={`gates-${evaluationIds[selected.id]}`}
      evaluationId={evaluationIds[selected.id]}
    />
  </>
)}
                  {evaluationIds[selected.id] ? (
                    <div className="mt-6 border border-black/10 bg-[#f5f3ef] p-4">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.12em]">
                        Expediente abierto
                      </p>
                      <p className="mt-2 break-all font-mono text-xs text-black/60">
                        {evaluationIds[selected.id]}
                      </p>
                      <p className="mt-3 text-xs text-black/50">
                        WT-SQ-V1 · Pendiente de calificación
                      </p>
                    </div>
                  ) : (
                    <button
                      type="button"
                      disabled={openingEvaluationId !== null}
                      onClick={() => void openEvaluation(selected.id)}
                      className="mt-6 w-full bg-[#171717] px-5 py-4 text-xs font-semibold uppercase tracking-[0.14em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {openingEvaluationId === selected.id
                        ? "Abriendo expediente..."
                        : "Abrir evaluación →"}
                    </button>
                  )}
                </div>
              )}
              {reviewError && (
                <p role="alert" className="mt-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">
                  {reviewError}
                </p>
              )}

              <p className="mt-6 text-xs leading-6 text-black/50">
                Una solicitud aprobada queda pendiente de formalización
                contractual y habilitación comercial independiente.
              </p>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
}







