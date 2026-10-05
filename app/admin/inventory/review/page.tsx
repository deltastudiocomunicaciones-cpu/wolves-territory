"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AdjustmentQueueItem = {
  count_id: string;
  reference: string;
  count_type: string;
  notes: string | null;
  created_by: string;
  submitted_by: string | null;
  submitted_at: string | null;
  correlation_id: string;
  item_count: number;
  variance_item_count: number;
  absolute_variance_units: number;
};

type CountItem = {
  inventory_id: string;
  sku: string;
  system_stock: number;
  system_reserved: number;
  physical_stock: number | null;
  variance: number | null;
  observation: string | null;
};

export default function InventoryReviewPage() {
  const router = useRouter();

  const [queue, setQueue] = useState<AdjustmentQueueItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(
    null
  );

  const [expandedCountId, setExpandedCountId] =
  useState<string | null>(null);

const [countItems, setCountItems] = useState<
  Record<string, CountItem[]>
>({});

const [loadingCountId, setLoadingCountId] =
  useState<string | null>(null);

const [detailError, setDetailError] =
  useState<string | null>(null);

const [reviewingCountId, setReviewingCountId] =
  useState<string | null>(null);

const [reviewReason, setReviewReason] =
  useState<Record<string, string>>({});

const [reviewError, setReviewError] =
  useState<string | null>(null);

  const loadQueue = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const supabase = getSupabaseBrowser();

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/admin/login");
        return;
      }

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      const accessToken = sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(
        "/api/admin/inventory/counts/review",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        if (
          response.status === 401 ||
          response.status === 403
        ) {
          router.replace("/admin");
          return;
        }

        throw new Error(
          result.detail ||
            result.error ||
            "ADJUSTMENT_QUEUE_FAILED"
        );
      }

      setQueue(
        (result.queue ?? []) as AdjustmentQueueItem[]
      );
    } catch (error) {
      console.error(
        "INVENTORY REVIEW PAGE ERROR:",
        error
      );

      setErrorMessage(
        "No fue posible cargar los conteos pendientes de revisión."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  const toggleCountDetail = async (countId: string) => {
  if (expandedCountId === countId) {
    setExpandedCountId(null);
    setDetailError(null);
    return;
  }

  setExpandedCountId(countId);
  setDetailError(null);

  if (countItems[countId]) {
    return;
  }

  try {
    setLoadingCountId(countId);


    const supabase = getSupabaseBrowser();

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch(
      `/api/admin/inventory/counts/items?countId=${encodeURIComponent(
        countId
      )}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
        cache: "no-store",
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail ||
          result.error ||
          "COUNT_ITEMS_READ_FAILED"
      );
    }

    setCountItems((current) => ({
      ...current,
      [countId]: (result.items ?? []) as CountItem[],
    }));
  } catch (error) {
    console.error(
      "INVENTORY COUNT DETAIL ERROR:",
      error
    );

    setDetailError(
      "No fue posible cargar la evidencia de este conteo."
    );
  } finally {
    setLoadingCountId(null);
  }
};

const reviewCount = async (
  countId: string,
  decision: "APPROVE" | "REJECT"
) => {
  if (reviewingCountId) return;

  const reason =
    reviewReason[countId]?.trim() || null;

  if (decision === "REJECT" && !reason) {
    setReviewError(
      "Debes registrar el motivo para rechazar el ajuste."
    );
    return;
  }

  try {
    setReviewingCountId(countId);
    setReviewError(null);

    const supabase = getSupabaseBrowser();

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch(
      "/api/admin/inventory/counts/review",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          countId,
          decision,
          reason,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail ||
          result.error ||
          "ADJUSTMENT_REVIEW_FAILED"
      );
    }

    setExpandedCountId(null);

    setCountItems((current) => {
      const next = { ...current };
      delete next[countId];
      return next;
    });

    setReviewReason((current) => {
      const next = { ...current };
      delete next[countId];
      return next;
    });

    await loadQueue();
  } catch (error) {
    console.error(
      "INVENTORY ADJUSTMENT REVIEW ERROR:",
      error
    );

    setReviewError(
      error instanceof Error
        ? error.message
        : "No fue posible procesar la decisión."
    );
  } finally {
    setReviewingCountId(null);
  }
};



  useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const pendingCount = queue.length;

  const varianceReferenceCount = queue.reduce(
    (total, item) =>
      total + Number(item.variance_item_count),
    0
  );

  const varianceUnitCount = queue.reduce(
    (total, item) =>
      total + Number(item.absolute_variance_units),
    0
  );

  return (
    <main className="min-h-screen bg-[#f2f0eb] px-6 py-10 text-black md:px-12">
      <div className="mx-auto max-w-7xl">
        <button
          type="button"
          onClick={() => router.push("/admin")}
          className="text-xs uppercase tracking-[0.2em] text-black/40 transition hover:text-black"
        >
          ← Territory Control
        </button>

        <div className="mt-12 border-b border-black/10 pb-8">
          <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
            Inventory Governance
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Revisión de inventario
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">
            Conteos físicos enviados que requieren una decisión
            autorizada antes de modificar el inventario maestro.
          </p>
        </div>

        <div className="mt-8 grid gap-px overflow-hidden border border-black/10 bg-black/10 md:grid-cols-3">
          <Metric
            label="Pendientes"
            value={pendingCount}
          />

          <Metric
            label="Referencias con diferencia"
            value={varianceReferenceCount}
          />

          <Metric
            label="Unidades por conciliar"
            value={varianceUnitCount}
          />
        </div>

        {loading && (
          <p className="mt-10 text-sm text-black/40">
            Cargando revisiones pendientes...
          </p>
        )}

        {errorMessage && (
          <div className="mt-10 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        {!loading &&
          !errorMessage &&
          queue.length === 0 && (
            <div className="mt-10 border border-black/10 bg-white/40 p-8">
              <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
                Sin pendientes
              </p>

              <p className="mt-4 text-sm text-black/50">
                No existen conteos enviados esperando
                revisión.
              </p>
            </div>
          )}

        {!loading &&
          !errorMessage &&
          queue.length > 0 && (
            <div className="mt-10 space-y-4">
              {queue.map((item) => (
                <article
                  key={item.count_id}
                  className="border border-black/10 bg-white p-6 md:p-8"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
                        Conteo enviado
                      </p>

                      <h2 className="mt-3 break-all text-sm font-semibold tracking-tight">
                        {item.reference}
                      </h2>

                      <p className="mt-2 text-[10px] uppercase tracking-[0.16em] text-black/35">
                        {item.count_type}
                      </p>
                    </div>

                    <span className="w-fit border border-black/10 px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em]">
                      Pendiente
                    </span>
                  </div>

                  <div className="mt-8 grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-3">
                    <Metric
                      label="Referencias contadas"
                      value={Number(item.item_count)}
                    />

                    <Metric
                      label="Con diferencia"
                      value={Number(
                        item.variance_item_count
                      )}
                    />

                    <Metric
                      label="Unidades diferencia"
                      value={Number(
                        item.absolute_variance_units
                      )}
                    />
                  </div>

                  {item.notes && (
                    <div className="mt-6 border-t border-black/10 pt-5">
                      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                        Notas
                      </p>

                      <p className="mt-2 text-xs leading-6 text-black/50">
                        {item.notes}
                      </p>
                    </div>
                  )}

                  <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-[9px] uppercase tracking-[0.16em] text-black/35">
                      {item.submitted_at
                        ? new Date(
                            item.submitted_at
                          ).toLocaleString("es-CO")
                        : "Fecha no disponible"}
                    </p>

                    <button
  type="button"
  onClick={() => void toggleCountDetail(item.count_id)}
  className="text-[9px] font-semibold uppercase tracking-[0.18em] transition hover:opacity-50"
>
  {expandedCountId === item.count_id
    ? "Cerrar expediente ↑"
    : "Requiere revisión →"}
</button>
                  </div>

{expandedCountId === item.count_id && (
  <div className="mt-8 border-t border-black/10 pt-8">
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
          Expediente de conciliación
        </p>

        <h3 className="mt-2 text-lg font-semibold tracking-tight">
          Evidencia del conteo físico
        </h3>
      </div>

      <p className="text-[9px] uppercase tracking-[0.18em] text-black/35">
        Solo lectura
      </p>
    </div>

    {loadingCountId === item.count_id && (
      <p className="mt-6 text-sm text-black/40">
        Cargando evidencia...
      </p>
    )}

    {expandedCountId === item.count_id &&
      detailError &&
      loadingCountId !== item.count_id && (
        <div className="mt-6 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {detailError}
        </div>
      )}

    {loadingCountId !== item.count_id &&
      !detailError &&
      countItems[item.count_id]?.length === 0 && (
        <div className="mt-6 border border-black/10 bg-[#f2f0eb] p-5 text-sm text-black/50">
          Este conteo no contiene evidencia registrada.
        </div>
      )}

    {loadingCountId !== item.count_id &&
      !detailError &&
      countItems[item.count_id]?.map((countItem) => (
        <div
          key={countItem.inventory_id}
          className="mt-6 overflow-hidden border border-black/10"
        >
          <div className="flex flex-col gap-3 border-b border-black/10 bg-[#f2f0eb] p-5 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                SKU
              </p>

              <p className="mt-2 text-sm font-semibold">
                {countItem.sku}
              </p>
            </div>

            <span className="w-fit bg-black px-3 py-2 text-[9px] font-semibold uppercase tracking-[0.18em] text-white">
              {Number(countItem.variance) === 0
                ? "Sin diferencia"
                : "Discrepancia"}
            </span>
          </div>

          <div className="grid gap-px bg-black/10 sm:grid-cols-4">
            <div className="bg-white p-5">
              <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                Stock sistema
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {countItem.system_stock}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                Reservado
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {countItem.system_reserved}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                Conteo físico
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {countItem.physical_stock ?? "—"}
              </p>
            </div>

            <div className="bg-white p-5">
              <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                Diferencia
              </p>
              <p className="mt-3 text-2xl font-semibold">
                {countItem.variance == null
                  ? "—"
                  : countItem.variance > 0
                    ? `+${countItem.variance}`
                    : countItem.variance}
              </p>
            </div>
          </div>

          <div className="border-t border-black/10 bg-white p-5">
            <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
              Observación
            </p>

            <p className="mt-2 text-sm text-black/60">
              {countItem.observation?.trim() ||
                "Sin observación registrada."}
            </p>
          </div>

          <div className="border-t border-black/10 bg-[#f2f0eb] p-5">
            <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
              Efecto propuesto
            </p>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              <span className="text-2xl font-semibold">
                {countItem.system_stock}
              </span>

              <span className="text-black/30">→</span>

              <span className="text-2xl font-semibold">
                {countItem.physical_stock ?? "—"}
              </span>

              <span className="text-[9px] uppercase tracking-[0.18em] text-black/40">
                si el ajuste es aprobado
              </span>
            </div>
          </div>
        </div>
      ))}
      {loadingCountId !== item.count_id &&
  !detailError &&
  (countItems[item.count_id]?.length ?? 0) > 0 && (
    <div className="mt-8 border border-black/10 bg-white p-6 md:p-8">
      <div className="flex flex-col gap-2">
        <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
          Decisión autorizada
        </p>

        <h3 className="text-lg font-semibold tracking-tight">
          Revisión del ajuste de inventario
        </h3>

        <p className="max-w-2xl text-sm leading-6 text-black/50">
          La aprobación aplicará las diferencias verificadas al
          inventario maestro. El rechazo no modificará las
          existencias.
        </p>
      </div>

      <div className="mt-6">
        <label
          htmlFor={`review-reason-${item.count_id}`}
          className="text-[8px] uppercase tracking-[0.22em] text-black/35"
        >
          Motivo / soporte de la decisión
        </label>

        <textarea
          id={`review-reason-${item.count_id}`}
          value={reviewReason[item.count_id] ?? ""}
          onChange={(event) =>
            setReviewReason((current) => ({
              ...current,
              [item.count_id]: event.target.value,
            }))
          }
          disabled={reviewingCountId === item.count_id}
          placeholder="Registra el criterio de revisión..."
          rows={3}
          className="mt-3 w-full resize-none border border-black/10 bg-[#f7f5f0] p-4 text-sm outline-none disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {reviewError && (
        <div className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-800">
          {reviewError}
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
        <button
          type="button"
          onClick={() =>
            void reviewCount(item.count_id, "REJECT")
          }
          disabled={reviewingCountId !== null}
          className="border border-black px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] transition hover:bg-black hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
        >
          {reviewingCountId === item.count_id
            ? "Procesando..."
            : "Rechazar ajuste"}
        </button>

        <button
          type="button"
          onClick={() =>
            void reviewCount(item.count_id, "APPROVE")
          }
          disabled={reviewingCountId !== null}
          className="bg-black px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:opacity-75 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {reviewingCountId === item.count_id
            ? "Procesando..."
            : "Aprobar ajuste"}
        </button>
      </div>
    </div>
  )}
  </div>
)}

                </article>
              ))}
            </div>
          )}
      </div>
    </main>
  );
}

function Metric({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div className="bg-[#f2f0eb] p-5">
      <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
        {label}
      </p>

      <p className="mt-3 text-2xl font-semibold tracking-tight">
        {value}
      </p>
    </div>
  );
}