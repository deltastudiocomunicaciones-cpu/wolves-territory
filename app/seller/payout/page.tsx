"use client";

import {
  FormEvent,
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

type ExistingAccount = {
  id: string;
  bank_name: string | null;
  account_type: string | null;
  account_last4: string;
  verified: boolean;
};

export default function SellerPayoutPage() {
  const router =
    useRouter();

  const [
    account,
    setAccount,
  ] =
    useState<ExistingAccount | null>(
      null
    );

  const [
    loadingPage,
    setLoadingPage,
  ] =
    useState(true);

  const [
    saving,
    setSaving,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    success,
    setSuccess,
  ] =
    useState(false);

  /* =====================================================
   * CARGAR CUENTA EXISTENTE
   * ===================================================== */

  useEffect(() => {
    async function loadAccount() {
      const supabase =
        getSupabaseBrowser();

      const {
        data: userData,
      } =
        await supabase.auth.getUser();

      if (!userData.user) {
        router.replace(
          "/seller/login"
        );

        return;
      }

      /*
       * Por seguridad todavía no
       * permitimos lectura directa
       * del número de cuenta.
       *
       * Más adelante crearemos una
       * vista segura para mostrar
       * únicamente banco + últimos 4.
       */

      setLoadingPage(false);
    }

    loadAccount();
  }, [router]);

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const supabase =
      getSupabaseBrowser();

    const {
      data: sessionData,
    } =
      await supabase.auth
        .getSession();

    const accessToken =
      sessionData.session
        ?.access_token;

    if (!accessToken) {
      router.replace(
        "/seller/login"
      );

      return;
    }

    const payload = {
      accessToken,

      payoutMethod:
        "BANK_TRANSFER",

      accountHolderName:
        String(
          formData.get(
            "accountHolderName"
          ) ?? ""
        ).trim(),

      accountHolderDocumentType:
        String(
          formData.get(
            "documentType"
          ) ?? "CC"
        ),

      accountHolderDocumentNumber:
        String(
          formData.get(
            "documentNumber"
          ) ?? ""
        ).trim(),

      bankName:
        String(
          formData.get(
            "bankName"
          ) ?? ""
        ).trim(),

      accountType:
        String(
          formData.get(
            "accountType"
          ) ?? ""
        ),

      accountNumber:
        String(
          formData.get(
            "accountNumber"
          ) ?? ""
        ).trim(),

      confirmAccountNumber:
        String(
          formData.get(
            "confirmAccountNumber"
          ) ?? ""
        ).trim(),
    };

    try {
      setSaving(true);

      const response =
        await fetch(
          "/api/seller/payout",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify(
                payload
              ),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
            "No fue posible registrar la cuenta."
        );
      }

      setAccount(
        data.payoutAccount
      );

      setSuccess(true);

      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible registrar la cuenta."
      );
    } finally {
      setSaving(false);
    }
  }

  if (loadingPage) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">
        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Payment Profile...
        </p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      <header className="border-b border-black/10 px-6 py-5 md:px-10">

        <div className="mx-auto flex max-w-5xl items-center justify-between">

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
            onClick={() =>
              router.push(
                "/seller"
              )
            }
            className="text-[9px] uppercase tracking-[0.22em] text-black/40"
          >
            Volver
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-5xl px-6 py-14 md:px-10 lg:py-20">

        <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
          Payment Profile
        </p>

        <h1 className="mt-4 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.045em] md:text-6xl">
          Configura
          <br />
          tus pagos.
        </h1>

        <p className="mt-6 max-w-xl text-sm leading-7 text-black/45">
          Registra la cuenta donde deseas
          recibir las liquidaciones de tus
          comisiones. Wolves Territory
          verificará la información antes
          de habilitar pagos.
        </p>

        {account && (
          <div className="mt-10 border border-black/10 p-6">

            <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
              Cuenta registrada
            </p>

            <p className="mt-3 text-lg font-semibold">
              {account.bank_name}
            </p>

            <p className="mt-2 text-sm text-black/50">
              {account.account_type}
              {" · "}
              •••• {account.account_last4}
            </p>

            <p
              className={`mt-4 text-[9px] font-semibold uppercase tracking-[0.2em] ${
                account.verified
                  ? "text-emerald-700"
                  : "text-amber-700"
              }`}
            >
              {account.verified
                ? "✓ Cuenta verificada"
                : "● Pendiente de verificación"}
            </p>

          </div>
        )}

        <form
          onSubmit={
            handleSubmit
          }
          className="mt-12 max-w-2xl space-y-8"
        >

          <div>

            <SectionLabel>
              Titular
            </SectionLabel>

            <Input
              name="accountHolderName"
              placeholder="Nombre completo del titular"
              required
            />

            <div className="mt-4 grid gap-4 md:grid-cols-[0.3fr_0.7fr]">

              <select
                name="documentType"
                defaultValue="CC"
                className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              >
                <option value="CC">
                  CC
                </option>

                <option value="CE">
                  CE
                </option>

                <option value="NIT">
                  NIT
                </option>
              </select>

              <Input
                name="documentNumber"
                placeholder="Documento del titular"
                required
              />

            </div>

          </div>

          <div className="border-t border-black/10 pt-8">

            <SectionLabel>
              Entidad financiera
            </SectionLabel>

            <Input
              name="bankName"
              placeholder="Banco"
              required
            />

            <div className="mt-4">

              <select
                name="accountType"
                defaultValue=""
                required
                className="h-14 w-full border border-black/15 bg-transparent px-4 text-sm outline-none focus:border-black"
              >
                <option
                  value=""
                  disabled
                >
                  Tipo de cuenta
                </option>

                <option value="SAVINGS">
                  Ahorros
                </option>

                <option value="CHECKING">
                  Corriente
                </option>

              </select>

            </div>

          </div>

          <div className="border-t border-black/10 pt-8">

            <SectionLabel>
              Número de cuenta
            </SectionLabel>

            <Input
              name="accountNumber"
              placeholder="Número de cuenta"
              required
            />

            <div className="mt-4">

              <Input
                name="confirmAccountNumber"
                placeholder="Confirma el número de cuenta"
                required
              />

            </div>

          </div>

          {error && (
            <div className="border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-xs text-red-700">
                {error}
              </p>

            </div>
          )}

          {success && (
            <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">

              <p className="text-xs text-emerald-700">
                Información registrada.
                Tu cuenta está pendiente
                de verificación.
              </p>

            </div>
          )}

          <button
            type="submit"
            disabled={
              saving
            }
            className="flex w-full items-center justify-between bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:opacity-40"
          >
            {saving
              ? "Guardando..."
              : "Registrar cuenta"}

            <span>
              →
            </span>

          </button>

        </form>

      </div>

    </main>
  );
}

function Input({
  name,
  placeholder,
  required = false,
}: {
  name: string;
  placeholder: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type="text"
      placeholder={
        placeholder
      }
      required={
        required
      }
      className="h-14 w-full border border-black/15 bg-transparent px-4 text-sm outline-none transition focus:border-black"
    />
  );
}

function SectionLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.25em]">
      {children}
    </p>
  );
}