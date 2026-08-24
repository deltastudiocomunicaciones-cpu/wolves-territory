"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

type Settlement = {
  id: string;

  reference: string;

  periodStart: string;
  periodEnd: string;

  salesBaseAmount: number;
  commissionAmount: number;
  commissionCount: number;

  status: string;

  partner: {
    id: string;
    code: string;
    name: string;
    email: string | null;
  } | null;

  payoutAccount: {
    id: string;

    payout_method: string;

    bank_name: string | null;

    account_type:
      | string
      | null;

    account_last4:
      string;

    verified:
      boolean;

    active:
      boolean;
  } | null;

  payoutReady:
    boolean;
};

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
  const [
    year,
    month,
    day,
  ] = value
    .slice(0, 10)
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

export default function AdminSettlementsPage() {
  const router =
    useRouter();

  const [
    settlements,
    setSettlements,
  ] =
    useState<Settlement[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    processing,
    setProcessing,
  ] =
    useState<string | null>(
      null
    );

  const [
    error,
    setError,
  ] =
    useState("");

  const loadSettlements =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const supabase =
            getSupabaseBrowser();

          const {
            data:
              sessionData,
          } =
            await supabase.auth
              .getSession();

          const accessToken =
            sessionData.session
              ?.access_token;

          if (!accessToken) {
            router.replace(
              "/admin/login"
            );

            return;
          }

          const response =
            await fetch(
              "/api/admin/settlements",
              {
                method:
                  "GET",

                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ??
                "No fue posible cargar las liquidaciones."
            );
          }

          setSettlements(
            data.settlements ??
              []
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar las liquidaciones."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [router]
    );

  useEffect(() => {
    loadSettlements();
  }, [
    loadSettlements,
  ]);

  async function paySettlement(
    settlement:
      Settlement
  ) {
    if (
      !settlement.payoutReady
    ) {
      window.alert(
        "Este Seller todavía no tiene una cuenta de pago verificada."
      );

      return;
    }

    const paymentReference =
      window.prompt(
        `Referencia del comprobante bancario para ${settlement.partner?.name ?? "Seller"}:`
      );

    if (
      paymentReference ===
      null
    ) {
      return;
    }

    if (
      !paymentReference.trim()
    ) {
      window.alert(
        "Debes ingresar la referencia real del comprobante."
      );

      return;
    }

    const confirmed =
      window.confirm(
        `Confirmas que ya se transfirieron ${formatPrice(
          Number(
            settlement.commissionAmount
          )
        )} a ${settlement.partner?.name ?? "Seller"} y deseas marcar esta liquidación como PAGADA?`
      );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(
        settlement.id
      );

      const supabase =
        getSupabaseBrowser();

      const {
        data:
          sessionData,
      } =
        await supabase.auth
          .getSession();

      const accessToken =
        sessionData.session
          ?.access_token;

      if (!accessToken) {
        router.replace(
          "/admin/login"
        );

        return;
      }

      const response =
        await fetch(
          "/api/admin/settlements/pay",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${accessToken}`,
            },

            body:
              JSON.stringify({
                reference:
                  settlement.reference,

                paymentReference:
                  paymentReference.trim(),
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
            "No fue posible registrar el pago."
        );
      }

      setSettlements(
        (current) =>
          current.filter(
            (item) =>
              item.id !==
              settlement.id
          )
      );

      window.alert(
        "Liquidación registrada como PAGADA."
      );
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible registrar el pago."
      );
    } finally {
      setProcessing(
        null
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Settlements...
        </p>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      <header className="border-b border-black/10 px-6 py-5 md:px-10">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.34em]">
              Wolves Territory
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-black/35">
              Settlement Control
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin"
              )
            }
            className="text-[9px] uppercase tracking-[0.22em] text-black/40"
          >
            ← Territory Control
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:py-20">

        <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
          Seller Network · Finance
        </p>

        <div className="mt-4 flex items-end justify-between gap-8">

          <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.045em] md:text-6xl">
            Liquidaciones
            <br />
            pendientes.
          </h1>

          <p className="text-5xl font-semibold tracking-[-0.06em]">
            {settlements.length}
          </p>

        </div>

        {error && (
          <div className="mt-8 border border-red-500/20 bg-red-500/5 p-5">

            <p className="text-xs text-red-700">
              {error}
            </p>

          </div>
        )}

        {settlements.length ===
        0 ? (
          <div className="mt-14 border-y border-black/10 py-14">

            <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
              Settlement Control
            </p>

            <h2 className="mt-4 text-2xl font-semibold uppercase">
              Todo al día.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-black/45">
              No existen liquidaciones READY pendientes de pago.
            </p>

          </div>
        ) : (
          <div className="mt-14 space-y-4">

            {settlements.map(
              (
                settlement
              ) => (
                <article
                  key={
                    settlement.id
                  }
                  className="border border-black/10 bg-white/25 p-6 md:p-8"
                >

                  <div className="grid gap-8 xl:grid-cols-[1fr_1fr_1fr_auto] xl:items-end">

                    {/* SELLER */}

                    <div>

                      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                        Seller
                      </p>

                      <h2 className="mt-3 text-xl font-semibold">
                        {settlement.partner
                          ?.name ??
                          "Seller"}
                      </h2>

                      <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                        {settlement.partner
                          ?.code ??
                          "—"}
                      </p>

                      <p className="mt-6 text-[8px] uppercase tracking-[0.2em] text-black/30">
                        Liquidación
                      </p>

                      <p className="mt-2 break-all text-[10px] font-semibold uppercase tracking-[0.1em]">
                        {
                          settlement.reference
                        }
                      </p>

                    </div>

                    {/* PERIOD */}

                    <div>

                      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                        Periodo
                      </p>

                      <p className="mt-3 text-sm font-medium">
                        {formatDate(
                          settlement.periodStart
                        )}

                        {" — "}

                        {formatDate(
                          settlement.periodEnd
                        )}
                      </p>

                      <p className="mt-6 text-[8px] uppercase tracking-[0.2em] text-black/30">
                        Ventas asociadas
                      </p>

                      <p className="mt-2 text-lg font-semibold">
                        {formatPrice(
                          Number(
                            settlement.salesBaseAmount
                          )
                        )}
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        {
                          settlement.commissionCount
                        }{" "}
                        comisiones
                      </p>

                    </div>

                    {/* PAYMENT */}

                    <div>

                      <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                        A pagar
                      </p>

                      <p className="mt-3 text-2xl font-semibold">
                        {formatPrice(
                          Number(
                            settlement.commissionAmount
                          )
                        )}
                      </p>

                      {settlement.payoutAccount ? (
                        <div className="mt-6">

                          <p className="text-[8px] uppercase tracking-[0.2em] text-black/30">
                            Destino
                          </p>

                          <p className="mt-2 text-sm font-medium">
                            {settlement
                              .payoutAccount
                              .bank_name ??
                              "Entidad financiera"}
                          </p>

                          <p className="mt-1 text-xs text-black/40">
                            ••••{" "}
                            {
                              settlement
                                .payoutAccount
                                .account_last4
                            }
                          </p>

                          <p className="mt-3 text-[8px] font-semibold uppercase tracking-[0.18em] text-emerald-700">
                            ✓ Payout Ready
                          </p>

                        </div>
                      ) : (
                        <p className="mt-6 text-[8px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                          ● Cuenta no verificada
                        </p>
                      )}

                    </div>

                    {/* ACTION */}

                    <button
                      type="button"
                      disabled={
                        !settlement.payoutReady ||
                        processing ===
                          settlement.id
                      }
                      onClick={() =>
                        paySettlement(
                          settlement
                        )
                      }
                      className="min-w-52 bg-black px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:cursor-not-allowed disabled:opacity-30"
                    >
                      {processing ===
                      settlement.id
                        ? "Procesando..."
                        : settlement.payoutReady
                          ? "Registrar pago"
                          : "Payout pendiente"}
                    </button>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </div>

    </main>
  );
}