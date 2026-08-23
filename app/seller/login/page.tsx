"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function SellerLoginPage() {
  const router = useRouter();

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
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
        await supabase.auth.signInWithPassword({
          email: email.trim(),
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
       * Confirmamos además que este usuario
       * pertenece a un partner activo.
       *
       * La RLS que creamos garantiza
       * que solo pueda leer su propia fila.
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
        .eq("active", true)
        .maybeSingle();

      if (partnerError) {
        throw partnerError;
      }

      if (
        !partner ||
        partner.type !== "SELLER"
      ) {
        await supabase.auth.signOut();

        throw new Error(
          "Tu usuario no tiene acceso al Portal Seller."
        );
      }

      router.push("/seller");
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
    <main className="min-h-screen bg-black text-white">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-2">

        {/* BRAND */}
        <section className="relative hidden overflow-hidden border-r border-white/10 lg:flex lg:flex-col lg:justify-between lg:p-16">
          <div className="absolute inset-0 bg-gradient-to-br from-[#171717] via-black to-black" />

          <div className="relative z-10">
            <p className="text-[10px] uppercase tracking-[0.4em] text-[#c9a96e]">
              Wolves Territory
            </p>

            <p className="mt-3 text-[9px] uppercase tracking-[0.3em] text-white/35">
              Seller Network
            </p>
          </div>

          <div className="relative z-10 max-w-xl">
            <h1 className="text-6xl font-semibold uppercase leading-[0.9] tracking-[-0.05em]">
              Your
              <br />
              Territory.
            </h1>

            <p className="mt-8 max-w-md text-sm leading-7 text-white/45">
              Accede a tus ventas, comisiones,
              enlace personal y rendimiento dentro
              de la red comercial Wolves Territory.
            </p>
          </div>

          <div className="relative z-10 text-[9px] uppercase tracking-[0.3em] text-white/25">
            Colombia · 2026
          </div>
        </section>

        {/* LOGIN */}
        <section className="flex min-h-screen items-center justify-center bg-[#f2f0eb] px-6 py-16 text-black md:px-12">
          <div className="w-full max-w-md">

            <div className="lg:hidden">
              <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#9b7a43]">
                Wolves Territory
              </p>
            </div>

            <p className="mt-8 text-[9px] uppercase tracking-[0.3em] text-black/35 lg:mt-0">
              Seller Portal
            </p>

            <h2 className="mt-4 text-4xl font-semibold uppercase tracking-[-0.04em] md:text-5xl">
              Welcome
              <br />
              Back.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-6 text-black/45">
              Ingresa con las credenciales
              asignadas por Wolves Territory.
            </p>

            <form
              onSubmit={handleSubmit}
              className="mt-10 space-y-5"
            >
              <div>
                <label
                  htmlFor="email"
                  className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.24em] text-black/45"
                >
                  Email
                </label>

                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(event) =>
                    setEmail(
                      event.target.value
                    )
                  }
                  className="h-14 w-full border border-black/15 bg-transparent px-4 text-base outline-none transition focus:border-black"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.24em] text-black/45"
                >
                  Password
                </label>

                <input
                  id="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(event) =>
                    setPassword(
                      event.target.value
                    )
                  }
                  className="h-14 w-full border border-black/15 bg-transparent px-4 text-base outline-none transition focus:border-black"
                  placeholder="••••••••"
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
                disabled={loading}
                className="group flex w-full items-center justify-between bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? "Entering..."
                  : "Enter Seller Portal"}

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </button>
            </form>

            <div className="mt-10 border-t border-black/10 pt-6">
              <p className="text-[9px] leading-5 tracking-[0.08em] text-black/35">
                Acceso exclusivo para vendedores
                autorizados de Wolves Territory.
              </p>
            </div>

          </div>
        </section>

      </div>
    </main>
  );
}