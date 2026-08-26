"use client";

import {
  FormEvent,
  useState,
} from "react";

import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

export default function SellerResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] =
    useState("");

  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [showPassword, setShowPassword] =
    useState(false);

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

    if (password.length < 8) {
      setError(
        "La contraseña debe tener mínimo 8 caracteres."
      );
      return;
    }

    if (password !== confirmPassword) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    setLoading(true);

    try {
      const supabase =
        getSupabaseBrowser();

      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
          password,
        });

      if (updateError) {
        throw updateError;
      }

      setSuccess(true);

      setTimeout(() => {
        router.replace(
          "/seller/login"
        );
      }, 1800);

    } catch (error) {
      console.error(
        "SELLER PASSWORD UPDATE ERROR:",
        error
      );

      setError(
        "El enlace puede haber expirado. Solicita uno nuevo e inténtalo nuevamente."
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
          Nueva
          <br />
          contraseña.
        </h1>

        <p className="mt-6 max-w-sm text-sm leading-7 text-[#101820]/50">
          Define una nueva contraseña para acceder
          nuevamente a tu territorio.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-10 space-y-5"
        >

          {/* PASSWORD */}

          <div>

            <label
              htmlFor="password"
              className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#101820]/45"
            >
              Nueva contraseña
            </label>

            <div className="relative">

              <input
                id="password"
                type={
                  showPassword
                    ? "text"
                    : "password"
                }
                value={password}
                onChange={(event) =>
                  setPassword(
                    event.target.value
                  )
                }
                required
                autoComplete="new-password"
                placeholder="Mínimo 8 caracteres"
                className="h-14 w-full border border-[#101820]/15 bg-white/30 px-4 pr-14 text-sm outline-none transition placeholder:text-[#101820]/25 focus:border-[#187E83]"
              />

              <button
                type="button"
                onClick={() =>
                  setShowPassword(
                    (current) => !current
                  )
                }
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[#101820]/40 transition hover:text-[#101820]"
                aria-label={
                  showPassword
                    ? "Ocultar contraseña"
                    : "Mostrar contraseña"
                }
              >
                {showPassword
                  ? "Ocultar"
                  : "Ver"}
              </button>

            </div>

          </div>

          {/* CONFIRM PASSWORD */}

          <div>

            <label
              htmlFor="confirmPassword"
              className="mb-3 block text-[9px] font-semibold uppercase tracking-[0.22em] text-[#101820]/45"
            >
              Confirmar contraseña
            </label>

            <input
              id="confirmPassword"
              type={
                showPassword
                  ? "text"
                  : "password"
              }
              value={confirmPassword}
              onChange={(event) =>
                setConfirmPassword(
                  event.target.value
                )
              }
              required
              autoComplete="new-password"
              placeholder="Repite tu contraseña"
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
                Contraseña actualizada correctamente.
                Te estamos llevando al Portal Seller.
              </p>

            </div>
          )}

          <button
            type="submit"
            disabled={
              loading ||
              success
            }
            className="group flex w-full items-center justify-between bg-[#101820] px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.26em] text-white transition hover:bg-[#187E83] disabled:cursor-not-allowed disabled:opacity-40"
          >
            {loading
              ? "Actualizando..."
              : "Guardar contraseña"}

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