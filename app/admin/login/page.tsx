"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

export default function AdminLoginPage() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");
    setLoading(true);

    try {
      const supabase = getSupabaseBrowser();

      const {
        data,
        error: signInError,
      } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password,
      });

      if (signInError || !data.user) {
        throw new Error("Credenciales administrativas inválidas.");
      }

      const {
        data: admin,
        error: adminError,
      } = await supabase
        .from("admin_users")
        .select(`
          id,
          full_name,
          role,
          active
        `)
        .eq("auth_user_id", data.user.id)
        .maybeSingle();

      if (
        adminError ||
        !admin ||
        !admin.active
      ) {
        await supabase.auth.signOut();

        throw new Error(
          "Este usuario no tiene acceso administrativo."
        );
      }

      router.replace("/admin");
      router.refresh();
    } catch (error) {
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
    <main className="flex min-h-screen bg-black text-white">
      <div className="m-auto w-full max-w-md px-6 py-16">

        <p className="text-[9px] uppercase tracking-[0.35em] text-[#c9a96e]">
          Wolves Territory
        </p>

        <p className="mt-3 text-[8px] uppercase tracking-[0.28em] text-white/30">
          Administration
        </p>

        <h1 className="mt-10 text-5xl font-semibold uppercase leading-[0.9] tracking-[-0.055em]">
          Territory
          <br />
          Control.
        </h1>

        <p className="mt-7 text-sm leading-7 text-white/45">
          Acceso exclusivo para administración y operación
          autorizada de Wolves Territory.
        </p>

        <form
          onSubmit={handleSubmit}
          className="mt-12 space-y-5"
        >
          <input
            type="email"
            value={email}
            onChange={(event) =>
              setEmail(event.target.value)
            }
            placeholder="Correo administrativo"
            autoComplete="email"
            required
            className="h-14 w-full border border-white/15 bg-transparent px-4 text-sm outline-none transition focus:border-white/50"
          />

          <input
            type="password"
            value={password}
            onChange={(event) =>
              setPassword(event.target.value)
            }
            placeholder="Contraseña"
            autoComplete="current-password"
            required
            className="h-14 w-full border border-white/15 bg-transparent px-4 text-sm outline-none transition focus:border-white/50"
          />

          {error && (
            <div className="border border-red-500/20 bg-red-500/5 p-4">
              <p className="text-xs leading-5 text-red-300">
                {error}
              </p>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-between bg-white px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-black transition hover:bg-[#c9a96e] disabled:opacity-40"
          >
            {loading
              ? "Verificando..."
              : "Entrar al Territory"}

            <span>→</span>
          </button>
        </form>
      </div>
    </main>
  );
}