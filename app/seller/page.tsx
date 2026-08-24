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

/* =========================================================
 * TYPES
 * ========================================================= */

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

type SellerSettlement = {
  id: string;
  reference: string;

  period_start: string;
  period_end: string;

  sales_base_amount: number;
  commission_amount: number;
  commission_count: number;

  status:
    | "READY"
    | "PAID"
    | "CANCELLED";

  payment_method: string | null;
  payment_reference: string | null;

  paid_at: string | null;
  created_at: string;
};

type SellerPayoutAccount = {
  id: string;

  payout_method: string;

  bank_name:
    | string
    | null;

  account_type:
    | string
    | null;

  account_last4:
    string;

  verified:
    boolean;

  verified_at:
    | string
    | null;

  active:
    boolean;

  created_at:
    string;
};

/* =========================================================
 * FORMATTERS
 * ========================================================= */

function formatPrice(
  value: number
) {
  return new Intl.NumberFormat(
    "es-CO",
    {
      style: "currency",
      currency: "COP",
      maximumFractionDigits: 0,
    }
  ).format(value);
}

function formatDate(
  value: string
) {
  /*
   * Evita desplazamiento de fecha
   * cuando Supabase devuelve YYYY-MM-DD.
   */
  if (
    /^\d{4}-\d{2}-\d{2}$/.test(
      value
    )
  ) {
    const [
      year,
      month,
      day,
    ] = value
      .split("-")
      .map(Number);

    return new Intl.DateTimeFormat(
      "es-CO",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    ).format(
      new Date(
        year,
        month - 1,
        day
      )
    );
  }

  return new Intl.DateTimeFormat(
    "es-CO",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  ).format(
    new Date(value)
  );
}

/* =========================================================
 * PAGE
 * ========================================================= */

export default function SellerPage() {
  const router =
    useRouter();

  const [
    partner,
    setPartner,
  ] =
    useState<SellerPartner | null>(
      null
    );

  const [
    orders,
    setOrders,
  ] =
    useState<SellerOrder[]>([]);

  const [
    commissions,
    setCommissions,
  ] =
    useState<
      SellerCommission[]
    >([]);

  const [
    settlements,
    setSettlements,
  ] =
    useState<
      SellerSettlement[]
    >([]);

    const [
  payoutAccount,
  setPayoutAccount,
] =
  useState<
    SellerPayoutAccount | null
  >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    copied,
    setCopied,
  ] =
    useState(false);

  /* =======================================================
   * LOAD SELLER DATA
   * ======================================================= */

  useEffect(() => {
    async function loadSeller() {
      try {
        const supabase =
          getSupabaseBrowser();

        /* -----------------------------------------------
         * USER
         * ----------------------------------------------- */

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

        /* -----------------------------------------------
         * PARTNER
         *
         * RLS devuelve únicamente
         * el partner del usuario autenticado.
         * ----------------------------------------------- */

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
          .eq(
            "active",
            true
          )
          .maybeSingle();

        if (
          partnerError ||
          !partnerData
        ) {
          throw new Error(
            "No fue posible cargar tu perfil de vendedor."
          );
        }

        const {
  data: sessionData,
  error: sessionError,
} =
  await supabase.auth.getSession();

const accessToken =
  sessionData.session?.access_token;

if (
  sessionError ||
  !accessToken
) {
  throw new Error(
    "No fue posible validar tu sesión Seller."
  );
}

        /* -----------------------------------------------
         * ORDERS + COMMISSIONS + SETTLEMENTS
         *
         * Todas protegidas mediante RLS.
         * ----------------------------------------------- */

        const [
  ordersResult,
  commissionsResult,
  settlementsResult,
  payoutResponse,
] =
  await Promise.all([
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
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "commissions"
              )
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
                  ascending:
                    false,
                }
              ),

            supabase
              .from(
                "seller_settlements"
              )
              .select(
                `
                id,
                reference,
                period_start,
                period_end,
                sales_base_amount,
                commission_amount,
                commission_count,
                status,
                payment_method,
                payment_reference,
                paid_at,
                created_at
                `
              )
              .order(
  "created_at",
  {
    ascending:
      false,
  }
),

fetch(
  "/api/seller/payout",
  {
    method: "GET",

    headers: {
      Authorization:
        `Bearer ${accessToken}`,
    },

    cache: "no-store",
  }
),
]);

const payoutData =
  await payoutResponse.json();

if (!payoutResponse.ok) {
  console.error(
    "SELLER PAYOUT ERROR:",
    payoutData
  );

  throw new Error(
    payoutData.error ??
      "No fue posible cargar tu configuración de pagos."
  );
}

        /* -----------------------------------------------
         * ERRORS
         * ----------------------------------------------- */

        if (
          ordersResult.error
        ) {
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

        if (
          settlementsResult.error
        ) {
          console.error(
            "SELLER SETTLEMENTS ERROR:",
            settlementsResult.error
          );

          throw new Error(
            "No fue posible cargar tus liquidaciones."
          );
        }

        /* -----------------------------------------------
         * STATE
         * ----------------------------------------------- */

        setPartner(
          partnerData
        );

        setOrders(
          ordersResult.data ??
            []
        );

        setCommissions(
          commissionsResult.data ??
            []
        );

        setSettlements(
          settlementsResult.data ??
            []
        );

        setPayoutAccount(
  payoutData.payoutAccount ??
    null
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



  /* =======================================================
   * METRICS
   * ======================================================= */

  const metrics =
    useMemo(() => {
      /*
       * Ventas APPROVED
       */
      const totalSales =
        orders.reduce(
          (
            total,
            order
          ) =>
            total +
            Number(
              order.total
            ),
          0
        );

      /*
       * Solo consideramos comisión
       * vigente: PENDING / EARNED / PAID.
       *
       * REVERSED no forma parte
       * de la comisión generada efectiva.
       */
      const validCommissions =
        commissions.filter(
          (commission) =>
            commission.status !==
            "REVERSED"
        );

      const generatedCommission =
        validCommissions.reduce(
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
        validCommissions
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
        validCommissions
          .filter(
            (commission) =>
              commission.status ===
                "EARNED" ||
              commission.status ===
                "PENDING"
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

      return {
        approvedSales:
          orders.length,

        totalSales,

        generatedCommission,

        paidCommission,

        pendingCommission,
      };
    }, [
      orders,
      commissions,
    ]);

  /* =======================================================
   * REFERRAL LINK
   * ======================================================= */

  const referralLink =
    typeof window !==
      "undefined" &&
    partner
      ? `${window.location.origin}/?ref=${partner.code}`
      : "";

  /* =======================================================
   * COPY
   * ======================================================= */

  async function copyReferralLink() {
    if (!referralLink) {
      return;
    }

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

  /* =======================================================
   * SHARE
   * ======================================================= */

  async function shareReferralLink() {
    if (!referralLink) {
      return;
    }

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

          url:
            referralLink,
        });

        return;
      } catch {
        return;
      }
    }

    await copyReferralLink();
  }

  /* =======================================================
   * LOGOUT
   * ======================================================= */

  async function handleLogout() {
    const supabase =
      getSupabaseBrowser();

    await supabase.auth.signOut();

    router.replace(
      "/seller/login"
    );

    router.refresh();
  }

  /* =======================================================
   * LOADING
   * ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Territory...
        </p>
      </main>
    );
  }

  /* =======================================================
   * ERROR
   * ======================================================= */

  if (
    error ||
    !partner
  ) {
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
            onClick={
              handleLogout
            }
            className="mt-8 border-b border-white/30 pb-2 text-[9px] uppercase tracking-[0.24em] text-white"
          >
            Regresar al login
          </button>

        </div>
      </main>
    );
  }

  /* =======================================================
   * UI
   * ======================================================= */

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      {/* =================================================
          TOP BAR
      ================================================= */}

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
            onClick={
              handleLogout
            }
            className="text-[9px] font-medium uppercase tracking-[0.22em] text-black/40 transition hover:text-black"
          >
            Sign Out
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-[1500px] px-6 py-12 md:px-10 lg:px-14 lg:py-16">

        {/* =================================================
            HERO
        ================================================= */}

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
                partner
                  .commission_rate
              }
              %
            </p>

          </div>

        </section>

            {/* =================================================
    FINANCIAL SETUP
================================================= */}

<FinancialSetup
  payoutAccount={payoutAccount}
  onConfigure={() =>
    router.push("/seller/payout")
  }
/>
        {/* =================================================
            METRICS
        ================================================= */}

        <section className="grid border-b border-black/10 sm:grid-cols-2 xl:grid-cols-5">

          <Metric
            label="Ventas aprobadas"
            value={String(
              metrics
                .approvedSales
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
              metrics
                .generatedCommission
            )}
          />

          <Metric
            label="Pagado"
            value={formatPrice(
              metrics
                .paidCommission
            )}
          />

          <Metric
            label="Pendiente"
            value={formatPrice(
              metrics
                .pendingCommission
            )}
          />

        </section>

        {/* =================================================
            REFERRAL LINK
        ================================================= */}

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

        {/* =================================================
            SETTLEMENTS
        ================================================= */}

        <section className="grid gap-10 border-b border-black/10 py-14 lg:grid-cols-[0.65fr_1.35fr]">

          {/* LEFT */}

          <div>

            <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
              Payments
            </p>

            <h2 className="mt-4 text-3xl font-semibold uppercase tracking-[-0.04em] md:text-4xl">
              Mis
              <br />
              liquidaciones.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-black/45">
              Consulta tus comisiones
              agrupadas para pago y el
              estado financiero de cada
              liquidación.
            </p>

            <div className="mt-9 grid grid-cols-2 gap-6 lg:grid-cols-1">

              <div>
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Total pagado
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatPrice(
                    metrics
                      .paidCommission
                  )}
                </p>
              </div>

              <div>
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Pendiente
                </p>

                <p className="mt-2 text-2xl font-semibold">
                  {formatPrice(
                    metrics
                      .pendingCommission
                  )}
                </p>
              </div>

            </div>

          </div>

          {/* RIGHT */}

          <div className="space-y-3">

            {settlements.length ===
            0 ? (
              <div className="border border-black/10 p-6">

                <p className="text-sm text-black/40">
                  Aún no tienes
                  liquidaciones.
                </p>

              </div>
            ) : (
              settlements.map(
                (
                  settlement
                ) => (
                  <article
                    key={
                      settlement.id
                    }
                    className="border border-black/10 p-5 md:p-6"
                  >

                    <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">

                      <div>

                        <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                          Liquidación
                        </p>

                        <p className="mt-2 break-all text-[10px] font-semibold uppercase tracking-[0.12em]">
                          {
                            settlement
                              .reference
                          }
                        </p>

                        <p className="mt-3 text-[9px] uppercase tracking-[0.18em] text-black/40">
                          {formatDate(
                            settlement
                              .period_start
                          )}

                          {" — "}

                          {formatDate(
                            settlement
                              .period_end
                          )}
                        </p>

                      </div>

                      <SettlementStatus
                        status={
                          settlement
                            .status
                        }
                      />

                    </div>

                    <div className="mt-6 grid grid-cols-2 gap-5 border-t border-black/10 pt-5 md:grid-cols-3">

                      <SettlementMetric
                        label="Ventas asociadas"
                        value={formatPrice(
                          Number(
                            settlement
                              .sales_base_amount
                          )
                        )}
                      />

                      <SettlementMetric
                        label="Comisión"
                        value={formatPrice(
                          Number(
                            settlement
                              .commission_amount
                          )
                        )}
                      />

                      <SettlementMetric
                        label="Ventas incluidas"
                        value={String(
                          settlement
                            .commission_count
                        )}
                      />

                    </div>

                    {settlement.status ===
                      "PAID" &&
                      settlement.paid_at && (
                        <div className="mt-5 border-t border-black/10 pt-5">

                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Información
                            de pago
                          </p>

                          <p className="mt-2 text-xs leading-6 text-black/60">

                            {formatDate(
                              settlement
                                .paid_at
                            )}

                            {settlement
                              .payment_method
                              ? ` · ${settlement.payment_method}`
                              : ""}

                            {settlement
                              .payment_reference
                              ? ` · ${settlement.payment_reference}`
                              : ""}

                          </p>

                        </div>
                      )}

                  </article>
                )
              )
            )}

          </div>

        </section>

        {/* =================================================
            RECENT ACTIVITY
        ================================================= */}

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

          {/* ===============================================
              DESKTOP TABLE
          =============================================== */}

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

            {orders.length ===
            0 ? (
              <EmptyState />
            ) : (
              orders
                .slice(
                  0,
                  10
                )
                .map(
                  (order) => {
                    const commission =
                      commissions.find(
                        (
                          item
                        ) =>
                          item.order_reference ===
                          order.reference
                      );

                    return (
                      <div
                        key={
                          order.id
                        }
                        className="grid grid-cols-[1fr_1.4fr_1fr_1fr] items-center border-b border-black/10 py-5"
                      >

                        <p className="text-xs text-black/55">
                          {formatDate(
                            order
                              .created_at
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
                            {commission
                              ?.status ??
                              "—"}
                          </p>

                        </div>

                      </div>
                    );
                  }
                )
            )}

          </div>

          {/* ===============================================
              MOBILE CARDS
          =============================================== */}

          <div className="mt-8 space-y-3 md:hidden">

            {orders.length ===
            0 ? (
              <EmptyState />
            ) : (
              orders
                .slice(
                  0,
                  10
                )
                .map(
                  (order) => {
                    const commission =
                      commissions.find(
                        (
                          item
                        ) =>
                          item.order_reference ===
                          order.reference
                      );

                    return (
                      <article
                        key={
                          order.id
                        }
                        className="border border-black/10 p-5"
                      >

                        <div className="flex items-start justify-between gap-4">

                          <div>

                            <p className="text-[8px] uppercase tracking-[0.2em] text-black/35">
                              {formatDate(
                                order
                                  .created_at
                              )}
                            </p>

                            <p className="mt-2 break-all text-[10px] font-semibold uppercase tracking-[0.1em]">
                              {
                                order.reference
                              }
                            </p>

                          </div>

                          <p className="shrink-0 text-sm font-semibold">
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
                            {commission
                              ?.status ??
                              "—"}
                          </p>

                        </div>

                      </article>
                    );
                  }
                )
            )}

          </div>

        </section>

      </div>
    </main>
  );
}

/* =========================================================
 * METRIC
 * ========================================================= */
function FinancialSetup({
  payoutAccount,
  onConfigure,
}: {
  payoutAccount: SellerPayoutAccount | null;
  onConfigure: () => void;
}) {
  /* ===============================================
   * SIN CUENTA REGISTRADA
   * =============================================== */

  if (!payoutAccount) {
    return (
      <section className="border-b border-black/10 py-8">
        <div className="grid gap-8 border border-black/10 bg-[#D9E3E8] p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">

          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#187E83]">
              Financial Setup
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-amber-500" />

              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-black/55">
                Configuración pendiente
              </p>
            </div>

            <h2 className="mt-5 text-2xl font-semibold uppercase leading-[0.95] tracking-[-0.04em] md:text-3xl">
              Configura tus pagos.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-black/50">
              Registra la cuenta donde deseas recibir
              tus futuras comisiones y liquidaciones.
            </p>
          </div>

          <button
            type="button"
            onClick={onConfigure}
            className="group flex min-w-64 items-center justify-between bg-black px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.24em] text-white transition hover:bg-[#187E83]"
          >
            Completar configuración

            <span className="transition-transform group-hover:translate-x-1">
              →
            </span>
          </button>

        </div>
      </section>
    );
  }

  /* ===============================================
   * CUENTA PENDIENTE DE VERIFICACIÓN
   * =============================================== */

  if (!payoutAccount.verified) {
    return (
      <section className="border-b border-black/10 py-8">
        <div className="grid gap-8 border border-black/10 bg-[#EEF2F3] p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">

          <div>
            <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#187E83]">
              Financial Setup
            </p>

            <div className="mt-4 flex items-center gap-3">
              <span className="h-2 w-2 rounded-full bg-amber-500" />

              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                Cuenta en verificación
              </p>
            </div>

            <h2 className="mt-5 text-2xl font-semibold uppercase tracking-[-0.04em]">
              Información recibida.
            </h2>

            <p className="mt-4 max-w-xl text-sm leading-7 text-black/50">
              Wolves Territory está validando tu
              información financiera antes de habilitar
              tus pagos.
            </p>
          </div>

          <div className="border-l border-black/10 pl-6">
            <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
              Destino registrado
            </p>

            <p className="mt-3 text-sm font-semibold">
              {payoutAccount.bank_name ??
                "Entidad financiera"}
            </p>

            <p className="mt-2 text-xs text-black/45">
              •••• {payoutAccount.account_last4}
            </p>
          </div>

        </div>
      </section>
    );
  }

  /* ===============================================
   * CUENTA VERIFICADA
   * =============================================== */

  return (
    <section className="border-b border-black/10 py-8">
      <div className="grid gap-8 border border-[#187E83]/20 bg-[#83C8C5]/20 p-6 md:p-8 lg:grid-cols-[1fr_auto] lg:items-center">

        <div>
          <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#187E83]">
            Financial Setup
          </p>

          <div className="mt-4 flex items-center gap-3">
            <span className="h-2 w-2 rounded-full bg-emerald-600" />

            <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
              Cuenta verificada
            </p>
          </div>

          <h2 className="mt-5 text-2xl font-semibold uppercase tracking-[-0.04em]">
            Payout Ready.
          </h2>

          <p className="mt-4 max-w-xl text-sm leading-7 text-black/50">
            Tu perfil financiero está habilitado para
            recibir futuras liquidaciones de Wolves Territory.
          </p>
        </div>

        <div className="border-l border-black/10 pl-6">
          <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
            Cuenta autorizada
          </p>

          <p className="mt-3 text-sm font-semibold">
            {payoutAccount.bank_name ??
              "Entidad financiera"}
          </p>

          <p className="mt-2 text-xs text-black/45">
            •••• {payoutAccount.account_last4}
          </p>
        </div>

      </div>
    </section>
  );
}
function Metric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="border-b border-black/10 py-8 sm:border-r sm:px-6 xl:border-b-0 first:sm:pl-0 last:sm:border-r-0">

      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
        {label}
      </p>

      <p className="mt-4 text-2xl font-semibold tracking-[-0.03em] xl:text-3xl">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
 * SETTLEMENT METRIC
 * ========================================================= */

function SettlementMetric({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div>

      <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
        {label}
      </p>

      <p className="mt-2 text-sm font-semibold">
        {value}
      </p>

    </div>
  );
}

/* =========================================================
 * SETTLEMENT STATUS
 * ========================================================= */

function SettlementStatus({
  status,
}: {
  status:
    | "READY"
    | "PAID"
    | "CANCELLED";
}) {
  if (
    status === "PAID"
  ) {
    return (
      <span className="inline-flex w-fit items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-emerald-700">

        <span className="h-2 w-2 rounded-full bg-emerald-600" />

        Pagada

      </span>
    );
  }

  if (
    status === "READY"
  ) {
    return (
      <span className="inline-flex w-fit items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-amber-700">

        <span className="h-2 w-2 rounded-full bg-amber-500" />

        Pendiente de pago

      </span>
    );
  }

  return (
    <span className="inline-flex w-fit items-center gap-2 text-[8px] font-semibold uppercase tracking-[0.2em] text-black/35">

      <span className="h-2 w-2 rounded-full bg-black/30" />

      Cancelada

    </span>
  );
}

/* =========================================================
 * TABLE LABEL
 * ========================================================= */

function TableLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-black/35">
      {children}
    </p>
  );
}

/* =========================================================
 * EMPTY STATE
 * ========================================================= */

function EmptyState() {
  return (
    <div className="border-b border-black/10 py-12">

      <p className="text-sm text-black/40">
        Aún no tienes ventas
        aprobadas.
      </p>

    </div>
  );
}