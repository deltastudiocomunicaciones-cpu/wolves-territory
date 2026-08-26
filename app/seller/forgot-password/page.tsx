"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

export default function SellerForgotPasswordPage() {
  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState(false);

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setSuccess(false);
    setLoading(true);

    try {
      const supabase =
        getSupabaseBrowser();

      const redirectTo =
        `${window.location.origin}/seller/reset-password`;

      const {
        error: resetError,
      } =
        await supabase.auth
          .resetPasswordForEmail(
            email
              .trim()
              .toLowerCase(),
            {
              redirectTo,
            }
          );

      if (resetError) {
        throw resetError;
      }

      setSuccess(true);
    } catch (error) {
      console.error(
        "SELLER PASSWORD RESET ERROR:",
        error
      );

      setError(
        "No fue posible procesar la solicitud. Intenta nuevamente."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#EEF2F3] px-6 text-[#101820]">

      <div className="w-full max-w-md">

        <p className="text-[9px] font-semibold uppercase tracking-[0.34em] text-[#187E83]">
          Wolves Territory
        </p>

        <p className="mt-3 text-[8px] uppercase tracking-[0.28em] text-[#101820]/35">
          Seller Network
        </p>

        <h1 className="mt-8 text-4xl font-semibold uppercase leading-[0.94] tracking-[-0.05em] md:text-5xl">
          Recupera
          <br />
          tu acceso.
        </h1>

        <p className="mt-6 max-w-sm text-sm leading-7 text-[#101820]/50">
          Ingresa el correo asociado a tu cuenta Seller.
          Te enviaremos un enlace para restablecer tu contraseña.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5"
        >

          <div>

            <label
              htmlFor="email"
              className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#101820]/45"
            >
              Email
            </label>

            <input
              id="email"
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(
                  event.target.value
                )
              }
              required
              autoComplete="email"
              placeholder="you@email.com"
              className="h-14 w-full border border-[#101820]/15 bg-white/30 px-4 text-sm outline-none transition placeholder:text-[#101820]/25 focus:border-[#187E83]"
            />

          </div>

          {error && (
            <div className="border border-red-500/20 bg-red-500/5 p-4">

              <p className="text-xs leading-5 text-red-700">
                {error}
              </p>

            </div>
          )}

          {success && (
            <div className="border border-emerald-500/20 bg-emerald-500/5 p-4">

              <p className="text-xs leading-6 text-emerald-700">
                Si el correo está asociado a una cuenta Seller,
                recibirás las instrucciones para restablecer tu contraseña.
              </p>

            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group flex w-full items-center justify-between bg-[#101820] px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-white transition hover:bg-[#187E83] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Enviando..."
              : "Enviar instrucciones"}

            <span className="transition-transform duration-300 group-hover:translate-x-1">
              →
            </span>
          </button>

        </form>

        <div className="mt-8 border-t border-[#101820]/10 pt-6">

          <Link
            href="/seller/login"
            className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#101820]/40 transition hover:text-[#187E83]"
          >
            ← Volver al login
          </Link>

        </div>

      </div>

    </main>
  );
}