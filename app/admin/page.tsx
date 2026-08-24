"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

/* =========================================================
 * TYPES
 * ========================================================= */

type AdminProfile = {
  full_name: string;
  role: string;
};

type Metrics = {
  applications: number;
  payouts: number;
  settlements: number;
};

/* =========================================================
 * PAGE
 * ========================================================= */

export default function AdminPage() {
  const router =
    useRouter();

  const [
    admin,
    setAdmin,
  ] =
    useState<AdminProfile | null>(
      null
    );

  const [
    metrics,
    setMetrics,
  ] =
    useState<Metrics>({
      applications: 0,
      payouts: 0,
      settlements: 0,
    });

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  /* =======================================================
   * LOAD ADMIN
   * ======================================================= */

  useEffect(() => {
    async function loadAdmin() {
      try {
        const supabase =
          getSupabaseBrowser();

        /* -----------------------------------------------
         * USER
         * ----------------------------------------------- */

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

        /* -----------------------------------------------
         * ADMIN PROFILE
         * ----------------------------------------------- */

        const {
          data: adminData,
          error: adminError,
        } = await supabase
          .from("admin_users")
          .select(
            `
            full_name,
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
          !adminData ||
          !adminData.active
        ) {
          await supabase.auth.signOut();

          router.replace(
            "/admin/login"
          );

          return;
        }

        setAdmin({
          full_name:
            adminData.full_name,

          role:
            adminData.role,
        });

        /* -----------------------------------------------
         * SESSION TOKEN
         * ----------------------------------------------- */

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

        /* -----------------------------------------------
         * ADMIN METRICS
         *
         * Ya no consultamos directamente
         * tablas sensibles desde navegador.
         * ----------------------------------------------- */

        const [
  applicationsResponse,
  payoutsResponse,
  settlementsResponse,
] = await Promise.all([
  fetch(
    "/api/admin/applications",
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  ),

  fetch(
    "/api/admin/payouts",
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  ),

  fetch(
    "/api/admin/settlements",
    {
      method: "GET",
      headers: {
        Authorization:
          `Bearer ${accessToken}`,
      },
      cache: "no-store",
    }
  ),
]);
const [
  applicationsData,
  payoutsData,
  settlementsData,
] =
  await Promise.all([
    applicationsResponse.json(),
    payoutsResponse.json(),
    settlementsResponse.json(),
  ]);

        /* -----------------------------------------------
         * APPLICATION COUNT
         * ----------------------------------------------- */

        const applicationsCount =
          applicationsResponse.ok
            ? (
                applicationsData.applications ??
                []
              ).filter(
                (
                  application: {
                    status: string;
                  }
                ) =>
                  application.status ===
                  "APPLIED"
              ).length
            : 0;

        if (
          !applicationsResponse.ok
        ) {
          console.error(
            "ADMIN APPLICATIONS METRIC ERROR:",
            applicationsData
          );
        }

        /* -----------------------------------------------
         * PAYOUT COUNT
         * ----------------------------------------------- */

        const payoutsCount =
          payoutsResponse.ok
            ? Number(
                payoutsData.count ??
                  0
              )
            : 0;

        if (
          !payoutsResponse.ok
        ) {
          console.error(
            "ADMIN PAYOUTS METRIC ERROR:",
            payoutsData
          );
        }

        /* -----------------------------------------------
         * SETTLEMENT COUNT
         *
         * Temporalmente 0.
         * Se conectará a
         * /api/admin/settlements.
         * ----------------------------------------------- */

       setMetrics({
  applications:
    applicationsCount,

  payouts:
    payoutsCount,

  settlements:
    settlementsResponse.ok
      ? Number(
          settlementsData.count ?? 0
        )
      : 0,
});
      } catch (error) {
        console.error(
          "ADMIN DASHBOARD ERROR:",
          error
        );
      } finally {
        setLoading(false);
      }
    }

    loadAdmin();
  }, [router]);

  /* =======================================================
   * LOGOUT
   * ======================================================= */

  async function handleLogout() {
    const supabase =
      getSupabaseBrowser();

    await supabase.auth.signOut();

    router.replace(
      "/admin/login"
    );

    router.refresh();
  }

  /* =======================================================
   * LOADING
   * ======================================================= */

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Territory Control...
        </p>

      </main>
    );
  }

  /* =======================================================
   * UI
   * ======================================================= */

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      {/* ================================================
          HEADER
      ================================================ */}

      <header className="border-b border-black/10 px-6 py-5 md:px-10">

        <div className="mx-auto flex max-w-6xl items-center justify-between">

          <div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.34em]">
              Wolves Territory
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-black/35">
              Territory Control
            </p>

          </div>

          <button
            type="button"
            onClick={
              handleLogout
            }
            className="text-[9px] uppercase tracking-[0.22em] text-black/40 transition hover:text-black"
          >
            Cerrar sesión
          </button>

        </div>

      </header>

      {/* ================================================
          CONTENT
      ================================================ */}

      <div className="mx-auto max-w-6xl px-6 py-14 md:px-10 lg:py-20">

        <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
          Administration
        </p>

        <h1 className="mt-4 text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.045em] md:text-6xl">
          Hola,
          <br />
          {admin?.full_name}.
        </h1>

        <p className="mt-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-black/30">
          {admin?.role}
        </p>

        {/* ==============================================
            ADMIN CARDS
        ============================================== */}

        <div className="mt-14 grid gap-px overflow-hidden border border-black/10 bg-black/10 md:grid-cols-3">

          <AdminCard
            label="Seller Network"
            title="Solicitudes"
            value={
              metrics.applications
            }
            description="Candidatos esperando revisión."
            onClick={() =>
              router.push(
                "/admin/applications"
              )
            }
          />

          <AdminCard
            label="Payments"
            title="Cuentas por verificar"
            value={
              metrics.payouts
            }
            description="Sellers esperando habilitación de pagos."
            onClick={() =>
              router.push(
                "/admin/payouts"
              )
            }
          />

          <AdminCard
            label="Finance"
            title="Liquidaciones"
            value={
              metrics.settlements
            }
            description="Liquidaciones listas para procesar."
            onClick={() =>
              router.push(
                "/admin/settlements"
              )
            }
          />

        </div>

        {/* ==============================================
            FOOTER INFORMATION
        ============================================== */}

        <div className="mt-16 border-t border-black/10 pt-8">

          <p className="text-[8px] uppercase tracking-[0.26em] text-black/30">
            Wolves Territory Commercial System
          </p>

          <p className="mt-3 max-w-xl text-sm leading-7 text-black/45">
            Centro de control para administrar
            la red comercial, validaciones
            financieras y liquidaciones.
          </p>

        </div>

      </div>

    </main>
  );
}

/* =========================================================
 * ADMIN CARD
 * ========================================================= */

function AdminCard({
  label,
  title,
  value,
  description,
  onClick,
}: {
  label: string;
  title: string;
  value: number;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className="group bg-[#f2f0eb] p-7 text-left transition hover:bg-black hover:text-white md:p-9"
    >

      <p className="text-[8px] uppercase tracking-[0.25em] opacity-35">
        {label}
      </p>

      <div className="mt-8 flex items-end justify-between gap-5">

        <div>

          <p className="text-5xl font-semibold tracking-[-0.06em]">
            {value}
          </p>

          <h2 className="mt-5 text-sm font-semibold uppercase tracking-[0.08em]">
            {title}
          </h2>

        </div>

        <span className="text-xl transition-transform group-hover:translate-x-1">
          →
        </span>

      </div>

      <p className="mt-5 max-w-xs text-xs leading-6 opacity-45">
        {description}
      </p>

    </button>
  );
}