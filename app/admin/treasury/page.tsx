"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AccessState = "checking" | "allowed" | "denied";
type Settlement = {
  id: string;
  reference: string;
  periodStart: string;
  periodEnd: string;
  partner: {
    code: string;
    name: string;
  } | null;
  payoutAccount: {
    bank_name: string | null;
    account_last4: string;
  } | null;
  commissionAmount: number;
  commissionCount: number;
  status: string;
  payoutReady: boolean;
};

type FinancialSummary = {
  pendingSettlements: number;
  pendingAmount: number;
  commissions: number;
  payoutReady: number;
  accountsToVerify: number;
};

type FinancialState =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; data: FinancialSummary; settlements: Settlement[] };

const modules = [
  {
    number: "01",
    category: "OBLIGACIONES",
    title: "Liquidaciones comerciales",
    description:
      "Consulta de obligaciones, comisiones y estados de liquidación.",
    href: "/admin/settlements",
  },
  {
    number: "02",
    category: "BENEFICIARIOS",
    title: "Cuentas de destino",
    description:
      "Verificación y consulta de cuentas registradas para pagos.",
    href: "/admin/payouts",
  },
];

export default function TreasuryPage() {
  const router = useRouter();
  const [access, setAccess] = useState<AccessState>("checking");
  const [role, setRole] = useState("");
const [financial, setFinancial] = useState<FinancialState>({
    status: "loading",
  });

  useEffect(() => {
    let active = true;

    async function verifyAccess() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: userData, error: userError } =
          await supabase.auth.getUser();

        if (userError || !userData.user) {
          router.replace("/admin/login");
          return;
        }

        const { data, error } = await supabase
          .from("admin_users")
          .select("role, active")
          .eq("auth_user_id", userData.user.id)
          .eq("active", true)
          .maybeSingle();

        if (!active) return;

        if (
          error ||
          !data ||
          !["SUPER_ADMIN", "FINANCE"].includes(data.role)
        ) {
          setAccess("denied");
          return;
        }

        setRole(data.role);
        setAccess("allowed");
      } catch {
        if (active) setAccess("denied");
      }
    }

    void verifyAccess();

    return () => {
      active = false;
    };
  }, [router]);

  useEffect(() => {
    if (access !== "allowed") return;

    let cancelled = false;

    async function loadFinancial() {
      try {
        const supabase = getSupabaseBrowser();
        const { data, error } = await supabase.auth.getSession();
        const token = data.session?.access_token;

        if (error || !token) {
          throw new Error("Sesión financiera no disponible.");
        }

        const paths = [
          "/api/admin/settlements",
          "/api/admin/payouts",
        ];

        const responses = await Promise.all(
          paths.map((path) =>
            fetch(path, {
              headers: { Authorization: `Bearer ${token}` },
              cache: "no-store",
            })
          )
        );

        if (responses.some((response) => !response.ok)) {
          throw new Error("No fue posible consultar los módulos financieros.");
        }

        const [settlementPayload, payoutPayload] =
          await Promise.all(responses.map((response) => response.json()));

        if (
          settlementPayload.success !== true ||
          payoutPayload.success !== true ||
          !Array.isArray(settlementPayload.settlements) ||
          !Array.isArray(payoutPayload.accounts)
        ) {
          throw new Error("Respuesta financiera incompleta.");
        }

        const settlements: Settlement[] = settlementPayload.settlements;

        if (
          settlements.some(
            (item) =>
              item.status !== "READY" ||
              !Number.isSafeInteger(Number(item.commissionAmount)) ||
              Number(item.commissionAmount) < 0 ||
              !Number.isSafeInteger(Number(item.commissionCount)) ||
              Number(item.commissionCount) < 0 ||
              typeof item.payoutReady !== "boolean"
          )
        ) {
          throw new Error("Datos financieros inconsistentes.");
        }

        const summary: FinancialSummary = {
          pendingSettlements: settlements.length,
          pendingAmount: settlements.reduce(
            (total, item) => total + Number(item.commissionAmount),
            0
          ),
          commissions: settlements.reduce(
            (total, item) => total + Number(item.commissionCount),
            0
          ),
          payoutReady: settlements.filter((item) => item.payoutReady).length,
          accountsToVerify: payoutPayload.accounts.length,
        };

        if (!Number.isSafeInteger(summary.pendingAmount)) {
          throw new Error("Total financiero fuera de rango.");
        }

        if (!cancelled) {
          setFinancial({ status: "ready", data: summary, settlements });
        }
      } catch (error) {
        if (!cancelled) {
          setFinancial({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Error al consultar Tesorería.",
          });
        }
      }
    }

    void loadFinancial();

    return () => {
      cancelled = true;
    };
  }, [access]);
  if (access === "checking") {
    return (
      <main className="min-h-screen bg-[#f5f2eb] p-8 text-black">
        <p className="text-xs uppercase tracking-[0.2em]">
          Verificando acceso a Tesorería...
        </p>
      </main>
    );
  }

  if (access === "denied") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f5f2eb] p-6 text-black">
        <div className="max-w-md border border-black/10 bg-white p-10">
          <p className="mb-3 text-[10px] uppercase tracking-[0.25em] text-black/40">
            Wolves Territory / Treasury
          </p>
          <h1 className="text-3xl font-semibold">
            Acceso restringido
          </h1>
          <p className="mt-4 text-sm text-black/60">
            Esta área está reservada para Tesorería y
            Superadministración.
          </p>
          <Link
            href="/admin"
            className="mt-8 inline-block text-xs font-semibold uppercase tracking-widest underline"
          >
            Volver al panel
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f5f2eb] px-5 py-10 text-[#111] md:px-10 md:py-16">
      <div className="mx-auto max-w-6xl">
        <div className="mb-12 flex flex-wrap items-center justify-between gap-4">
          <Link
            href="/admin"
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/50 hover:text-black"
          >
            ← Volver al centro de control
          </Link>
          <span className="text-[10px] uppercase tracking-[0.2em] text-black/40">
            WT / FINANCIAL GOVERNANCE
          </span>
        </div>

        <section className="rounded-sm bg-[#111] px-7 py-10 text-white md:px-12 md:py-14">
          <div className="flex flex-wrap items-start justify-between gap-6">
            <div>
              <p className="text-[10px] uppercase tracking-[0.3em] text-[#c9a77b]">
                Wolves Territory / Finance
              </p>
              <h1 className="mt-5 text-4xl font-semibold tracking-tight md:text-6xl">
                Treasury Control
              </h1>
              <p className="mt-5 max-w-xl text-sm leading-7 text-white/55">
                Centro de supervisión de obligaciones comerciales,
                beneficiarios y trazabilidad financiera.
              </p>
            </div>
            <div className="border border-white/20 px-4 py-3 text-right">
              <p className="text-[9px] uppercase tracking-widest text-white/40">
                Perfil autorizado
              </p>
              <p className="mt-2 text-sm font-medium text-[#c9a77b]">
                {role}
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-white/15 pt-6">
            <p className="text-xs text-[#c9a77b]">
              MODO CONSULTA · Sin ejecución de pagos
            </p>
          </div>
        </section>

        <section className="mt-10" aria-labelledby="treasury-summary">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">
                01 / Situación financiera
              </p>
              <h2 id="treasury-summary" className="mt-2 text-2xl font-semibold">
                Obligaciones comerciales
              </h2>
            </div>
            <span className="text-[10px] text-black/45">
              Datos de módulos existentes
            </span>
          </div>

          {financial.status === "loading" && (
            <div className="border border-black/10 bg-white p-8 text-sm">
              Consultando información financiera...
            </div>
          )}

          {financial.status === "error" && (
            <div role="alert" className="border border-black/20 bg-white p-8">
              <p className="font-semibold">Información no disponible</p>
              <p className="mt-2 text-sm text-black/60">{financial.message}</p>
            </div>
          )}

          {financial.status === "ready" && (
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {[
                ["Liquidaciones pendientes", String(financial.data.pendingSettlements), "Estado READY"],
                ["Valor pendiente", new Intl.NumberFormat("es-CO", {
                  style: "currency",
                  currency: "COP",
                  maximumFractionDigits: 0,
                }).format(financial.data.pendingAmount), "Comisiones de liquidaciones READY"],
                ["Comisiones incluidas", String(financial.data.commissions), "Agrupadas en obligaciones"],
                ["Con cuenta verificada", String(financial.data.payoutReady), "Liquidaciones con cuenta activa validada"],
                ["Cuentas por verificar", String(financial.data.accountsToVerify), "Cuentas activas no verificadas"],
              ].map(([label, value, detail]) => (
                <div key={label} className="border border-black/10 bg-white p-6">
                  <p className="text-xs text-black/50">{label}</p>
                  <p className="mt-5 break-words text-3xl font-semibold tabular-nums">
                    {value}
                  </p>
                  <p className="mt-3 text-xs text-black/45">{detail}</p>
                </div>
              ))}
            </div>
          )}
        </section>
        {financial.status === "ready" && (
          <section className="mt-12" aria-labelledby="treasury-obligations">
            <div className="mb-5">
              <p className="text-[10px] uppercase tracking-[0.2em] text-black/40">
                02 / Registro de obligaciones
              </p>
              <h2
                id="treasury-obligations"
                className="mt-2 text-2xl font-semibold"
              >
                Bandeja de liquidaciones
              </h2>
              <p className="mt-2 text-sm text-black/50">
                Obligaciones comerciales en estado READY. Consulta sin ejecución de pagos.
              </p>
            </div>

            {financial.settlements.length === 0 ? (
              <div className="border border-black/10 bg-white p-8 text-sm text-black/60">
                No existen liquidaciones READY en la consulta actual.
              </div>
            ) : (
              <div className="overflow-x-auto border border-black/10 bg-white">
                <table className="w-full min-w-[760px] text-left text-sm">
                  <thead className="border-b border-black/10 bg-black/[0.03]">
                    <tr className="text-[10px] uppercase tracking-wider text-black/50">
                      <th className="px-5 py-4 font-medium">Referencia</th>
                      <th className="px-5 py-4 font-medium">Beneficiario</th>
                      <th className="px-5 py-4 font-medium">Comisiones</th>
                      <th className="px-5 py-4 font-medium">Valor COP</th>
                      <th className="px-5 py-4 font-medium">Cuenta</th>
                    </tr>
                  </thead>
                  <tbody>
                    {financial.settlements.map((settlement) => (
                      <tr
                        key={settlement.id}
                        className="border-b border-black/5 last:border-b-0"
                      >
                        <td className="px-5 py-5 font-medium">
                          {settlement.reference}
                        </td>
                        <td className="px-5 py-5">
                          {settlement.partner?.name ?? "Sin beneficiario asociado"}
                          {settlement.partner?.code && (
                            <p className="mt-1 text-xs text-black/40">
                              {settlement.partner.code}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-5 tabular-nums">
                          {settlement.commissionCount}
                        </td>
                        <td className="px-5 py-5 font-semibold tabular-nums">
                          {new Intl.NumberFormat("es-CO", {
                            style: "currency",
                            currency: "COP",
                            maximumFractionDigits: 0,
                          }).format(settlement.commissionAmount)}
                        </td>
                        <td className="px-5 py-5">
                          {settlement.payoutReady ? (
                            <>
                              <span className="font-medium">Verificada</span>
                              <p className="mt-1 text-xs text-black/50">
                                {settlement.payoutAccount?.bank_name ?? "Entidad no indicada"}
                                {settlement.payoutAccount?.account_last4
                                  ? ` · ****${settlement.payoutAccount.account_last4}`
                                  : ""}
                              </p>
                            </>
                          ) : (
                            <span className="text-black/55">
                              Sin cuenta activa verificada
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
        <section className="mt-10 grid gap-4 md:grid-cols-2">
          {modules.map((module) => (
            <div
              key={module.number}
              className="border border-black/10 bg-white p-8"
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] tracking-[0.2em] text-black/35">
                  {module.number} / {module.category}
                </span>
                <span className="text-[10px] uppercase tracking-widest text-black/35">
                  CONSULTA
                </span>
              </div>
              <h2 className="mt-10 text-2xl font-semibold">
                {module.title}
              </h2>
              <p className="mt-4 max-w-sm text-sm leading-6 text-black/55">
                {module.description}
              </p>
            </div>
          ))}
        </section>

        <section className="mt-6 grid gap-4 md:grid-cols-3">
          {[
            ["01", "Obligación", "Liquidación comercial registrada"],
            ["02", "Verificación", "Beneficiario y cuenta de destino"],
            ["03", "Trazabilidad", "Registro documental y auditoría"],
          ].map(([number, title, description]) => (
            <div
              key={number}
              className="border border-black/10 p-6"
            >
              <p className="text-[10px] tracking-widest text-black/35">
                ETAPA {number}
              </p>
              <h3 className="mt-5 font-semibold">{title}</h3>
              <p className="mt-2 text-xs leading-5 text-black/50">
                {description}
              </p>
            </div>
          ))}
        </section>

        <footer className="mt-12 border-t border-black/10 pt-6 text-[10px] uppercase tracking-[0.15em] text-black/40">
          Wolves Territory · Control financiero institucional
        </footer>
      </div>
    </main>
  );
}
