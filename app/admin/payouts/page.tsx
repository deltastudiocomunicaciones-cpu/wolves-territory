"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type PayoutAccount = {
  id: string;
  partner_id: string;
  account_holder_name: string;
  account_holder_document_type: string | null;
  account_holder_document_number: string | null;
  bank_name: string | null;
  account_type: string | null;
  account_last4: string;
  verified: boolean;
  created_at: string;
};

type Partner = {
  id: string;
  code: string;
  name: string;
};

type PayoutRow = PayoutAccount & {
  partner?: Partner | null;
};

export default function AdminPayoutsPage() {
  const router = useRouter();

  const [accounts, setAccounts] =
    useState<PayoutRow[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [verifyingId, setVerifyingId] =
    useState<string | null>(null);

  const [error, setError] =
    useState("");

  const loadAccounts = useCallback(async () => {
  setLoading(true);
  setError("");

  try {
    const supabase =
      getSupabaseBrowser();

    /* ==========================================
     * 1. USUARIO AUTENTICADO
     * ========================================== */

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

    /* ==========================================
     * 2. VALIDAR ADMIN
     * ========================================== */

    const {
      data: admin,
      error: adminError,
    } = await supabase
      .from("admin_users")
      .select(
        `
        id,
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
      !admin ||
      !admin.active
    ) {
      await supabase.auth.signOut();

      router.replace(
        "/admin/login"
      );

      return;
    }

    /* ==========================================
     * 3. SESIÓN / TOKEN
     * ========================================== */

    const {
      data: sessionData,
      error: sessionError,
    } =
      await supabase.auth.getSession();

    const accessToken =
      sessionData.session
        ?.access_token;

    if (
      sessionError ||
      !accessToken
    ) {
      router.replace(
        "/admin/login"
      );

      return;
    }

    /* ==========================================
     * 4. API ADMIN SERVER-SIDE
     *
     * El navegador NO consulta directamente
     * partner_payout_accounts.
     * ========================================== */

    const response =
      await fetch(
        "/api/admin/payouts",
        {
          method: "GET",

          headers: {
            Authorization:
              `Bearer ${accessToken}`,
          },

          cache: "no-store",
        }
      );

    const data =
      await response.json();

    if (!response.ok) {
      console.error(
        "PAYOUT LOAD ERROR:",
        data
      );

      throw new Error(
        data.error ??
          "No fue posible cargar las cuentas pendientes."
      );
    }

    /* ==========================================
     * 5. ADAPTAR RESPUESTA AL FRONTEND
     * ========================================== */

    const mappedAccounts: PayoutRow[] =
      (
        data.accounts ?? []
      ).map(
        (account: {
          id: string;
          partnerId: string;

          accountHolderName: string;
          documentType: string | null;
          documentNumber: string | null;

          bankName: string | null;
          accountType: string | null;
          accountLast4: string;

          verified: boolean;
          createdAt: string;

          partner: {
            id: string;
            code: string;
            name: string;
          } | null;
        }) => ({
          id:
            account.id,

          partner_id:
            account.partnerId,

          account_holder_name:
            account.accountHolderName,

          account_holder_document_type:
            account.documentType,

          account_holder_document_number:
            account.documentNumber,

          bank_name:
            account.bankName,

          account_type:
            account.accountType,

          account_last4:
            account.accountLast4,

          verified:
            account.verified,

          created_at:
            account.createdAt,

          partner:
            account.partner,
        })
      );

    setAccounts(
      mappedAccounts
    );
  } catch (error) {
    console.error(
      "ADMIN PAYOUTS PAGE ERROR:",
      error
    );

    setError(
      error instanceof Error
        ? error.message
        : "No fue posible cargar las cuentas pendientes."
    );
  } finally {
    setLoading(false);
  }
}, [router]);

  useEffect(() => {
    loadAccounts();
  }, [loadAccounts]);

  async function verifyAccount(
    payoutAccountId: string
  ) {
    const confirmed =
      window.confirm(
        "¿Confirmas que revisaste los datos y deseas habilitar esta cuenta para recibir liquidaciones?"
      );

    if (!confirmed) {
      return;
    }

    setError("");
    setVerifyingId(payoutAccountId);

    try {
      const supabase =
        getSupabaseBrowser();

      const {
        data: sessionData,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (!accessToken) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(
        "/api/admin/payouts/verify",
        {
          method: "POST",
          headers: {
            "Content-Type":
              "application/json",
          },
          body: JSON.stringify({
            accessToken,
            payoutAccountId,
          }),
        }
      );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No fue posible verificar la cuenta."
        );
      }

      /*
       * Sale inmediatamente de
       * pendientes.
       */
      setAccounts((current) =>
        current.filter(
          (account) =>
            account.id !==
            payoutAccountId
        )
      );
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible verificar la cuenta."
      );
    } finally {
      setVerifyingId(null);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Payment Control...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      <header className="border-b border-black/10 px-6 py-5 md:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between">

          <div>
            <p className="text-[9px] font-semibold uppercase tracking-[0.34em]">
              Wolves Territory
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-black/35">
              Payment Control
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/admin")
            }
            className="text-[9px] uppercase tracking-[0.22em] text-black/40"
          >
            ← Territory Control
          </button>

        </div>
      </header>

      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">

        <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
          Seller Network · Finance
        </p>

        <div className="mt-4 flex items-end justify-between gap-8">

          <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.045em] md:text-6xl">
            Cuentas
            <br />
            por verificar.
          </h1>

          <p className="text-5xl font-semibold tracking-[-0.06em]">
            {accounts.length}
          </p>

        </div>

        {error && (
          <div className="mt-8 border border-red-500/20 bg-red-500/5 p-5">
            <p className="text-xs text-red-700">
              {error}
            </p>
          </div>
        )}

        {accounts.length === 0 ? (
          <div className="mt-14 border-y border-black/10 py-14">

            <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
              Payment Control
            </p>

            <h2 className="mt-4 text-2xl font-semibold uppercase">
              Todo al día.
            </h2>

            <p className="mt-4 max-w-lg text-sm leading-7 text-black/45">
              No existen cuentas bancarias pendientes de verificación.
            </p>

          </div>
        ) : (
          <div className="mt-14 space-y-4">

            {accounts.map((account) => (
              <article
                key={account.id}
                className="border border-black/10 bg-white/25 p-6 md:p-8"
              >

                <div className="grid gap-8 lg:grid-cols-[1fr_1fr_auto] lg:items-end">

                  <div>

                    <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
                      Seller
                    </p>

                    <h2 className="mt-3 text-xl font-semibold">
                      {account.partner?.name ??
                        "Seller"}
                    </h2>

                    <p className="mt-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                      {account.partner?.code ??
                        "—"}
                    </p>

                    <div className="mt-6">

                      <p className="text-[8px] uppercase tracking-[0.2em] text-black/30">
                        Titular
                      </p>

                      <p className="mt-2 text-sm">
                        {account.account_holder_name}
                      </p>

                      <p className="mt-1 text-xs text-black/40">
                        {account.account_holder_document_type ??
                          "Documento"}
                        {" · "}
                        {account.account_holder_document_number ??
                          "—"}
                      </p>

                    </div>

                  </div>

                  <div>

                    <p className="text-[8px] uppercase tracking-[0.25em] text-black/35">
                      Destino de pago
                    </p>

                    <p className="mt-3 text-lg font-semibold">
                      {account.bank_name}
                    </p>

                    <p className="mt-2 text-sm text-black/45">
                      {formatAccountType(
                        account.account_type
                      )}
                      {" · "}
                      •••• {account.account_last4}
                    </p>

                    <p className="mt-6 text-[9px] font-semibold uppercase tracking-[0.2em] text-amber-700">
                      ● Pendiente de verificación
                    </p>

                  </div>

                  <button
                    type="button"
                    disabled={
                      verifyingId === account.id
                    }
                    onClick={() =>
                      verifyAccount(account.id)
                    }
                    className="min-w-48 bg-black px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.22em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:opacity-40"
                  >
                    {verifyingId === account.id
                      ? "Verificando..."
                      : "Verificar cuenta"}
                  </button>

                </div>

              </article>
            ))}

          </div>
        )}

      </div>
    </main>
  );
}

function formatAccountType(
  value: string | null
) {
  switch (value) {
    case "SAVINGS":
      return "Cuenta de ahorros";

    case "CHECKING":
      return "Cuenta corriente";

    case "WALLET":
      return "Billetera digital";

    default:
      return value ?? "Cuenta";
  }
}