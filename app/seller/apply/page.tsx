"use client";

import {
  FormEvent,
  useState,
} from "react";

type ApplicationStatus =
  | "idle"
  | "success";

export default function SellerApplyPage() {
  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const [status, setStatus] =
    useState<ApplicationStatus>(
      "idle"
    );

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ) {
    event.preventDefault();

    setError("");

    const form =
      event.currentTarget;

    const formData =
      new FormData(form);

    const payload = {
      fullName:
        String(
          formData.get(
            "fullName"
          ) ?? ""
        ).trim(),

      documentType:
        String(
          formData.get(
            "documentType"
          ) ?? "CC"
        ),

      documentNumber:
        String(
          formData.get(
            "documentNumber"
          ) ?? ""
        ).trim(),

      email:
        String(
          formData.get(
            "email"
          ) ?? ""
        ).trim(),

      phone:
        String(
          formData.get(
            "phone"
          ) ?? ""
        ).trim(),

      city:
        String(
          formData.get(
            "city"
          ) ?? ""
        ).trim(),

      instagram:
        String(
          formData.get(
            "instagram"
          ) ?? ""
        ).trim(),

      referralSource:
        String(
          formData.get(
            "referralSource"
          ) ?? ""
        ).trim(),

      motivation:
        String(
          formData.get(
            "motivation"
          ) ?? ""
        ).trim(),

      privacyAccepted:
        formData.get(
          "privacyAccepted"
        ) === "on",

      termsAccepted:
        formData.get(
          "termsAccepted"
        ) === "on",
    };

    try {
      setLoading(true);

      const response =
        await fetch(
          "/api/seller/apply",
          {
            method: "POST",

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

      if (!response.ok) {
        throw new Error(
          data.error ??
            "No fue posible enviar la solicitud."
        );
      }

      setStatus("success");

      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "No fue posible enviar la solicitud."
      );
    } finally {
      setLoading(false);
    }
  }

  /* =========================================================
   * SUCCESS
   * ========================================================= */

  if (
    status === "success"
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#D9E3E8] px-6 text-[#101820]">

        <div className="mx-auto max-w-xl text-center">

          <p className="text-[9px] font-semibold uppercase tracking-[0.35em] text-[#187E83]">
            Wolves Territory
          </p>

          <h1 className="mt-7 text-5xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] md:text-7xl">
            Tu aventura
            <br />
            comienza aquí.
          </h1>

          <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-[#101820]/55">
            Recibimos tu solicitud.
            Nuestro equipo revisará tu
            información antes de activar
            tu acceso a la red comercial
            Wolves Territory.
          </p>

          <div className="mx-auto mt-9 h-px w-16 bg-[#187E83]/35" />

          <p className="mt-9 text-[9px] uppercase tracking-[0.25em] text-[#101820]/30">
            Application received
          </p>

        </div>

      </main>
    );
  }

  /* =========================================================
   * APPLICATION
   * ========================================================= */

  return (
    <main className="min-h-screen bg-[#EEF2F3] text-[#101820]">

      <div className="mx-auto grid min-h-screen max-w-[1800px] lg:grid-cols-[0.95fr_1.05fr]">

        {/* ===================================================
            EDITORIAL IMAGE
        =================================================== */}

        <section className="relative min-h-[72vh] overflow-hidden bg-[#101820] lg:sticky lg:top-0 lg:h-screen">

          <img
            src="/images/seller/seller-network-hero.png"
            alt="Wolves Territory Seller Network"
            className="absolute inset-0 h-full w-full object-cover object-top"
          />

          {/* Overlay sutil únicamente para profundidad */}

          <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/35 via-transparent to-transparent" />

          {/* Label */}

          <div className="absolute left-6 top-7 md:left-10 md:top-10 lg:left-12">

            <p className="text-[8px] font-semibold uppercase tracking-[0.35em] text-white/65">
              Wolves Territory
            </p>

            <p className="mt-2 text-[7px] uppercase tracking-[0.3em] text-white/35">
              Comunidad de vendedores
            </p>

          </div>

          {/* Bottom signature */}

          <div className="absolute bottom-7 left-6 right-6 flex items-end justify-between border-t border-white/20 pt-5 text-white md:left-10 md:right-10 lg:left-12 lg:right-12">

            <p className="max-w-xs text-[8px] uppercase leading-5 tracking-[0.22em] text-white/45">
              Identidad que se ve
              <br />
              y se siente.
            </p>

            <p className="text-[7px] uppercase tracking-[0.25em] text-white/30">
              Colombia
            </p>

          </div>

        </section>

        {/* ===================================================
            FORM · ICE
        =================================================== */}

        <section className="bg-[#EEF2F3] px-6 py-14 md:px-10 lg:px-14 lg:py-20">

          <div className="mx-auto max-w-2xl">

            {/* HEADER */}

            <div className="border-b border-[#101820]/10 pb-10">

              <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#187E83]">
                 Aplicación para vendedores
              </p>

              <h1 className="mt-5 text-4xl font-semibold uppercase leading-[0.94] tracking-[-0.05em] md:text-5xl xl:text-6xl">
                Haz parte
                <br />
                del territorio.
              </h1>

              <p className="mt-7 max-w-lg text-sm leading-7 text-[#101820]/50">
                Empieza una aventura
                vendiendo Wolves Territory.
                Construye tu propia red,
                comparte la marca y genera
                ingresos a través de nuestro
                programa Seller.
              </p>

              <p className="mt-7 max-w-lg text-xs leading-6 text-[#101820]/35">
                Cada solicitud es revisada
                por Wolves Territory antes
                de habilitar el acceso a la
                red comercial.
              </p>

            </div>

            {/* FORM */}

            <form
              onSubmit={
                handleSubmit
              }
              className="mt-12 space-y-10"
            >

              {/* =============================================
                  PERSONAL
              ============================================= */}

              <div>

                <SectionLabel>
                  Información personal
                </SectionLabel>

                <div className="grid gap-4 md:grid-cols-2">

                  <Input
                    name="fullName"
                    placeholder="Nombre completo"
                    required
                  />

                  <Input
                    name="city"
                    placeholder="Ciudad"
                    required
                  />

                </div>

                <div className="mt-4 grid gap-4 md:grid-cols-[0.35fr_0.65fr]">

                  <select
                    name="documentType"
                    defaultValue="CC"
                    className="h-14 border border-[#101820]/15 bg-white/25 px-4 text-sm outline-none transition focus:border-[#187E83]"
                  >
                    <option value="CC">
                      CC
                    </option>

                    <option value="CE">
                      CE
                    </option>

                    <option value="PASSPORT">
                      Pasaporte
                    </option>
                  </select>

                  <Input
                    name="documentNumber"
                    placeholder="Número de documento"
                    required
                  />

                </div>

              </div>

              {/* =============================================
                  CONTACT
              ============================================= */}

              <div className="border-t border-[#101820]/10 pt-9">

                <SectionLabel>
                  Contacto
                </SectionLabel>

                <div className="grid gap-4 md:grid-cols-2">

                  <Input
                    name="email"
                    type="email"
                    placeholder="Correo electrónico"
                    required
                  />

                  <Input
                    name="phone"
                    type="tel"
                    placeholder="WhatsApp / Teléfono"
                    required
                  />

                </div>

                <div className="mt-4">

                  <Input
                    name="instagram"
                    placeholder="Instagram (opcional)"
                  />

                </div>

              </div>

              {/* =============================================
                  TERRITORY
              ============================================= */}

              <div className="border-t border-[#101820]/10 pt-9">

                <SectionLabel>
                  Tu territorio
                </SectionLabel>

                <Input
                  name="referralSource"
                  placeholder="¿Cómo conociste Wolves Territory?"
                />

                <textarea
                  name="motivation"
                  rows={5}
                  placeholder="¿Por qué quieres hacer parte del territorio?"
                  className="mt-4 w-full resize-none border border-[#101820]/15 bg-white/25 p-4 text-sm leading-6 outline-none transition placeholder:text-[#101820]/30 focus:border-[#187E83]"
                />

              </div>

              {/* =============================================
                  CONSENT
              ============================================= */}

              <div className="space-y-4 border-t border-[#101820]/10 pt-9">

                <Checkbox
                  name="privacyAccepted"
                  label="Autorizo el tratamiento de mis datos personales para gestionar esta solicitud."
                />

                <Checkbox
                  name="termsAccepted"
                  label="Acepto los términos y condiciones del proceso de aplicación Seller."
                />

              </div>

              {/* =============================================
                  ERROR
              ============================================= */}

              {error && (
                <div className="border border-red-500/20 bg-red-500/5 p-4">

                  <p className="text-xs leading-5 text-red-700">
                    {error}
                  </p>

                </div>
              )}

              {/* =============================================
                  SUBMIT
              ============================================= */}

              <button
                type="submit"
                disabled={
                  loading
                }
                className="group flex w-full items-center justify-between bg-[#101820] px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition duration-300 hover:bg-[#187E83] disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading
                  ? "Enviando..."
                  : "Quiero hacer parte"}

                <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>

              </button>

              <p className="text-center text-[7px] uppercase tracking-[0.23em] text-[#101820]/25">
                Wolves Territory · Seller Network · Colombia
              </p>

            </form>

          </div>

        </section>

      </div>

    </main>
  );
}

/* =========================================================
 * INPUT
 * ========================================================= */

function Input({
  name,
  placeholder,
  type = "text",
  required = false,
}: {
  name: string;
  placeholder: string;
  type?: string;
  required?: boolean;
}) {
  return (
    <input
      name={name}
      type={type}
      placeholder={
        placeholder
      }
      required={
        required
      }
      className="h-14 w-full border border-[#101820]/15 bg-white/25 px-4 text-sm outline-none transition placeholder:text-[#101820]/30 focus:border-[#187E83]"
    />
  );
}

/* =========================================================
 * CHECKBOX
 * ========================================================= */

function Checkbox({
  name,
  label,
}: {
  name: string;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">

      <input
        type="checkbox"
        name={name}
        required
        className="mt-1 h-4 w-4 accent-[#187E83]"
      />

      <span className="text-xs leading-6 text-[#101820]/55">
        {label}
      </span>

    </label>
  );
}

/* =========================================================
 * SECTION LABEL
 * ========================================================= */

function SectionLabel({
  children,
}: {
  children:
    React.ReactNode;
}) {
  return (
    <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#101820]/65">
      {children}
    </p>
  );
}