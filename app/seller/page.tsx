"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import { useRouter } from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

type SellerPartner = {
  id: string;
  code: string;
  name: string;
  commission_rate: number;
};

type SellerOrder = {
  id: string;
  reference: string;
  total: number;
  status: string;
  created_at: string;
};

type SellerCommission = {
  id: string;
  order_reference: string;
  commission_amount: number;
  commission_rate: number;
  status: string;
  earned_at: string | null;
};

function formatPrice(value: number) {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(new Date(value));
}

export default function SellerPage() {
  const router = useRouter();

  const [partner, setPartner] =
    useState<SellerPartner | null>(
      null
    );

  const [orders, setOrders] =
    useState<SellerOrder[]>([]);

  const [
    commissions,
    setCommissions,
  ] = useState<SellerCommission[]>(
    []
  );

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  /*
   * CARGAR SELLER
   */
  useEffect(() => {
    async function loadSeller() {
      try {
        const supabase =
          getSupabaseBrowser();

        /*
         * 1. USUARIO AUTENTICADO
         */
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
            "/seller/login"
          );

          return;
        }

        /*
         * 2. PARTNER
         *
         * RLS garantiza que solo
         * pueda obtener su propia fila.
         */
        const {
          data: partnerData,
          error: partnerError,
        } = await supabase
          .from("partners")
          .select(
            `
            id,
            code,
            name,
            commission_rate
            `
          )
          .eq("active", true)
          .maybeSingle();

        if (
          partnerError ||
          !partnerData
        ) {
          throw new Error(
            "No fue posible cargar tu perfil de vendedor."
          );
        }

        /*
         * 3. ÓRDENES + COMISIONES
         *
         * También están protegidas
         * por RLS.
         */
        const [
          ordersResult,
          commissionsResult,
        ] = await Promise.all([
          supabase
            .from("orders")
            .select(
              `
              id,
              reference,
              total,
              status,
              created_at
              `
            )
            .eq(
              "status",
              "APPROVED"
            )
            .order(
              "created_at",
              {
                ascending: false,
              }
            ),

          supabase
            .from("commissions")
            .select(
              `
              id,
              order_reference,
              commission_amount,
              commission_rate,
              status,
              earned_at
              `
            )
            .order(
              "earned_at",
              {
                ascending: false,
              }
            ),
        ]);

        if (ordersResult.error) {
          console.error(
            "SELLER ORDERS ERROR:",
            ordersResult.error
          );

          throw new Error(
            "No fue posible cargar tus ventas."
          );
        }

        if (
          commissionsResult.error
        ) {
          console.error(
            "SELLER COMMISSIONS ERROR:",
            commissionsResult.error
          );

          throw new Error(
            "No fue posible cargar tus comisiones."
          );
        }

        setPartner(
          partnerData
        );

        setOrders(
          ordersResult.data ?? []
        );

        setCommissions(
          commissionsResult.data ??
            []
        );
      } catch (error) {
        console.error(
          "SELLER DASHBOARD ERROR:",
          error
        );

        setError(
          error instanceof Error
            ? error.message
            : "No fue posible cargar el portal."
        );
      } finally {
        setLoading(false);
      }
    }

    loadSeller();
  }, [router]);

  /*
   * MÉTRICAS
   */
  const metrics =
    useMemo(() => {
      const totalSales =
        orders.reduce(
          (total, order) =>
            total +
            Number(order.total),
          0
        );

      const earnedCommission =
        commissions.reduce(
          (
            total,
            commission
          ) =>
            total +
            Number(
              commission
                .commission_amount
            ),
          0
        );

      const paidCommission =
        commissions
          .filter(
            (commission) =>
              commission.status ===
              "PAID"
          )
          .reduce(
            (
              total,
              commission
            ) =>
              total +
              Number(
                commission
                  .commission_amount
              ),
            0
          );

      const pendingCommission =
        earnedCommission -
        paidCommission;

      return {
        approvedSales:
          orders.length,

        totalSales,

        earnedCommission,

        paidCommission,

        pendingCommission,
      };
    }, [orders, commissions]);

  /*
   * REFERRAL LINK
   */
  const referralLink =
    typeof window !==
      "undefined" &&
    partner
      ? `${window.location.origin}/?ref=${partner.code}`
      : "";

  /*
   * COPY LINK
   */
  async function copyReferralLink() {
    if (!referralLink) return;

    try {
      await navigator.clipboard.writeText(
        referralLink
      );

      setCopied(true);

      setTimeout(() => {
        setCopied(false);
      }, 1800);
    } catch {
      console.error(
        "No fue posible copiar el enlace."
      );
    }
  }

  /*
   * SHARE
   */
  async function shareReferralLink() {
    if (!referralLink) return;

    if (
      typeof navigator !==
        "undefined" &&
      navigator.share
    ) {
      try {
        await navigator.share({
          title:
            "Wolves Territory",
          text:
            "Descubre Wolves Territory con mi enlace personal.",
          url: referralLink,
        });

        return;
      } catch {
        return;
      }
    }

    await copyReferralLink();
  }

  /*
   * LOGOUT
   */
  async function handleLogout() {
    const supabase =
      getSupabaseBrowser();

    await supabase.auth.signOut();

    router.replace(
      "/seller/login"
    );

    router.refresh();
  }

  /*
   * LOADING
   */
  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Territory...
        </p>
      </main>
    );
  }

  /*
   * ERROR
   */
  if (error || !partner) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="max-w-md text-center">
          <p className="text-[10px] uppercase tracking-[0.3em] text-red-400">
            Seller Portal
          </p>

          <p className="mt-5 text-sm leading-7 text-white/55">
            {error ||
              "No fue posible cargar tu cuenta."}
          </p>

          <button
            type="button"
            onClick={handleLogout}
            className="mt-8 border-b border-white/30 pb-2 text-[9px] uppercase tracking-[0.24em] text-white"
          >
            Regresar al login
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      {/* =========================
          TOP BAR
      ========================= */}
      <header className="border-b border-black/10 px-6 py-5 md:px-10 lg:px-14">
        <div className="mx-auto flex max-w-[1500px] items-center justify-between">

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.34em]">
              Wolves Territory
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-black/35">
              Seller Network
            </p>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/40 transition hover:text-black"
          >
            Sign Out
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-12 md:px-10 lg:px-14 lg:py-16">

        {/* =========================
            HERO
        ========================= */}
        <section className="grid gap-10 border-b border-black/10 pb-14 lg:grid-cols-[1.4fr_0.6fr] lg:items-end">

          <div>
            <p className="text-[9px] uppercase tracking-[0.32em] text-black/35">
              Personal Territory
            </p>

            <h1 className="mt-5 text-5xl font-semibold uppercase leading-[0.9] tracking-[-0.055em] md:text-7xl lg:text-8xl">
              Hola,
              <br />
              {partner.name}.
            </h1>
          </div>

          <div className="lg:text-right">
            <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
              Seller Code
            </p>

            <p className="mt-2 text-xl font-semibold uppercase tracking-[0.05em]">
              {partner.code}
            </p>

            <p className="mt-6 text-[9px] uppercase tracking-[0.25em] text-black/35">
              Referral Commission
            </p>

            <p className="mt-2 text-xl font-semibold">
              {
                partner.commission_rate
              }
              %
            </p>
          </div>

        </section>

        {/* =========================
            METRICS
        ========================= */}
        <section className="grid border-b border-black/10 md:grid-cols-2 lg:grid-cols-4">

          <Metric
            label="Ventas aprobadas"
            value={String(
              metrics.approvedSales
            )}
          />

          <Metric
            label="Total vendido"
            value={formatPrice(
              metrics.totalSales
            )}
          />

          <Metric
            label="Comisión generada"
            value={formatPrice(
              metrics.earnedCommission
            )}
          />

          <Metric
            label="Pendiente de pago"
            value={formatPrice(
              metrics.pendingCommission
            )}
          />

        </section>

        {/* =========================
            REFERRAL LINK
        ========================= */}
        <section className="grid gap-8 border-b border-black/10 py-14 lg:grid-cols-[0.75fr_1.25fr] lg:items-end">

          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
              Your Network
            </p>

            <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.04em] md:text-4xl">
              Tu enlace
              <br />
              personal.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-black/45">
              Comparte este enlace.
              Las compras realizadas
              desde él quedan asociadas
              automáticamente a tu código.
            </p>
          </div>

          <div>
            <div className="border border-black/15 bg-white/25 p-5">
              <p className="break-all text-xs leading-6 text-black/65">
                {referralLink}
              </p>
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={
                  copyReferralLink
                }
                className="bg-black px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white transition hover:bg-[#c9a96e] hover:text-black"
              >
                {copied
                  ? "Copied"
                  : "Copy Link"}
              </button>

              <button
                type="button"
                onClick={
                  shareReferralLink
                }
                className="border border-black/20 px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.25em] transition hover:border-black"
              >
                Share
              </button>
            </div>
          </div>

        </section>

        {/* =========================
            RECENT ACTIVITY
        ========================= */}
        <section className="py-14">

          <div className="flex items-end justify-between gap-6">
            <div>
              <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
                Performance
              </p>

              <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.04em] md:text-4xl">
                Actividad
                <br />
                reciente.
              </h2>
            </div>

            <p className="hidden text-[9px] uppercase tracking-[0.2em] text-black/35 md:block">
              Approved Sales
            </p>
          </div>

          {/* DESKTOP */}
          <div className="mt-10 hidden md:block">

            <div className="grid grid-cols-[1fr_1.4fr_1fr_1fr] border-b border-black/15 pb-4">
              <TableLabel>
                Fecha
              </TableLabel>

              <TableLabel>
                Referencia
              </TableLabel>

              <TableLabel>
                Venta
              </TableLabel>

              <TableLabel>
                Comisión
              </TableLabel>
            </div>

            {orders.length === 0 ? (
              <EmptyState />
            ) : (
              orders
                .slice(0, 10)
                .map((order) => {
                  const commission =
                    commissions.find(
                      (item) =>
                        item.order_reference ===
                        order.reference
                    );

                  return (
                    <div
                      key={order.id}
                      className="grid grid-cols-[1fr_1.4fr_1fr_1fr] items-center border-b border-black/10 py-5"
                    >
                      <p className="text-xs text-black/55">
                        {formatDate(
                          order.created_at
                        )}
                      </p>

                      <p className="text-[10px] font-medium uppercase tracking-[0.12em]">
                        {
                          order.reference
                        }
                      </p>

                      <p className="text-xs font-medium">
                        {formatPrice(
                          Number(
                            order.total
                          )
                        )}
                      </p>

                      <div>
                        <p className="text-xs font-medium">
                          {formatPrice(
                            Number(
                              commission
                                ?.commission_amount ??
                                0
                            )
                          )}
                        </p>

                        <p className="mt-1 text-[8px] uppercase tracking-[0.16em] text-black/35">
                          {commission?.status ??
                            "—"}
                        </p>
                      </div>
                    </div>
                  );
                })
            )}

          </div>

          {/* MOBILE */}
          <div className="mt-8 space-y-3 md:hidden">

            {orders.length === 0 ? (
              <EmptyState />
            ) : (
              orders
                .slice(0, 10)
                .map((order) => {
                  const commission =
                    commissions.find(
                      (item) =>
                        item.order_reference ===
                        order.reference
                    );

                  return (
                    <article
                      key={order.id}
                      className="border border-black/10 p-5"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                            {
                              formatDate(
                                order.created_at
                              )
                            }
                          </p>

                          <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.1em]">
                            {
                              order.reference
                            }
                          </p>
                        </div>

                        <p className="text-sm font-semibold">
                          {formatPrice(
                            Number(
                              order.total
                            )
                          )}
                        </p>
                      </div>

                      <div className="mt-5 flex items-end justify-between border-t border-black/10 pt-4">
                        <div>
                          <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                            Commission
                          </p>

                          <p className="mt-1 text-sm font-semibold">
                            {formatPrice(
                              Number(
                                commission
                                  ?.commission_amount ??
                                  0
                              )
                            )}
                          </p>
                        </div>

                        <p className="text-[8px] font-semibold uppercase tracking-[0.18em]">
                          {commission?.status ??
                            "—"}
                        </p>
                      </div>
                    </article>
                  );
                })
            )}

          </div>

        </section>

      </div>
    </main>
  );
}

/*
 * METRIC
 */
function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-black/10 py-8 md:border-r md:px-7 lg:border-b-0 first:md:pl-0 last:md:border-r-0">
      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
        {label}
      </p>

      <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] lg:text-3xl">
        {value}
      </p>
    </div>
  );
}

/*
 * TABLE LABEL
 */
function TableLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-black/35">
      {children}
    </p>
  );
}

/*
 * EMPTY STATE
 */
function EmptyState() {
  return (
    <div className="border-b border-black/10 py-12">
      <p className="text-sm text-black/40">
        Aún no tienes ventas aprobadas.
      </p>
    </div>
  );
}