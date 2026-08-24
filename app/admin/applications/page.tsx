"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  useRouter,
} from "next/navigation";

import {
  getSupabaseBrowser,
} from "@/lib/supabase-browser";

type ApplicationStatus =
  | "APPLIED"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED";

type Application = {
  id: string;

  full_name: string;

  document_type: string;
  document_number: string;

  email: string;
  phone: string;
  city: string;

  instagram: string | null;

  referral_source:
    | string
    | null;

  motivation:
    | string
    | null;

  status:
    ApplicationStatus;

  review_notes:
    | string
    | null;

  partner_id:
    | string
    | null;

  created_at: string;

  partner:
    | {
        id: string;
        code: string;
        name: string;

        auth_user_id:
          | string
          | null;

        commission_rate:
          number;
      }
    | null;
};

export default function AdminApplicationsPage() {
  const router =
    useRouter();

  const [
    applications,
    setApplications,
  ] =
    useState<Application[]>(
      []
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    activeFilter,
    setActiveFilter,
  ] =
    useState<
      ApplicationStatus | "ALL"
    >("ALL");

  const [
    processingId,
    setProcessingId,
  ] =
    useState<string | null>(
      null
    );

  const loadApplications =
    useCallback(
      async () => {
        setLoading(true);
        setError("");

        try {
          const supabase =
            getSupabaseBrowser();

          const {
            data:
              sessionData,
          } =
            await supabase.auth
              .getSession();

          const accessToken =
            sessionData.session
              ?.access_token;

          if (!accessToken) {
            router.replace(
              "/admin/login"
            );

            return;
          }

          const response =
            await fetch(
              "/api/admin/applications",
              {
                headers: {
                  Authorization:
                    `Bearer ${accessToken}`,
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response.json();

          if (
            !response.ok
          ) {
            throw new Error(
              data.error ??
                "No fue posible cargar las solicitudes."
            );
          }

          setApplications(
            data.applications ??
              []
          );
        } catch (error) {
          setError(
            error instanceof Error
              ? error.message
              : "No fue posible cargar las solicitudes."
          );
        } finally {
          setLoading(
            false
          );
        }
      },
      [router]
    );

  useEffect(() => {
    loadApplications();
  }, [
    loadApplications,
  ]);

  const filteredApplications =
    useMemo(() => {
      if (
        activeFilter ===
        "ALL"
      ) {
        return applications;
      }

      return applications.filter(
        (application) =>
          application.status ===
          activeFilter
      );
    }, [
      applications,
      activeFilter,
    ]);

  function count(
    status:
      ApplicationStatus
  ) {
    return applications.filter(
      (application) =>
        application.status ===
        status
    ).length;
  }

  async function executeAction(
    application:
      Application,

    action:
      | "REVIEW"
      | "APPROVE"
      | "REJECT"
      | "INVITE"
  ) {
    const supabase =
      getSupabaseBrowser();

    const {
      data:
        sessionData,
    } =
      await supabase.auth
        .getSession();

    const accessToken =
      sessionData.session
        ?.access_token;

    if (!accessToken) {
      router.replace(
        "/admin/login"
      );

      return;
    }

    let commissionRate =
      10;

    let notes:
      string | null =
      null;

    if (
      action ===
      "APPROVE"
    ) {
      const input =
        window.prompt(
          "Comisión Seller (%)",
          "10"
        );

      if (
        input === null
      ) {
        return;
      }

      commissionRate =
        Number(input);

      if (
        !Number.isFinite(
          commissionRate
        ) ||
        commissionRate < 0 ||
        commissionRate > 100
      ) {
        window.alert(
          "Porcentaje inválido."
        );

        return;
      }

      const confirmed =
        window.confirm(
          `¿Aprobar a ${application.full_name} con comisión del ${commissionRate}%?`
        );

      if (!confirmed) {
        return;
      }
    }

    if (
      action ===
      "REJECT"
    ) {
      const reason =
        window.prompt(
          "Motivo de rechazo:"
        );

      if (
        reason === null
      ) {
        return;
      }

      notes =
        reason.trim() ||
        "Solicitud no aprobada.";

      const confirmed =
        window.confirm(
          "¿Confirmas el rechazo de esta solicitud?"
        );

      if (!confirmed) {
        return;
      }
    }

    if (
      action ===
      "INVITE"
    ) {
      const confirmed =
        window.confirm(
          `¿Enviar invitación Seller a ${application.email}?`
        );

      if (!confirmed) {
        return;
      }
    }

    try {
      setProcessingId(
        application.id
      );

      const response =
        await fetch(
          "/api/admin/applications/action",
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",
            },

            body:
              JSON.stringify({
                accessToken,

                applicationId:
                  application.id,

                action,

                commissionRate,

                notes,
              }),
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data.error ??
            "No fue posible procesar la solicitud."
        );
      }

      await loadApplications();
    } catch (error) {
      window.alert(
        error instanceof Error
          ? error.message
          : "No fue posible procesar la solicitud."
      );
    } finally {
      setProcessingId(
        null
      );
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black text-white">

        <p className="text-[10px] uppercase tracking-[0.3em] text-white/40">
          Loading Seller Network...
        </p>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">

      <header className="border-b border-black/10 px-6 py-5 md:px-10">

        <div className="mx-auto flex max-w-7xl items-center justify-between">

          <div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.34em]">
              Wolves Territory
            </p>

            <p className="mt-1 text-[8px] uppercase tracking-[0.25em] text-black/35">
              Seller Applications
            </p>

          </div>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/admin"
              )
            }
            className="text-[9px] uppercase tracking-[0.22em] text-black/40"
          >
            ← Territory Control
          </button>

        </div>

      </header>

      <div className="mx-auto max-w-7xl px-6 py-14 md:px-10 lg:py-20">

        <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
          Seller Network
        </p>

        <div className="mt-4 flex items-end justify-between gap-8">

          <h1 className="text-4xl font-semibold uppercase leading-[0.95] tracking-[-0.045em] md:text-6xl">
            Solicitudes
            <br />
            Seller.
          </h1>

          <p className="text-5xl font-semibold tracking-[-0.06em]">
            {
              applications.length
            }
          </p>

        </div>

        {/* FILTERS */}

        <div className="mt-12 flex flex-wrap gap-2">

          <FilterButton
            active={
              activeFilter ===
              "ALL"
            }
            onClick={() =>
              setActiveFilter(
                "ALL"
              )
            }
          >
            Todas · {
              applications.length
            }
          </FilterButton>

          <FilterButton
            active={
              activeFilter ===
              "APPLIED"
            }
            onClick={() =>
              setActiveFilter(
                "APPLIED"
              )
            }
          >
            Nuevas · {
              count("APPLIED")
            }
          </FilterButton>

          <FilterButton
            active={
              activeFilter ===
              "UNDER_REVIEW"
            }
            onClick={() =>
              setActiveFilter(
                "UNDER_REVIEW"
              )
            }
          >
            En revisión · {
              count(
                "UNDER_REVIEW"
              )
            }
          </FilterButton>

          <FilterButton
            active={
              activeFilter ===
              "APPROVED"
            }
            onClick={() =>
              setActiveFilter(
                "APPROVED"
              )
            }
          >
            Aprobadas · {
              count(
                "APPROVED"
              )
            }
          </FilterButton>

          <FilterButton
            active={
              activeFilter ===
              "REJECTED"
            }
            onClick={() =>
              setActiveFilter(
                "REJECTED"
              )
            }
          >
            Rechazadas · {
              count(
                "REJECTED"
              )
            }
          </FilterButton>

        </div>

        {error && (
          <div className="mt-8 border border-red-500/20 bg-red-500/5 p-5">

            <p className="text-xs text-red-700">
              {error}
            </p>

          </div>
        )}

        <div className="mt-10 space-y-4">

          {filteredApplications.length ===
          0 ? (
            <div className="border-y border-black/10 py-14">

              <p className="text-sm text-black/40">
                No existen solicitudes en esta categoría.
              </p>

            </div>
          ) : (
            filteredApplications.map(
              (
                application
              ) => (
                <ApplicationCard
                  key={
                    application.id
                  }
                  application={
                    application
                  }
                  processing={
                    processingId ===
                    application.id
                  }
                  onAction={
                    executeAction
                  }
                />
              )
            )
          )}

        </div>

      </div>
    </main>
  );
}

function ApplicationCard({
  application,
  processing,
  onAction,
}: {
  application:
    Application;

  processing:
    boolean;

  onAction: (
    application:
      Application,

    action:
      | "REVIEW"
      | "APPROVE"
      | "REJECT"
      | "INVITE"
  ) => void;
}) {
  return (
    <article className="border border-black/10 bg-white/25 p-6 md:p-8">

      <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr_auto]">

        <div>

          <ApplicationStatusBadge
            status={
              application.status
            }
          />

          <h2 className="mt-5 text-xl font-semibold">
            {
              application.full_name
            }
          </h2>

          <p className="mt-2 text-xs text-black/45">
            {
              application.city
            }
          </p>

          <div className="mt-6 space-y-2 text-xs text-black/55">

            <p>
              {application.document_type}
              {" · "}
              {
                application.document_number
              }
            </p>

            <p>
              {
                application.email
              }
            </p>

            <p>
              {
                application.phone
              }
            </p>

            {application.instagram && (
              <p>
                Instagram ·{" "}
                {
                  application.instagram
                }
              </p>
            )}

          </div>

        </div>

        <div>

          <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
            Perfil comercial
          </p>

          <p className="mt-4 text-xs leading-6 text-black/55">
            <strong>
              Origen:
            </strong>{" "}
            {application.referral_source ||
              "No especificado"}
          </p>

          <p className="mt-4 text-xs leading-6 text-black/55">
            <strong>
              Motivación:
            </strong>{" "}
            {application.motivation ||
              "No especificada"}
          </p>

          {application.partner && (
            <div className="mt-6 border-t border-black/10 pt-5">

              <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                Seller creado
              </p>

              <p className="mt-2 text-sm font-semibold">
                {
                  application
                    .partner.code
                }
              </p>

              <p className="mt-2 text-xs text-black/45">
                Comisión{" "}
                {
                  application
                    .partner
                    .commission_rate
                }
                %
              </p>

            </div>
          )}

        </div>

        <div className="flex min-w-52 flex-col gap-2">

          {application.status ===
            "APPLIED" && (
            <>
              <ActionButton
                disabled={
                  processing
                }
                onClick={() =>
                  onAction(
                    application,
                    "REVIEW"
                  )
                }
              >
                Pasar a revisión
              </ActionButton>

              <SecondaryButton
                disabled={
                  processing
                }
                onClick={() =>
                  onAction(
                    application,
                    "REJECT"
                  )
                }
              >
                Rechazar
              </SecondaryButton>
            </>
          )}

          {application.status ===
            "UNDER_REVIEW" && (
            <>
              <ActionButton
                disabled={
                  processing
                }
                onClick={() =>
                  onAction(
                    application,
                    "APPROVE"
                  )
                }
              >
                Aprobar Seller
              </ActionButton>

              <SecondaryButton
                disabled={
                  processing
                }
                onClick={() =>
                  onAction(
                    application,
                    "REJECT"
                  )
                }
              >
                Rechazar
              </SecondaryButton>
            </>
          )}

          {application.status ===
            "APPROVED" &&
            application.partner &&
            !application.partner
              .auth_user_id && (
              <ActionButton
                disabled={
                  processing
                }
                onClick={() =>
                  onAction(
                    application,
                    "INVITE"
                  )
                }
              >
                Enviar invitación
              </ActionButton>
            )}

          {application.status ===
            "APPROVED" &&
            application.partner
              ?.auth_user_id && (
              <div className="border border-emerald-500/20 bg-emerald-500/5 px-5 py-4">

                <p className="text-[8px] font-semibold uppercase tracking-[0.2em] text-emerald-700">
                  ✓ Seller activado
                </p>

              </div>
            )}

          {processing && (
            <p className="mt-2 text-center text-[8px] uppercase tracking-[0.2em] text-black/35">
              Procesando...
            </p>
          )}

        </div>

      </div>

    </article>
  );
}

function ApplicationStatusBadge({
  status,
}: {
  status:
    ApplicationStatus;
}) {
  const labels = {
    APPLIED:
      "Nueva",

    UNDER_REVIEW:
      "En revisión",

    APPROVED:
      "Aprobada",

    REJECTED:
      "Rechazada",
  };

  return (
    <p className="text-[8px] font-semibold uppercase tracking-[0.22em] text-black/35">
      {labels[status]}
    </p>
  );
}

function FilterButton({
  children,
  active,
  onClick,
}: {
  children:
    React.ReactNode;

  active:
    boolean;

  onClick:
    () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`border px-4 py-3 text-[8px] font-semibold uppercase tracking-[0.18em] transition ${
        active
          ? "border-black bg-black text-white"
          : "border-black/10 text-black/45 hover:border-black"
      }`}
    >
      {children}
    </button>
  );
}

function ActionButton({
  children,
  onClick,
  disabled,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  disabled:
    boolean;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="bg-black px-5 py-4 text-[8px] font-semibold uppercase tracking-[0.2em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function SecondaryButton({
  children,
  onClick,
  disabled,
}: {
  children:
    React.ReactNode;

  onClick:
    () => void;

  disabled:
    boolean;
}) {
  return (
    <button
      type="button"
      disabled={
        disabled
      }
      onClick={
        onClick
      }
      className="border border-black/15 px-5 py-4 text-[8px] font-semibold uppercase tracking-[0.2em] transition hover:border-black disabled:opacity-40"
    >
      {children}
    </button>
  );
}