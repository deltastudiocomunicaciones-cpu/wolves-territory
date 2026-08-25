"use client";

import {
  FormEvent,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

export default function SellerLoginPage() {
  const router =
    useRouter();

  const [
    email,
    setEmail,
  ] =
    useState("");

  const [
    password,
    setPassword,
  ] =
    useState("");

  const [showPassword, setShowPassword] =
  useState(false);  

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

  async function handleSubmit(
    event:
      FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const supabase =
        getSupabaseBrowser();

      const {
        data,
        error: signInError,
      } =
        await supabase.auth
          .signInWithPassword({
            email:
              email.trim(),
            password,
          });

      if (signInError) {
        throw signInError;
      }

      if (!data.user) {
        throw new Error(
          "No fue posible iniciar sesión."
        );
      }

      /*
       * Confirmamos que este usuario
       * pertenece a un Seller activo.
       *
       * RLS garantiza que únicamente
       * pueda leer su propio partner.
       */

      const {
        data: partner,
        error: partnerError,
      } = await supabase
        .from("partners")
        .select(
          `
          id,
          code,
          name,
          type,
          mode,
          commission_rate,
          active
          `
        )
        .eq(
          "active",
          true
        )
        .maybeSingle();

      if (partnerError) {
        throw partnerError;
      }

      if (
        !partner ||
        partner.type !==
          "SELLER"
      ) {
        await supabase.auth.signOut();

        throw new Error(
          "Tu usuario no tiene acceso al Portal Seller."
        );
      }

      router.push(
        "/seller"
      );

      router.refresh();
    } catch (error) {
      console.error(
        "SELLER LOGIN ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "No fue posible iniciar sesión."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#EEF2F3] text-[#101820]">

      <div className="mx-auto grid min-h-screen max-w-[1800px] lg:grid-cols-[1fr_1fr]">

        {/* =================================================
            EDITORIAL IMAGE
        ================================================= */}

        <section className="relative min-h-[55vh] overflow-hidden bg-[#101820] lg:min-h-screen">

          <img
            src="/images/seller/seller-login-hero.png"
            alt="Wolves Territory Seller Portal"
            className="absolute inset-0 h-full w-full object-cover object-[80%_05%]"
          />

          {/* OVERLAY */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/70 via-[#101820]/10 to-transparent" />

          {/* BRAND */}

          <div className="absolute left-6 top-8 z-10 md:left-10 md:top-10 lg:left-14 lg:top-14">

            <p className="text-[9px] font-semibold uppercase tracking-[0.36em] text-white">
              Wolves Territory
            </p>

            <p className="mt-2 text-[8px] uppercase tracking-[0.3em] text-white/45">
              Comunidad de vendedores
            </p>

          </div>

          {/* MESSAGE */}

          <div className="absolute bottom-8 left-6 right-6 z-10 text-white md:bottom-10 md:left-10 md:right-10 lg:bottom-14 lg:left-14 lg:right-14">

            <p className="text-[8px] uppercase tracking-[0.3em] text-[#83C8C5]">
              Tu Territorio
            </p>

            <h1 className="mt-4 max-w-xl text-4xl font-semibold uppercase leading-[0.9] tracking-[-0.055em] md:text-5xl lg:text-6xl">
              Construye.
              <br />
              Comparte.
              <br />
              Crece.
            </h1>

            <p className="mt-7 max-w-md text-sm leading-7 text-white/55">
              Accede a tus ventas,
              comisiones, liquidaciones
              y herramientas dentro de
              la red comercial Wolves
              Territory.
            </p>

            <div className="mt-8 flex items-center justify-between border-t border-white/20 pt-5">

              <p className="text-[7px] uppercase tracking-[0.24em] text-white/35">
                Portal para vendedores
              </p>

              <p className="text-[7px] uppercase tracking-[0.24em] text-white/35">
                Colombia
              </p>

            </div>

          </div>

        </section>

        {/* =================================================
            LOGIN · ICE
        ================================================= */}

        <section className="flex min-h-[70vh] items-center justify-center bg-[#EEF2F3] px-6 py-16 text-[#101820] md:px-12 lg:min-h-screen">

          <div className="w-full max-w-md">

            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#187E83]">
              Portal para vendedores
            </p>

            <h2 className="mt-5 text-4xl font-semibold uppercase leading-[0.94] tracking-[-0.05em] md:text-5xl">
              Bienvenido
              <br />
              Lobo.
            </h2>

            <p className="mt-6 max-w-sm text-sm leading-7 text-[#101820]/50">
              Ingresa con las credenciales
              de tu cuenta Wolves Territory
              Seller.
            </p>

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-10 space-y-5"
            >

              {/* EMAIL */}

              <div>

                <label
                  htmlFor="email"
                  className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.24em] text-[#101820]/45"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={
                    email
                  }
                  onChange={(
                    event
                  ) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  placeholder="you@email.com"
                  className="h-14 w-full border border-[#101820]/15 bg-white/30 px-4 text-base outline-none transition placeholder:text-[#101820]/25 focus:border-[#187E83]"
                />

              </div>

              {/* PASSWORD */}

              <div>
  <label
    htmlFor="password"
    className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.24em] text-[#101820]/45"
  >
    Password
  </label>

  <div className="relative">
    <input
      id="password"
      type={showPassword ? "text" : "password"}
      autoComplete="current-password"
      required
      value={password}
      onChange={(event) =>
        setPassword(event.target.value)
      }
      placeholder="••••••••"
      className="h-14 w-full border border-[#101820]/15 bg-white/30 px-4 pr-12 text-base outline-none transition placeholder:text-[#101820]/25 focus:border-[#187E83]"
    />

    <button
      type="button"
      onClick={() =>
        setShowPassword((current) => !current)
      }
      aria-label={
        showPassword
          ? "Ocultar contraseña"
          : "Mostrar contraseña"
      }
      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#101820]/40 transition hover:text-[#101820]"
    >
      {showPassword ? (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M3 3l18 18" />
          <path d="M10.6 10.6a2 2 0 0 0 2.8 2.8" />
          <path d="M9.9 4.2A10.7 10.7 0 0 1 12 4c5.5 0 9 5 9 8a10.5 10.5 0 0 1-2.1 3.6" />
          <path d="M6.6 6.6C4.3 8 3 10.3 3 12c0 3 3.5 8 9 8a10.5 10.5 0 0 0 4.1-.8" />
        </svg>
      ) : (
        <svg
          width="19"
          height="19"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M2.5 12s3.5-7 9.5-7 9.5 7 9.5 7-3.5 7-9.5 7-9.5-7-9.5-7Z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      )}
    </button>
  </div>
</div>

              {/* ERROR */}

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 p-4">

                  <p className="text-xs leading-5 text-red-700">
                    {error}
                  </p>

                </div>
              )}

              {/* BUTTON */}

              <button
                type="submit"
                disabled={
                  loading
                }
                className="group flex w-full items-center justify-between bg-[#101820] px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition duration-300 hover:bg-[#187E83] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Entering..."
                  : "Entra la Portal vendedor"}

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>

              </button>

            </form>

            {/* FOOTER */}

            <div className="mt-10 border-t border-[#101820]/10 pt-6">

              <p className="text-[9px] leading-5 tracking-[0.08em] text-[#101820]/35">
                Acceso exclusivo para
                vendedores autorizados
                de Wolves Territory.
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}