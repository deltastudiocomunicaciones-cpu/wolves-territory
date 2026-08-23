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

type ActivationState =
  | "checking"
  | "ready"
  | "success"
  | "invalid";

export default function SellerActivatePage() {
  const router =
    useRouter();


  const [
    state,
    setState,
  ] =
    useState<ActivationState>(
      "checking"
    );

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] =
    useState("");

  const [
    loading,
    setLoading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  /* =====================================================
   * RECUPERAR SESIÓN DE INVITACIÓN
   * ===================================================== */

 useEffect(() => {
  async function prepareActivation() {
    try {
      const supabase =
        getSupabaseBrowser();

      /*
       * Supabase puede regresar
       * la invitación con ?code=...
       *
       * Lo leemos directamente
       * desde el navegador para evitar
       * conflictos de prerender en Next.js.
       */
      const params =
        new URL(
          window.location.href
        ).searchParams;

      const code =
        params.get("code");

      if (code) {
        const {
          error:
            exchangeError,
        } =
          await supabase.auth
            .exchangeCodeForSession(
              code
            );

        if (
          exchangeError
        ) {
          console.error(
            "INVITE CODE EXCHANGE ERROR:",
            exchangeError
          );
        }
      }

      /*
       * Confirmamos que exista
       * una sesión válida antes
       * de permitir establecer
       * la contraseña.
       */
      const {
        data,
        error:
          sessionError,
      } =
        await supabase.auth
          .getSession();

      if (
        sessionError ||
        !data.session
      ) {
        setState(
          "invalid"
        );

        return;
      }

      setState(
        "ready"
      );
    } catch (error) {
      console.error(
        "SELLER ACTIVATION ERROR:",
        error
      );

      setState(
        "invalid"
      );
    }
  }

  prepareActivation();
}, []);

  /* =====================================================
   * DEFINIR CONTRASEÑA
   * ===================================================== */

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    if (
      password.length < 8
    ) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Las contraseñas no coinciden."
      );

      return;
    }

    try {
      setLoading(true);

      const supabase =
        getSupabaseBrowser();

      const {
        error:
          updateError,
      } =
        await supabase.auth
          .updateUser({
            password,
          });

      if (updateError) {
        throw updateError;
      }

      setState(
        "success"
      );

      setTimeout(() => {
        router.replace(
          "/seller"
        );

        router.refresh();
      }, 1200);
    } catch (error) {
      console.error(
        "SELLER PASSWORD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible activar tu cuenta."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =====================================================
   * CHECKING
   * ===================================================== */

  if (
    state === "checking"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Preparing Territory...
        </p>

      </main>
    );
  }

  /* =====================================================
   * INVALID
   * ===================================================== */

  if (
    state === "invalid"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">

        <div className="max-w-md text-center">

          <p className="text-[9px] uppercase tracking-[0.35em] text-[#c9a96e]">
            Wolves Territory
          </p>

          <h1 className="mt-7 text-4xl font-semibold uppercase tracking-[-0.04em]">
            Invitación
            <br />
            no válida.
          </h1>

          <p className="mt-6 text-sm leading-7 text-white/50">
            El enlace puede haber
            expirado o ya haber sido
            utilizado. Solicita una
            nueva invitación al equipo
            Wolves Territory.
          </p>

        </div>

      </main>
    );
  }

  /* =====================================================
   * SUCCESS
   * ===================================================== */

  if (
    state === "success"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">

        <div className="max-w-md text-center">

          <p className="text-[9px] uppercase tracking-[0.35em] text-[#c9a96e]">
            Wolves Territory
          </p>

          <h1 className="mt-7 text-5xl font-semibold uppercase leading-[0.92] tracking-[-0.05em]">
            Welcome
            <br />
            to the Territory.
          </h1>

          <p className="mt-7 text-sm leading-7 text-white/50">
            Tu cuenta Seller fue
            activada correctamente.
          </p>

        </div>

      </main>
    );
  }

  /* =====================================================
   * FORM
   * ===================================================== */

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      <div className="mx-auto grid min-h-screen max-w-[1500px] lg:grid-cols-2">

        {/* BRAND */}

        <section className="hidden bg-black px-14 py-16 text-white lg:flex lg:flex-col lg:justify-between">

          <div>

            <p className="text-[9px] uppercase tracking-[0.35em] text-[#c9a96e]">
              Wolves Territory
            </p>

            <p className="mt-3 text-[8px] uppercase tracking-[0.28em] text-white/30">
              Seller Network
            </p>

          </div>

          <div>

            <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
              Your Territory
            </p>

            <h1 className="mt-5 text-6xl font-semibold uppercase leading-[0.9] tracking-[-0.055em]">
              Activa
              <br />
              tu acceso.
            </h1>

            <p className="mt-8 max-w-md text-sm leading-7 text-white/50">
              Define tu contraseña
              personal para acceder a
              tus ventas, comisiones,
              liquidaciones y enlace
              referral.
            </p>

          </div>

          <p className="text-[8px] uppercase tracking-[0.25em] text-white/25">
            Wolves Territory · Colombia
          </p>

        </section>

        {/* FORM */}

        <section className="flex items-center justify-center px-6 py-16 md:px-12">

          <div className="w-full max-w-md">

            <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
              Seller Activation
            </p>

            <h2 className="mt-4 text-4xl font-semibold uppercase tracking-[-0.045em] md:text-5xl">
              Crea tu
              <br />
              contraseña.
            </h2>

            <p className="mt-5 text-sm leading-7 text-black/45">
              Esta contraseña será
              personal y te permitirá
              acceder al Seller Portal.
            </p>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-10 space-y-5"
            >

              <div>

                <label className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.24em] text-black/45">
                  Contraseña
                </label>

                <input
                  type="password"
                  value={
                    password
                  }
                  onChange={(
                    event
                  ) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  required
                  className="h-14 w-full border border-black/15 bg-transparent px-4 text-base outline-none transition focus:border-black"
                  placeholder="Mínimo 8 caracteres"
                />

              </div>

              <div>

                <label className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.24em] text-black/45">
                  Confirmar contraseña
                </label>

                <input
                  type="password"
                  value={
                    confirmPassword
                  }
                  onChange={(
                    event
                  ) =>
                    setConfirmPassword(
                      event.target.value
                    )
                  }
                  autoComplete="new-password"
                  required
                  className="h-14 w-full border border-black/15 bg-transparent px-4 text-base outline-none transition focus:border-black"
                  placeholder="Repite tu contraseña"
                />

              </div>

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 p-4">

                  <p className="text-xs leading-5 text-red-700">
                    {error}
                  </p>

                </div>
              )}

              <button
                type="submit"
                disabled={
                  loading
                }
                className="group flex w-full items-center justify-between bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Activando..."
                  : "Activar Seller Portal"}

                <span>
                  →
                </span>

              </button>

            </form>

          </div>

        </section>

      </div>

    </main>
  );
}