"use client";

import { FormEvent, useState } from "react";

type ApplicationStatus = "idle" | "success";

export default function SellerApplyPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [status, setStatus] = useState<ApplicationStatus>("idle");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setError("");

    const form = event.currentTarget;
    const formData = new FormData(form);

    const payload = {
      fullName: String(formData.get("fullName") ?? "").trim(),
      documentType: String(formData.get("documentType") ?? "CC"),
      documentNumber: String(formData.get("documentNumber") ?? "").trim(),
      email: String(formData.get("email") ?? "").trim(),
      phone: String(formData.get("phone") ?? "").trim(),
      city: String(formData.get("city") ?? "").trim(),
      instagram: String(formData.get("instagram") ?? "").trim(),
      referralSource: String(formData.get("referralSource") ?? "").trim(),
      motivation: String(formData.get("motivation") ?? "").trim(),
      privacyAccepted: formData.get("privacyAccepted") === "on",
      termsAccepted: formData.get("termsAccepted") === "on",
    };

    try {
      setLoading(true);

      const response = await fetch("/api/seller/apply", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.error ?? "No fue posible enviar la solicitud."
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

  if (status === "success") {
    return (
      <main className="flex min-h-screen items-center justify-center bg-black px-6 text-white">
        <div className="mx-auto max-w-xl text-center">
          <p className="text-[9px] uppercase tracking-[0.35em] text-[#c9a96e]">
            Wolves Territory
          </p>

          <h1 className="mt-7 text-5xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] md:text-7xl">
            Tu aventura
            <br />
            comienza aquí.
          </h1>

          <p className="mx-auto mt-7 max-w-md text-sm leading-7 text-white/50">
            Recibimos tu solicitud. Nuestro equipo revisará tu información
            antes de activar tu acceso a la red comercial Wolves Territory.
          </p>

          <p className="mt-10 text-[9px] uppercase tracking-[0.25em] text-white/30">
            Application received
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">
      <div className="mx-auto grid min-h-screen max-w-[1600px] lg:grid-cols-[0.8fr_1.2fr]">

        {/* IZQUIERDA */}

        <section className="bg-black px-6 py-14 text-white md:px-10 lg:px-14 lg:py-20">
          <div className="flex h-full max-w-xl flex-col justify-between">

            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-[#c9a96e]">
                Wolves Territory
              </p>

              <p className="mt-3 text-[8px] uppercase tracking-[0.28em] text-white/30">
                Seller Network
              </p>
            </div>

            <div className="my-16 lg:my-0">
              <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
                Join The Territory
              </p>

              <h1 className="mt-5 text-5xl font-semibold uppercase leading-[0.9] tracking-[-0.055em] md:text-6xl xl:text-7xl">
                Haz parte
                <br />
                del territorio.
              </h1>

              <p className="mt-8 max-w-md text-sm leading-7 text-white/50">
                Empieza una aventura vendiendo Wolves Territory. Construye tu
                propia red, comparte la marca y genera ingresos a través de
                nuestro programa Seller.
              </p>
            </div>

            <p className="text-[8px] uppercase tracking-[0.25em] text-white/25">
              Colombia · Seller Application
            </p>
          </div>
        </section>

        {/* DERECHA */}

        <section className="px-6 py-14 md:px-10 lg:px-14 lg:py-20">
          <div className="mx-auto max-w-2xl">

            <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
              Application
            </p>

            <h2 className="mt-4 text-4xl font-semibold uppercase tracking-[-0.045em] md:text-5xl">
              Cuéntanos
              <br />
              sobre ti.
            </h2>

            <p className="mt-5 max-w-lg text-sm leading-7 text-black/45">
              Esta solicitud no activa automáticamente una cuenta. Cada
              candidato es revisado por Wolves Territory antes de ingresar a
              la red comercial.
            </p>

            <form onSubmit={handleSubmit} className="mt-12 space-y-9">

              {/* INFORMACIÓN PERSONAL */}

              <div>
                <SectionLabel>Información personal</SectionLabel>

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
                    className="h-14 border border-black/15 bg-transparent px-4 text-sm outline-none transition focus:border-black"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="PASSPORT">Pasaporte</option>
                  </select>

                  <Input
                    name="documentNumber"
                    placeholder="Número de documento"
                    required
                  />
                </div>
              </div>

              {/* CONTACTO */}

              <div className="border-t border-black/10 pt-9">
                <SectionLabel>Contacto</SectionLabel>

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

              {/* TERRITORIO */}

              <div className="border-t border-black/10 pt-9">
                <SectionLabel>Tu territorio</SectionLabel>

                <Input
                  name="referralSource"
                  placeholder="¿Cómo conociste Wolves Territory?"
                />

                <textarea
                  name="motivation"
                  rows={5}
                  placeholder="¿Por qué quieres hacer parte del territorio?"
                  className="mt-4 w-full resize-none border border-black/15 bg-transparent p-4 text-sm leading-6 outline-none transition focus:border-black"
                />
              </div>

              {/* CONSENTIMIENTOS */}

              <div className="space-y-4 border-t border-black/10 pt-9">

                <Checkbox
                  name="privacyAccepted"
                  label="Autorizo el tratamiento de mis datos personales para gestionar esta solicitud."
                />

                <Checkbox
                  name="termsAccepted"
                  label="Acepto los términos y condiciones del proceso de aplicación Seller."
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
                className="group flex w-full items-center justify-between bg-black px-6 py-5 text-[10px] font-semibold uppercase tracking-[0.28em] text-white transition hover:bg-[#c9a96e] hover:text-black disabled:cursor-not-allowed disabled:opacity-40"
              >
                {loading ? "Enviando..." : "Quiero hacer parte"}

                <span className="text-lg transition-transform duration-300 group-hover:translate-x-1">
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

/* =========================================================
   INPUT
========================================================= */

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
      placeholder={placeholder}
      required={required}
      className="h-14 w-full border border-black/15 bg-transparent px-4 text-sm outline-none transition focus:border-black"
    />
  );
}

/* =========================================================
   CHECKBOX
========================================================= */

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
        className="mt-1 h-4 w-4 accent-black"
      />

      <span className="text-xs leading-6 text-black/55">
        {label}
      </span>
    </label>
  );
}

/* =========================================================
   SECTION LABEL
========================================================= */

function SectionLabel({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <p className="mb-5 text-[9px] font-semibold uppercase tracking-[0.25em]">
      {children}
    </p>
  );
}