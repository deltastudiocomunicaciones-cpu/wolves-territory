"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

/* =========================================================
 * TYPES
 * ========================================================= */

type AdminProfile = {
  full_name: string;
  role: string;
};

type FulfillmentItem = {
  fulfillment_item_id: string;
  order_item_id: string;
  inventory_id: string;
  product_id: string;
  product_name: string;
  sku: string;
  color: string | null;
  size: string | null;
  quantity: number;
};

type OperationsOrder = {
  fulfillment_id: string;
  order_id: string;
  reference: string;
  status: string;

  recipient_name: string;
  recipient_phone: string;

  shipping_address: string;
  shipping_address_extra: string | null;
  shipping_city: string;
  shipping_department: string;

  carrier: string | null;
  tracking_number: string | null;
  tracking_url: string | null;

  prepared_by: string | null;
  packed_by: string | null;
  dispatched_by: string | null;
  delivered_by: string | null;

  preparation_started_at: string | null;
  packed_at: string | null;
  dispatched_at: string | null;
  delivered_at: string | null;
  closed_at: string | null;

  correlation_id: string;
  created_at: string;
  updated_at: string;

  item_count: number;
  unit_count: number;

  items: FulfillmentItem[];
};

/* =========================================================
 * PAGE
 * ========================================================= */

export default function OperationsPage() {
  const router = useRouter();

  const [admin, setAdmin] =
    useState<AdminProfile | null>(null);

  const [orders, setOrders] =
    useState<OperationsOrder[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [actionId, setActionId] =
    useState<string | null>(null);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  /* =======================================================
   * LOAD OPERATIONS TERRITORY
   * ======================================================= */

  useEffect(() => {
    async function loadOperations() {
      try {
        const supabase =
          getSupabaseBrowser();

        const {
          data: userData,
          error: userError,
        } =
          await supabase.auth.getUser();

        if (
          userError ||
          !userData.user
        ) {
          router.replace(
            "/admin/login"
          );

          return;
        }

        const {
          data: adminData,
          error: adminError,
        } =
          await supabase
            .from("admin_users")
            .select(
              `
              full_name,
              role,
              active
              `
            )
            .eq(
              "auth_user_id",
              userData.user.id
            )
            .maybeSingle();

        if (
          adminError ||
          !adminData ||
          !adminData.active ||
          adminData.role !==
            "OPERATIONS"
        ) {
          router.replace(
            "/admin"
          );

          return;
        }

        setAdmin({
          full_name:
            adminData.full_name,
          role:
            adminData.role,
        });

        /* ===================================================
         * OPERATIONS QUEUE
         *
         * Governed read model.
         * Authorization:
         * FULFILLMENT_VIEW
         * =================================================== */

        const {
          data: queueData,
          error: queueError,
        } = await supabase.rpc(
          "get_operations_queue"
        );

        if (queueError) {
          console.error(
            "OPERATIONS QUEUE ERROR:",
            queueError
          );

          setErrorMessage(
            queueError.message
          );

          return;
        }

        const queue =
          (queueData ?? []) as OperationsOrder[];

        setOrders(queue);
      } catch (error) {
        console.error(
          "OPERATIONS LOAD ERROR:",
          error
        );

        setErrorMessage(
          "No fue posible cargar el territorio operativo."
        );
      } finally {
        setLoading(false);
      }
    }

    loadOperations();
  }, [router]);

    /* =======================================================
   * START PREPARATION
   * ======================================================= */

  async function handleStartPreparation(
  fulfillmentId: string
) {
  try {
    setActionId(fulfillmentId);
    setErrorMessage(null);

    const supabase =
      getSupabaseBrowser();

    const {
      data,
      error,
    } = await supabase.rpc(
      "start_fulfillment_preparation",
      {
        p_fulfillment_id:
          fulfillmentId,
      }
    );

    if (error) {
      console.error(
        "START PREPARATION ERROR:",
        error
      );

      setErrorMessage(
        error.message
      );

      return;
    }

    console.log(
      "PREPARATION STARTED:",
      data
    );

    setOrders(
      (current) =>
        current.map(
          (order) =>
            order.fulfillment_id ===
            fulfillmentId
              ? {
                  ...order,
                  status:
                    "PREPARING",
                }
              : order
        )
    );
  } catch (error) {
    console.error(
      "START PREPARATION UNEXPECTED ERROR:",
      error
    );

    setErrorMessage(
      "No fue posible iniciar la preparación."
    );
  } finally {
    setActionId(null);
  }
}

  /* =======================================================
   * CONFIRM PACKING
   * ======================================================= */

  async function handlePackFulfillment(
    fulfillmentId: string
  ) {
    try {
      setActionId(
        fulfillmentId
      );

      setErrorMessage(null);

      const supabase =
        getSupabaseBrowser();

      const {
        data,
        error,
      } =
        await supabase.rpc(
          "pack_fulfillment",
          {
            p_fulfillment_id:
              fulfillmentId,
          }
        );

      if (error) {
        console.error(
          "PACK FULFILLMENT ERROR:",
          error
        );

        setErrorMessage(
          error.message
        );

        return;
      }

      console.log(
        "FULFILLMENT PACKED:",
        data
      );

      setOrders(
        (current) =>
          current.map(
            (order) =>
              order.fulfillment_id ===
              fulfillmentId
                ? {
                    ...order,
                    status:
                      "PACKED",
                  }
                : order
          )
      );
    } catch (error) {
      console.error(
        "PACK FULFILLMENT UNEXPECTED ERROR:",
        error
      );

      setErrorMessage(
        "No fue posible confirmar el empaque."
      );
    } finally {
      setActionId(null);
    }
  }


  /* =======================================================
   * LOADING
   * ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Territory Operations...
        </p>
      </main>
    );
  }

  /* =======================================================
   * METRICS
   * ======================================================= */

  const readyCount =
    orders.filter(
      (order) =>
        order.status === "READY"
    ).length;

  const preparingCount =
    orders.filter(
      (order) =>
        order.status ===
        "PREPARING"
    ).length;

     const packedCount =
    orders.filter(
      (order) =>
        order.status === "PACKED"
    ).length;

  /* =======================================================
   * UI
   * ======================================================= */

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">
      <header className="border-b border-black/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.34em]">
              Wolves Territory
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-black/35">
              Territory Operations
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="text-[9px] uppercase tracking-[0.22em] text-black/40 transition hover:text-black"
          >
            ← Centro de mando
          </button>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">
        <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
          Fulfillment Control
        </p>

        <h1 className="mt-4 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.045em] md:text-6xl">
          Operación
          <br />
          de pedidos.
        </h1>

        <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-black/30">
          {admin?.full_name} ·{" "}
          {admin?.role}
        </p>

        {/* ===============================================
            METRICS
        =============================================== */}

        <div className="mt-14 grid gap-px overflow-hidden border border-black/10 bg-black/10 md:grid-cols-3">
  <MetricCard
    label="Ready"
    title="Por preparar"
    value={readyCount}
  />

  <MetricCard
    label="Preparing"
    title="En preparación"
    value={preparingCount}
  />

  <MetricCard
    label="Packed"
    title="Empacados"
    value={packedCount}
  />
</div>

        {/* ===============================================
            ERROR
        =============================================== */}

        {errorMessage && (
          <div className="mt-10 border border-black/10 p-6">
            <p className="text-[8px] uppercase tracking-[0.24em] text-black/35">
              Security / Operations
            </p>

            <p className="mt-3 text-sm leading-6 text-black/60">
              {errorMessage}
            </p>
          </div>
        )}

        {/* ===============================================
            ORDERS
        =============================================== */}

        <div className="mt-16">
          <div className="flex items-end justify-between gap-6 border-b border-black/10 pb-5">
            <div>
              <p className="text-[8px] uppercase tracking-[0.26em] text-black/30">
                Operational Queue
              </p>

              <h2 className="mt-3 text-xl font-semibold uppercase tracking-[-0.02em]">
                Pedidos que requieren atención
              </h2>
            </div>

            <p className="text-[9px] uppercase tracking-[0.2em] text-black/30">
              {orders.length} pedidos
            </p>
          </div>

          {orders.length === 0 &&
          !errorMessage ? (
            <div className="py-16">
              <p className="text-sm text-black/40">
                No hay pedidos pendientes de
                preparación.
              </p>
            </div>
          ) : (
            <div>
              {orders.map(
                (order) => (
                  <article
                    key={
                      order.fulfillment_id
                    }
                    className="border-b border-black/10 py-8"
                  >
                    <div className="grid gap-8 lg:grid-cols-[1fr_auto] lg:items-end">
                      <div>
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-[8px] font-semibold uppercase tracking-[0.24em] text-black/35">
                            {order.status}
                          </p>

                          <span className="h-1 w-1 rounded-full bg-black/20" />

                          <p className="text-[8px] uppercase tracking-[0.22em] text-black/30">
                            {
                              order.reference
                            }
                          </p>
                        </div>

                        <h3 className="mt-5 text-2xl font-semibold tracking-[-0.035em]">
                          {
                            order.recipient_name
                          }
                        </h3>

                        <p className="mt-2 text-xs text-black/45">
                          {
                            order.shipping_city
                          }{" "}
                          ·{" "}
                          {
                            order.shipping_department
                          }
                        </p>

                        <div className="mt-6 space-y-2">
                          {order.items.map(
                            (item) => (
                              <div
                                key={
                                  item.fulfillment_item_id
                                }
                                className="flex flex-wrap gap-x-3 text-xs text-black/55"
                              >
                                <span>
                                  {
                                    item.product_name
                                  }
                                </span>

                                <span className="text-black/25">
                                  {
                                    item.sku
                                  }
                                </span>

                                <span>
                                  ×{" "}
                                  {
                                    item.quantity
                                  }
                                </span>
                              </div>
                            )
                          )}
                        </div>
                      </div>

                      <div>
  {order.status === "READY" ? (
    <button
      type="button"
      disabled={
        actionId ===
        order.fulfillment_id
      }
      onClick={() =>
        handleStartPreparation(
          order.fulfillment_id
        )
      }
      className="bg-black px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/80 disabled:cursor-wait disabled:opacity-40"
    >
      {actionId ===
      order.fulfillment_id
        ? "Iniciando..."
        : "Iniciar preparación →"}
    </button>
  ) : order.status === "PREPARING" ? (
    <button
      type="button"
      disabled={
        actionId ===
        order.fulfillment_id
      }
      onClick={() =>
        handlePackFulfillment(
          order.fulfillment_id
        )
      }
      className="bg-black px-6 py-4 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-black/80 disabled:cursor-wait disabled:opacity-40"
    >
      {actionId ===
      order.fulfillment_id
        ? "Confirmando..."
        : "Confirmar empaque →"}
    </button>
  ) : order.status === "PACKED" ? (
    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-black/35">
      Empaque confirmado
    </p>
  ) : (
    <p className="text-[9px] font-semibold uppercase tracking-[0.22em] text-black/35">
      {order.status}
    </p>
  )}
</div>
            </div>
                  </article>
                )
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

/* =========================================================
 * METRIC CARD
 * ========================================================= */

function MetricCard({
  label,
  title,
  value,
}: {
  label: string;
  title: string;
  value: number;
}) {
  return (
    <div className="bg-[#f2f0eb] p-7 md:p-9">
      <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
        {label}
      </p>

      <p className="mt-8 text-5xl font-semibold tracking-[-0.06em]">
        {value}
      </p>

      <h2 className="mt-5 text-sm font-semibold uppercase tracking-[0.08em]">
        {title}
      </h2>
    </div>
  );
}
