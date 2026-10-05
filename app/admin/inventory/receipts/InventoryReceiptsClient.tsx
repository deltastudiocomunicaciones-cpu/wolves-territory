"use client";

import { useCallback, useEffect, useState } from "react";
import {
  useRouter,
  useSearchParams,
} from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";
type InventoryCatalogItem = {
  inventory_id: string;
  product_id: string;
  product_name: string | null;
  variant_key: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  category: string | null;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  active: boolean;
};

type InventoryReceipt = {
  id: string;
  reference: string;
  status: string;
  receipt_type: string;
  source: string | null;
  notes: string | null;
  created_by: string;
  submitted_by: string | null;
  submitted_at: string | null;
  reviewed_by: string | null;
  reviewed_at: string | null;
  review_reason: string | null;
  applied_at: string | null;
  correlation_id: string;
  created_at: string;
  updated_at: string;
};

type InventoryReceiptItem = {
  inventory_id: string;
  sku: string;
  expected_quantity: number;
  received_quantity: number | null;
  observation: string | null;
};

export default function InventoryReceiptsClient() {
  const router = useRouter();
const searchParams = useSearchParams();
    const [showCreateForm, setShowCreateForm] =
    useState(false);

  const [reference, setReference] =
    useState("");

  const [source, setSource] =
    useState("");

  const [notes, setNotes] =
    useState("");

  const [creating, setCreating] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [createdReceiptId, setCreatedReceiptId] =
    useState<string | null>(null);

     const [catalog, setCatalog] =
    useState<InventoryCatalogItem[]>([]);

  const [catalogLoading, setCatalogLoading] =
    useState(false);

  const [catalogError, setCatalogError] =
    useState<string | null>(null); 

  const [selectedInventoryId, setSelectedInventoryId] =
  useState("");

const [expectedQuantity, setExpectedQuantity] =
  useState("");

const [receivedQuantity, setReceivedQuantity] =
  useState("");

const [itemObservation, setItemObservation] =
  useState("");

const [savingReceiptItem, setSavingReceiptItem] =
  useState(false);

const [receiptItemError, setReceiptItemError] =
  useState<string | null>(null);  

    const [activeReceipt, setActiveReceipt] =
    useState<InventoryReceipt | null>(null);

  const [receiptItems, setReceiptItems] =
    useState<InventoryReceiptItem[]>([]);

  const [receiptLoading, setReceiptLoading] =
    useState(false);

  const [receiptError, setReceiptError] =
    useState<string | null>(null);  

   const [submittingReceipt, setSubmittingReceipt] =
  useState(false);

const [submitReceiptError, setSubmitReceiptError] =
  useState<string | null>(null); 

const [reviewReason, setReviewReason] =
  useState("");

const [reviewingReceipt, setReviewingReceipt] =
  useState(false);

const [reviewReceiptError, setReviewReceiptError] =
  useState<string | null>(null);  

const [
  canApplyInventoryReceipt,
  setCanApplyInventoryReceipt,
] = useState(false);

const [
  capabilitiesLoading,
  setCapabilitiesLoading,
] = useState(true);

const [
  applyingReceipt,
  setApplyingReceipt,
] = useState(false);

const [
  applyReceiptError,
  setApplyReceiptError,
] = useState<string | null>(null);  

const loadCapabilities = useCallback(async () => {
  try {
    setCapabilitiesLoading(true);

    // Fail closed while capability is being resolved.
    setCanApplyInventoryReceipt(false);

    const supabase =
      getSupabaseBrowser();

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      return;
    }

    const response = await fetch(
      "/api/admin/capabilities",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok) {
      return;
    }

    const payload =
      await response.json();

    setCanApplyInventoryReceipt(
      payload?.capabilities
        ?.canApplyInventoryReceipt === true
    );
  } catch (error) {
    console.error(
      "ADMIN CAPABILITIES LOAD ERROR:",
      error
    );

    setCanApplyInventoryReceipt(false);
  } finally {
    setCapabilitiesLoading(false);
  }
}, []);


      const loadCatalog = useCallback(async () => {
    try {
      setCatalogLoading(true);
      setCatalogError(null);

      const supabase =
        getSupabaseBrowser();

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        setCatalogError(
          "La sesión administrativa no está disponible."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/inventory/catalog",
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.detail ||
            payload.error ||
            "No fue posible cargar el catálogo."
        );
      }

      setCatalog(
        Array.isArray(payload.inventory)
          ? payload.inventory
          : []
      );
    } catch (error) {
      setCatalogError(
        error instanceof Error
          ? error.message
          : "No fue posible cargar el catálogo."
      );
    } finally {
      setCatalogLoading(false);
    }
  }, []);

  useEffect(() => {
  void loadCapabilities();
}, [loadCapabilities]);

    const loadReceipt = useCallback(
    async (receiptId: string) => {
      try {
        setReceiptLoading(true);
        setReceiptError(null);

        const supabase =
          getSupabaseBrowser();

        const {
          data: sessionData,
          error: sessionError,
        } = await supabase.auth.getSession();

        const accessToken =
          sessionData.session?.access_token;

        if (sessionError || !accessToken) {
          setReceiptError(
            "La sesión administrativa no está disponible."
          );
          return;
        }

        const [receiptResponse, itemsResponse] =
          await Promise.all([
            fetch(
              `/api/admin/inventory/receipts?receiptId=${encodeURIComponent(
                receiptId
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            ),
            fetch(
              `/api/admin/inventory/receipts/items?receiptId=${encodeURIComponent(
                receiptId
              )}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                },
              }
            ),
          ]);

        const receiptPayload =
          await receiptResponse.json();

        const itemsPayload =
          await itemsResponse.json();

        if (!receiptResponse.ok) {
          throw new Error(
            receiptPayload.detail ||
              receiptPayload.error ||
              "No fue posible cargar la recepción."
          );
        }

        if (!itemsResponse.ok) {
          throw new Error(
            itemsPayload.detail ||
              itemsPayload.error ||
              "No fue posible cargar los ítems de la recepción."
          );
        }

        setActiveReceipt(
          receiptPayload.receipt ?? null
        );

        setReceiptItems(
          Array.isArray(itemsPayload.items)
            ? itemsPayload.items
            : []
        );
      } catch (error) {
        setActiveReceipt(null);
        setReceiptItems([]);

        setReceiptError(
          error instanceof Error
            ? error.message
            : "No fue posible reconstruir la recepción."
        );
      } finally {
        setReceiptLoading(false);
      }
    },
    []
  );

    useEffect(() => {
    const receiptId =
      searchParams.get("receiptId")?.trim();

    if (!receiptId) {
      setActiveReceipt(null);
      setReceiptItems([]);
      return;
    }

    setCreatedReceiptId(receiptId);
    void loadReceipt(receiptId);
  }, [searchParams, loadReceipt]);

    useEffect(() => {
    if (!createdReceiptId) {
      return;
    }

    void loadCatalog();
  }, [createdReceiptId, loadCatalog]);

     const handleCreateReceipt = async () => {
    try {
      setCreating(true);
      setErrorMessage(null);

      const normalizedReference =
        reference.trim();

      if (!normalizedReference) {
        setErrorMessage(
          "La referencia de la recepción es obligatoria."
        );
        return;
      }

      const supabase =
        getSupabaseBrowser();

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        setErrorMessage(
          "La sesión administrativa no está disponible."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/inventory/receipts",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            reference: normalizedReference,
            receiptType: "STANDARD",
            source: source.trim() || null,
            notes: notes.trim() || null,
          }),
        }
      );

      const payload = await response.json();

      if (!response.ok) {
        throw new Error(
          payload.detail ||
            payload.error ||
            "No fue posible crear la recepción."
        );
      }

      if (
        typeof payload.receipt !== "string" ||
        !payload.receipt
      ) {
        throw new Error(
          "La recepción fue procesada pero no devolvió un identificador válido."
        );
      }

      setCreatedReceiptId(payload.receipt);
    router.replace(
  `/admin/inventory/receipts?receiptId=${encodeURIComponent(
    payload.receipt
  )}`
);

    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "No fue posible crear la recepción."
      );
        } finally {
      setCreating(false);
    }
  };

  const handleSaveReceiptItem = async () => {
    try {
      setSavingReceiptItem(true);
      setReceiptItemError(null);

      if (!activeReceipt) {
        setReceiptItemError(
          "No hay una recepción activa."
        );
        return;
      }

      if (!selectedInventoryId) {
        setReceiptItemError(
          "Selecciona una referencia del catálogo."
        );
        return;
      }


      const expected =
        Number(expectedQuantity);

      const received =
        receivedQuantity.trim() === ""
          ? null
          : Number(receivedQuantity);

      if (
        !Number.isInteger(expected) ||
        expected < 0
      ) {
        setReceiptItemError(
          "La cantidad esperada debe ser un número entero igual o mayor que cero."
        );
        return;
      }

      if (
        received !== null &&
        (
          !Number.isInteger(received) ||
          received < 0
        )
      ) {
        setReceiptItemError(
          "La cantidad recibida debe ser un número entero igual o mayor que cero."
        );
        return;
      }

      const supabase =
        getSupabaseBrowser();

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        setReceiptItemError(
          "La sesión administrativa no está disponible."
        );
        return;
      }

      const response = await fetch(
        "/api/admin/inventory/receipts/items",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            receiptId: activeReceipt.id,
            inventoryId: selectedInventoryId,
            expectedQuantity: expected,
            receivedQuantity: received,
            observation:
              itemObservation.trim() || null,
          }),
        }
      );

      const payload =
        await response.json();

      if (!response.ok) {
        throw new Error(
          payload.detail ||
            payload.error ||
            "No fue posible registrar la mercancía."
        );
      }

      setSelectedInventoryId("");
      setExpectedQuantity("");
      setReceivedQuantity("");
      setItemObservation("");

      await loadReceipt(activeReceipt.id);
    } catch (error) {
      setReceiptItemError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la mercancía."
      );
    } finally {
      setSavingReceiptItem(false);
    }
  };

   const handleSubmitReceipt = async () => {
  try {
    setSubmittingReceipt(true);
    setSubmitReceiptError(null);

    if (!activeReceipt) {
      setSubmitReceiptError(
        "No hay una recepción activa."
      );
      return;
    }

    if (activeReceipt.status !== "IN_PROGRESS") {
      setSubmitReceiptError(
        "La recepción no está disponible para envío."
      );
      return;
    }

    if (receiptItems.length === 0) {
      setSubmitReceiptError(
        "La recepción debe contener al menos una referencia."
      );
      return;
    }

    const hasUncountedItems =
      receiptItems.some(
        (item) =>
          item.received_quantity === null
      );

    if (hasUncountedItems) {
      setSubmitReceiptError(
        "Todas las referencias deben tener una cantidad recibida antes del envío."
      );
      return;
    }

    const supabase =
      getSupabaseBrowser();

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setSubmitReceiptError(
        "La sesión administrativa no está disponible."
      );
      return;
    }

    const response = await fetch(
      "/api/admin/inventory/receipts/submit",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId: activeReceipt.id,
        }),
      }
    );

    const payload =
      await response.json();

    if (!response.ok) {
      throw new Error(
        payload.detail ||
          payload.error ||
          "No fue posible enviar la recepción a revisión."
      );
    }

    await loadReceipt(activeReceipt.id);
  } catch (error) {
    setSubmitReceiptError(
      error instanceof Error
        ? error.message
        : "No fue posible enviar la recepción a revisión."
    );
  } finally {
    setSubmittingReceipt(false);
  }
};

const handleReviewReceipt = async (
  decision: "APPROVE" | "REJECT"
) => {
  try {
    setReviewingReceipt(true);
    setReviewReceiptError(null);

    if (!activeReceipt) {
      setReviewReceiptError(
        "No hay una recepción activa."
      );
      return;
    }

    if (activeReceipt.status !== "SUBMITTED") {
      setReviewReceiptError(
        "La recepción no está disponible para revisión."
      );
      return;
    }

    const normalizedReason =
      reviewReason.trim();

    if (
      decision === "REJECT" &&
      !normalizedReason
    ) {
      setReviewReceiptError(
        "Debes indicar el motivo del rechazo."
      );
      return;
    }

    const supabase =
      getSupabaseBrowser();

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setReviewReceiptError(
        "La sesión administrativa no está disponible."
      );
      return;
    }

    const response = await fetch(
      "/api/admin/inventory/receipts/review",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId: activeReceipt.id,
          decision,
          reason:
            normalizedReason || null,
        }),
      }
    );

    const payload =
      await response.json();

    if (!response.ok) {
      throw new Error(
        payload.detail ||
          payload.error ||
          "No fue posible revisar la recepción."
      );
    }

    setReviewReason("");

    await loadReceipt(activeReceipt.id);
  } catch (error) {
    setReviewReceiptError(
      error instanceof Error
        ? error.message
        : "No fue posible revisar la recepción."
    );
  } finally {
    setReviewingReceipt(false);
  }
};

const handleApplyReceipt = async () => {
  try {
    setApplyingReceipt(true);
    setApplyReceiptError(null);

    if (!activeReceipt) {
      setApplyReceiptError(
        "No hay una recepción activa."
      );
      return;
    }

    if (activeReceipt.status !== "APPROVED") {
      setApplyReceiptError(
        "La recepción debe estar aprobada antes de aplicarse."
      );
      return;
    }

    if (!canApplyInventoryReceipt) {
      setApplyReceiptError(
        "No tienes autorización para aplicar esta recepción al inventario maestro."
      );
      return;
    }

    const supabase =
      getSupabaseBrowser();

    const {
      data: sessionData,
      error: sessionError,
    } = await supabase.auth.getSession();

    const accessToken =
      sessionData.session?.access_token;

    if (sessionError || !accessToken) {
      setApplyReceiptError(
        "La sesión administrativa no está disponible."
      );
      return;
    }

    const response = await fetch(
      "/api/admin/inventory/receipts/apply",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          receiptId: activeReceipt.id,
        }),
      }
    );

    const payload =
      await response.json();

    if (!response.ok) {
      throw new Error(
        payload.detail ||
          payload.error ||
          "No fue posible aplicar la recepción al inventario."
      );
    }

    await loadReceipt(activeReceipt.id);
  } catch (error) {
    setApplyReceiptError(
      error instanceof Error
        ? error.message
        : "No fue posible aplicar la recepción al inventario."
    );
  } finally {
    setApplyingReceipt(false);
  }
};

  return (
    <main className="min-h-screen bg-[#f5f2eb] text-black">
      <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
        <button
          type="button"
          onClick={() =>
            router.push("/admin/inventory")
          }
          className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/45 transition hover:text-black"
        >
          ← Volver a inventario
        </button>

        <header className="mt-8 border-b border-black/10 pb-8">
          <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
            Inventory Control Center
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Recepciones de inventario
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">
            Registro, conciliación y trazabilidad de
            mercancía recibida antes de su incorporación
            al inventario maestro.
          </p>
        </header>

        <section className="mt-8 grid gap-4 md:grid-cols-3">
          <button
  type="button"
  onClick={() => {
    setShowCreateForm(true);
    setErrorMessage(null);
    setCreatedReceiptId(null);
  }}
  className="border border-black/10 bg-white p-6 text-left transition hover:border-black/30 hover:bg-black/[0.02]"
>
  <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
    01 · Registro
  </p>

  <h2 className="mt-3 text-lg font-semibold">
    Crear recepción
  </h2>

  <p className="mt-2 text-xs leading-5 text-black/45">
    Identificar el ingreso, su origen y la
    mercancía esperada.
  </p>
</button>

          <article className="border border-black/10 bg-white p-6">
            <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
              02 · Conciliación
            </p>

            <h2 className="mt-3 text-lg font-semibold">
              Verificar recibido
            </h2>

            <p className="mt-2 text-xs leading-5 text-black/45">
              Comparar cantidades esperadas contra
              cantidades físicamente recibidas.
            </p>
          </article>

          <article className="border border-black/10 bg-white p-6">
            <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
              03 · Control
            </p>

            <h2 className="mt-3 text-lg font-semibold">
              Autorizar ingreso
            </h2>

            <p className="mt-2 text-xs leading-5 text-black/45">
              Revisar el expediente antes de incorporar
              existencias al inventario maestro.
            </p>
          </article>
        </section>

                {receiptLoading && (
          <section className="mt-6 border border-black/10 bg-white p-6 md:p-8">
            <p className="text-[9px] uppercase tracking-[0.22em] text-black/35">
              Reconstruyendo expediente...
            </p>
          </section>
        )}

        {receiptError && (
          <section className="mt-6 border border-red-200 bg-white p-6 md:p-8">
            <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-red-700/60">
              Error de expediente
            </p>

            <p className="mt-3 text-sm text-red-700">
              {receiptError}
            </p>
          </section>
        )}

        {!receiptLoading &&
          !receiptError &&
          activeReceipt && (
            <section className="mt-6 border border-black/10 bg-white p-6 md:p-8">
              <div className="flex flex-col gap-5 border-b border-black/10 pb-6 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                    Expediente de recepción
                  </p>

                  <h2 className="mt-2 text-2xl font-semibold tracking-tight">
                    {activeReceipt.reference}
                  </h2>

                  <p className="mt-2 text-xs text-black/45">
                    {activeReceipt.source ||
                      "Origen no registrado"}
                  </p>
                </div>

                <div className="border border-black/15 px-4 py-3">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                    Estado
                  </p>

                  <p className="mt-1 text-xs font-semibold">
                    {activeReceipt.status}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid gap-px border border-black/10 bg-black/10 md:grid-cols-4">
                <div className="bg-white p-4">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                    Tipo
                  </p>

                  <p className="mt-2 text-xs font-medium">
                    {activeReceipt.receipt_type}
                  </p>
                </div>

                <div className="bg-white p-4">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                    Referencias
                  </p>

                  <p className="mt-2 text-xs font-medium">
                    {receiptItems.length}
                  </p>
                </div>

                <div className="bg-white p-4">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                    Correlation ID
                  </p>

                  <p className="mt-2 truncate text-xs font-medium">
                    {activeReceipt.correlation_id}
                  </p>
                </div>

                <div className="bg-white p-4">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                    Inventario afectado
                  </p>

                  <p className="mt-2 text-xs font-medium">
                    {activeReceipt.status === "APPLIED"
                      ? "Sí"
                      : "No"}
                  </p>
                </div>
              </div>

              {activeReceipt.notes && (
                <div className="mt-6 border-t border-black/10 pt-5">
                  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                    Notas
                  </p>

                  <p className="mt-2 max-w-3xl text-xs leading-5 text-black/55">
                    {activeReceipt.notes}
                  </p>
                </div>
              )}

              {["DRAFT", "IN_PROGRESS"].includes(
  activeReceipt.status
) && (
  <div className="mt-6 border-t border-black/10 pt-6">
    <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
          Captura de mercancía
        </p>

        <h3 className="mt-2 text-lg font-semibold tracking-tight">
          Agregar referencia
        </h3>

        <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45">
          Selecciona una referencia del catálogo maestro
          y registra las cantidades asociadas a esta
          recepción.
        </p>
      </div>

      <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
        {catalog.length} referencias disponibles
      </p>
    </div>

    {catalogLoading && (
      <p className="mt-5 text-xs text-black/45">
        Cargando catálogo maestro...
      </p>
    )}

    {catalogError && (
      <p className="mt-5 text-xs text-red-700">
        {catalogError}
      </p>
    )}

    {!catalogLoading && !catalogError && (
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <label className="md:col-span-2">
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Referencia del catálogo
          </span>

          <select
            value={selectedInventoryId}
            onChange={(event) =>
              setSelectedInventoryId(
                event.target.value
              )
            }
            className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          >
            <option value="">
              Seleccionar referencia
            </option>

            {catalog.map((item) => (
              <option
                key={item.inventory_id}
                value={item.inventory_id}
              >
                {[
                  item.sku,
                  item.product_name,
                  item.color,
                  item.size,
                ]
                  .filter(Boolean)
                  .join(" · ")}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Cantidad esperada
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={expectedQuantity}
            onChange={(event) =>
              setExpectedQuantity(
                event.target.value
              )
            }
            placeholder="0"
            className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          />
        </label>

        <label>
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Cantidad recibida
          </span>

          <input
            type="number"
            min="0"
            step="1"
            value={receivedQuantity}
            onChange={(event) =>
              setReceivedQuantity(
                event.target.value
              )
            }
            placeholder="Pendiente de conteo"
            className="mt-2 w-full border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          />
        </label>

        <label className="md:col-span-2">
          <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
            Observación
          </span>

          <textarea
            value={itemObservation}
            onChange={(event) =>
              setItemObservation(
                event.target.value
              )
            }
            rows={3}
            placeholder="Novedades, diferencias, estado del producto..."
            className="mt-2 w-full resize-none border border-black/15 bg-white px-4 py-3 text-sm outline-none transition focus:border-black"
          />
        </label>
      </div>
    )}

    {receiptItemError && (
      <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-xs text-red-700">
          {receiptItemError}
        </p>
      </div>
    )}

    {!catalogLoading && !catalogError && (
      <div className="mt-5 flex justify-end">
        <button
          type="button"
          onClick={() =>
            void handleSaveReceiptItem()
          }
          disabled={
            savingReceiptItem ||
            !selectedInventoryId ||
            expectedQuantity.trim() === ""
          }
          className="bg-black px-5 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20"
        >
          {savingReceiptItem
            ? "Registrando..."
            : "Agregar mercancía"}
        </button>
      </div>
    )}
  </div>
)}

              <div className="mt-6 border-t border-black/10 pt-5">
                <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                  Mercancía registrada
                </p>

                {receiptItems.length === 0 ? (
                  <div className="mt-4 border border-dashed border-black/15 px-5 py-8">
                    <p className="text-sm font-medium">
                      Aún no hay mercancía registrada.
                    </p>

                    <p className="mt-2 text-xs leading-5 text-black/45">
                      El expediente existe, pero todavía no
                      contiene referencias para conciliar.
                    </p>
                  </div>

                  

                ) : (
                  <div className="mt-4 divide-y divide-black/10 border-y border-black/10">
                    {receiptItems.map((item) => (
                      <div
                        key={item.inventory_id}
                        className="grid gap-3 py-4 md:grid-cols-4"
                      >
                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            SKU
                          </p>

                          <p className="mt-1 text-xs font-medium">
                            {item.sku}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Esperado
                          </p>

                          <p className="mt-1 text-xs font-medium">
                            {item.expected_quantity}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Recibido
                          </p>

                          <p className="mt-1 text-xs font-medium">
                            {item.received_quantity ?? "—"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Observación
                          </p>

                          <p className="mt-1 text-xs text-black/55">
                            {item.observation || "—"}
                          </p>
                        </div>
                      </div>
                          ))}
                  </div>
                )}
              </div>

              {/* 5G-11D — Cierre de captura */}
              {activeReceipt.status === "IN_PROGRESS" && (
                <div className="mt-6 border-t border-black/10 pt-6">
                  <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                        Cierre de captura
                      </p>

                      <h3 className="mt-2 text-lg font-semibold tracking-tight">
                        Enviar recepción a revisión
                      </h3>

                      <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45">
                        Al enviar el expediente, la captura de mercancía
                        quedará cerrada y la recepción pasará al estado
                        SUBMITTED para revisión.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() =>
                        void handleSubmitReceipt()
                      }
                      disabled={
                        submittingReceipt ||
                        receiptItems.length === 0 ||
                        receiptItems.some(
                          (item) =>
                            item.received_quantity === null
                        )
                      }
                      className="shrink-0 bg-black px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20"
                    >
                      {submittingReceipt
                        ? "Enviando..."
                        : "Enviar a revisión"}
                    </button>
                  </div>

                  {submitReceiptError && (
                    <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
                      <p className="text-xs text-red-700">
                        {submitReceiptError}
                      </p>
                    </div>
                  )}

                  <div className="mt-5 border border-black/10 bg-[#f5f2eb] px-4 py-4">
                    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
                      Efecto del envío
                    </p>

                    <p className="mt-2 text-xs leading-5 text-black/50">
                      Esta acción no modifica las existencias del
                      inventario maestro. Únicamente presenta el
                      expediente para revisión y autorización.
                    </p>
                  </div>
                </div>
              )}

              {/* 5G-12E — Control de revisión */}
{activeReceipt.status === "SUBMITTED" && (
  <div className="mt-6 border-t border-black/10 pt-6">
    <div className="flex flex-col gap-2">
      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
        Control de recepción
      </p>

      <h3 className="text-lg font-semibold tracking-tight">
        Expediente pendiente de revisión
      </h3>

      <p className="max-w-2xl text-xs leading-5 text-black/45">
        La captura se encuentra cerrada. Un usuario
        autorizado distinto del remitente debe revisar
        el expediente antes de autorizar su incorporación
        al inventario.
      </p>
    </div>

    <label className="mt-5 block">
      <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
        Observación de revisión
      </span>

      <textarea
        value={reviewReason}
        onChange={(event) =>
          setReviewReason(event.target.value)
        }
        placeholder="Registre una observación de control. Es obligatoria si la recepción será rechazada."
        rows={3}
        disabled={reviewingReceipt}
        className="mt-2 w-full resize-none border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm leading-6 outline-none transition focus:border-black/50 disabled:cursor-not-allowed disabled:opacity-50"
      />
    </label>

    {reviewReceiptError && (
      <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
        <p className="text-xs text-red-700">
          {reviewReceiptError}
        </p>
      </div>
    )}

    <div className="mt-5 flex flex-col gap-3 border-t border-black/10 pt-5 sm:flex-row sm:items-center sm:justify-between">
      <button
        type="button"
        onClick={() =>
          void handleReviewReceipt("REJECT")
        }
        disabled={
          reviewingReceipt ||
          !reviewReason.trim()
        }
        className="border border-black/20 px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-black transition hover:border-black disabled:cursor-not-allowed disabled:opacity-30"
      >
        {reviewingReceipt
          ? "Procesando..."
          : "Rechazar recepción"}
      </button>

      <button
        type="button"
        onClick={() =>
          void handleReviewReceipt("APPROVE")
        }
        disabled={reviewingReceipt}
        className="bg-black px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20"
      >
        {reviewingReceipt
          ? "Procesando..."
          : "Autorizar recepción"}
      </button>
    </div>

    <div className="mt-5 border border-black/10 bg-[#f5f2eb] px-4 py-4">
      <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
        Segregación de funciones
      </p>

      <p className="mt-2 text-xs leading-5 text-black/50">
        El usuario que presentó la recepción no puede
        revisarla. La autorización tampoco modifica
        todavía las existencias del inventario maestro.
      </p>
    </div>
  </div>
)}

{/* 5G-13O — Aplicación al inventario maestro */}
{activeReceipt.status === "APPROVED" &&
  !capabilitiesLoading &&
  canApplyInventoryReceipt && (
    <div className="mt-6 border-t border-black/10 pt-6">
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
            Aplicación de inventario
          </p>

          <h3 className="mt-2 text-lg font-semibold tracking-tight">
            Incorporar recepción al inventario maestro
          </h3>

          <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45">
            La recepción ya fue autorizada. Esta acción
            incorporará las cantidades recibidas al inventario
            maestro y generará los movimientos físicos
            correspondientes.
          </p>
        </div>

        <button
          type="button"
          onClick={() =>
            void handleApplyReceipt()
          }
          disabled={applyingReceipt}
          className="shrink-0 bg-black px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:bg-black/20"
        >
          {applyingReceipt
            ? "Aplicando..."
            : "Aplicar al inventario maestro"}
        </button>
      </div>

      {applyReceiptError && (
        <div className="mt-4 border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-xs text-red-700">
            {applyReceiptError}
          </p>
        </div>
      )}

      <div className="mt-5 border border-black/10 bg-[#f5f2eb] px-4 py-4">
        <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
          Efecto irreversible de negocio
        </p>

        <p className="mt-2 text-xs leading-5 text-black/50">
          Al aplicar esta recepción se actualizarán las
          existencias del inventario maestro y se registrará
          el movimiento físico asociado. La misma recepción
          no podrá aplicarse dos veces.
        </p>
      </div>
    </div>
  )}

            </section>
          )}

                {showCreateForm && (
          <section className="mt-6 border border-black/10 bg-white p-6 md:p-8">
            <div className="flex flex-col gap-3 border-b border-black/10 pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Nueva recepción
                </p>

                <h2 className="mt-2 text-xl font-semibold tracking-tight">
                  Registrar ingreso de mercancía
                </h2>

                <p className="mt-2 max-w-2xl text-xs leading-5 text-black/45">
                  Identifique el documento de recepción y
                  el origen de la mercancía antes de iniciar
                  la conciliación física.
                </p>
              </div>

              <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35">
                Estado inicial · DRAFT
              </span>
            </div>

            <div className="mt-6 grid gap-5 md:grid-cols-2">
              <label className="block">
                <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
                  Referencia *
                </span>

                <input
                  type="text"
                  value={reference}
                  onChange={(event) =>
                    setReference(event.target.value)
                  }
                  placeholder="Ej. WT-REC-2026-001"
                  className="mt-2 w-full border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm outline-none transition focus:border-black/50"
                />
              </label>

              <label className="block">
                <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
                  Origen
                </span>

                <input
                  type="text"
                  value={source}
                  onChange={(event) =>
                    setSource(event.target.value)
                  }
                  placeholder="Ej. GAT Fashion Lab"
                  className="mt-2 w-full border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm outline-none transition focus:border-black/50"
                />
              </label>
            </div>

            <label className="mt-5 block">
              <span className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/40">
                Notas
              </span>

              <textarea
                value={notes}
                onChange={(event) =>
                  setNotes(event.target.value)
                }
                placeholder="Información documental, guía, proveedor o contexto de la recepción..."
                rows={4}
                className="mt-2 w-full resize-none border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm leading-6 outline-none transition focus:border-black/50"
              />
            </label>

            {errorMessage && (
              <p className="mt-4 text-xs font-medium text-red-700">
                {errorMessage}
              </p>
            )}

            {createdReceiptId && (
  <div className="mt-4 border border-black/10 bg-[#f5f2eb] p-4">
    <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35">
      Recepción creada
    </p>

    <p className="mt-2 break-all text-xs font-medium">
      {createdReceiptId}
    </p>

    <p className="mt-2 text-[10px] leading-5 text-black/45">
      El expediente fue creado en estado DRAFT.
      Todavía no se ha modificado el inventario.
    </p>
  </div>
)}

            <div className="mt-6 flex flex-col gap-3 border-t border-black/10 pt-6 sm:flex-row sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => {
                  setShowCreateForm(false);
                  setErrorMessage(null);
                }}
                className="text-[9px] font-semibold uppercase tracking-[0.18em] text-black/45 transition hover:text-black"
              >
                Cancelar
              </button>

              <button
  type="button"
  onClick={handleCreateReceipt}
  disabled={creating || !reference.trim()}
  className="border border-black bg-black px-6 py-3 text-[9px] font-semibold uppercase tracking-[0.18em] text-white transition hover:bg-black/80 disabled:cursor-not-allowed disabled:border-black/20 disabled:bg-transparent disabled:text-black/30"
>
  {creating
    ? "Creando..."
    : "Crear recepción"}
</button>
            </div>
          </section>
        )}

        <section className="mt-8 border border-black/10 bg-white p-6 md:p-8">
          <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
            Flujo institucional
          </p>

          <div className="mt-5 grid gap-3 md:grid-cols-5">
            {[
              ["DRAFT", "Creada"],
              ["IN_PROGRESS", "En captura"],
              ["SUBMITTED", "En revisión"],
              ["APPROVED", "Autorizada"],
              ["APPLIED", "Aplicada"],
            ].map(([status, label]) => (
              <div
                key={status}
                className="border border-black/10 px-4 py-4"
              >
                <p className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/35">
                  {status}
                </p>

                <p className="mt-2 text-xs font-medium">
                  {label}
                </p>
              </div>
            ))}
          </div>

          <p className="mt-5 max-w-3xl text-xs leading-5 text-black/40">
            Una recepción aprobada todavía no modifica
            existencias. El inventario maestro cambia
            únicamente cuando la recepción autorizada es
            aplicada.
          </p>
        </section>
      </div>
    </main>
  );
}