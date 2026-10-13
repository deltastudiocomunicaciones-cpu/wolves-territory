"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import StoreTurnstile from "./StoreTurnstile";

type FormData = {
  legalName: string;
  tradeName: string;
  documentType: string;
  documentNumber: string;
  representativeName: string;
  representativeDocumentType: string;
  representativeDocumentNumber: string;
  email: string;
  phone: string;
  city: string;
  department: string;
  businessAddress: string;
  branchCount: string;
  operatingCities: string;
  businessDescription: string;
  privacyAccepted: boolean;
  termsAccepted: boolean;
};

const initial: FormData = {
  legalName: "",
  tradeName: "",
  documentType: "NIT",
  documentNumber: "",
  representativeName: "",
  representativeDocumentType: "CC",
  representativeDocumentNumber: "",
  email: "",
  phone: "",
  city: "",
  department: "",
  businessAddress: "",
  branchCount: "1",
  operatingCities: "",
  businessDescription: "",
  privacyAccepted: false,
  termsAccepted: false,
};

const field =
  "mt-2 w-full rounded-xl border border-neutral-300 bg-white px-4 py-3 text-sm text-neutral-900 outline-none transition focus:border-neutral-900 focus:ring-1 focus:ring-neutral-900";

const label = "block text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600";

export default function StoreApplyPage() {
  const [form, setForm] = useState<FormData>(initial);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const update = (key: keyof FormData, value: string | boolean) => {
    setForm((previous) => ({ ...previous, [key]: value }));
  };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (loading) return;

    if (!turnstileToken) {
      setError("Completa la verificación de seguridad antes de continuar.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/store/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          branchCount: Number(form.branchCount),
          turnstileToken,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "No fue posible enviar la solicitud.");
      }

      setSubmitted(true);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "Ocurrió un error al enviar la solicitud."
      );
    } finally {
      setTurnstileToken(null);
      setTurnstileResetKey((previous) => previous + 1);
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f4f1eb] text-[#171717]">
      <div className="grid min-h-screen lg:grid-cols-2">
        <aside style={{ backgroundColor: "#111111" }} className="relative overflow-hidden bg-[#111111] px-7 py-12 text-white sm:px-12 lg:sticky lg:top-0 lg:self-start lg:flex lg:h-screen lg:flex-col lg:justify-between lg:px-14 lg:py-14">
          <div>
            <Link
              href="/"
              className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75"
            >
              WOLVES TERRITORY
            </Link>

            <div className="mt-20 max-w-lg lg:mt-28">
              <span className="text-xs uppercase tracking-[0.28em] text-[#c6a98a]">
                Commercial Network / Store
              </span>

              <h1 className="mt-6 text-5xl font-semibold leading-[0.98] tracking-[-0.065em] sm:text-6xl xl:text-7xl">
                Crezcamos
                <br />
                en el mismo
                <br />
                territorio.
              </h1>

              <p className="mt-8 max-w-md text-base leading-7 text-white/60">
                Construimos una red de aliados comerciales que comparten
                visión, identidad y oportunidades de crecimiento.
              </p>
            </div>
          </div>

          <div className="mt-20 border-t border-white/15 pt-6">
            <p className="text-xs uppercase tracking-[0.18em] text-white/40">
              WOLVES TERRITORY · COMMERCIAL PARTNERS
            </p>
            <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">
              Tu solicitud será evaluada por nuestro equipo comercial.
              El registro no implica aprobación automática.
            </p>
          </div>
        </aside>

        <section className="px-6 py-12 sm:px-12 lg:px-16 lg:py-16 xl:px-24">
          <div className="mx-auto max-w-2xl">
            {submitted ? (
              <div className="flex min-h-[70vh] flex-col justify-center">
                <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-full bg-[#17291e] text-2xl text-white">
                  ✓
                </div>

                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  Solicitud recibida
                </span>

                <h2 className="mt-5 text-4xl font-semibold tracking-[-0.05em] sm:text-5xl">
                  El primer paso
                  <br />
                  está dado.
                </h2>

                <p className="mt-6 max-w-lg text-base leading-8 text-neutral-600">
                  Hemos recibido tu solicitud de afiliación comercial.
                  Nuestro equipo revisará la información antes de continuar
                  con el proceso de vinculación.
                </p>

                <Link
                  href="/"
                  className="mt-10 inline-flex w-fit rounded-full bg-neutral-900 px-7 py-3 text-sm font-medium text-white"
                >
                  Volver a Wolves Territory
                </Link>
              </div>
            ) : (
              <>
                <div className="border-b border-neutral-300 pb-8">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
                      Solicitud de afiliación
                    </span>
                    <span className="rounded-full border border-neutral-300 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider">
                      STORE
                    </span>
                  </div>

                  <h2 className="mt-7 text-4xl font-semibold tracking-[-0.055em] sm:text-5xl">
                    Tu empresa.
                    <br />
                    Nuestro territorio.
                  </h2>

                  <p className="mt-5 text-sm leading-7 text-neutral-600">
                    Cuéntanos sobre tu empresa y sus puntos de venta.
                    Los campos marcados con * son obligatorios.
                  </p>
                </div>

                <form onSubmit={submit} className="mt-10 space-y-11">
                  <fieldset>
                    <legend className="mb-6 text-lg font-semibold tracking-tight">
                      01 / Información empresarial
                    </legend>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={label} htmlFor="legalName">
                          Razón social *
                        </label>
                        <input id="legalName" required maxLength={200} className={field} value={form.legalName} onChange={(e) => update("legalName", e.target.value)} />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={label} htmlFor="tradeName">
                          Nombre comercial *
                        </label>
                        <input id="tradeName" required maxLength={200} className={field} value={form.tradeName} onChange={(e) => update("tradeName", e.target.value)} />
                      </div>

                      <div>
                        <label className={label} htmlFor="documentType">
                          Tipo de documento *
                        </label>
                        <select id="documentType" className={field} value={form.documentType} onChange={(e) => update("documentType", e.target.value)}>
                          <option value="NIT">NIT</option>
                          <option value="CC">Cédula de ciudadanía</option>
                          <option value="CE">Cédula de extranjería</option>
                        </select>
                      </div>

                      <div>
                        <label className={label} htmlFor="documentNumber">
                          Número de documento *
                        </label>
                        <input id="documentNumber" required maxLength={40} className={field} value={form.documentNumber} onChange={(e) => update("documentNumber", e.target.value)} />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-6 text-lg font-semibold tracking-tight">
                      02 / Representante legal
                    </legend>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div className="sm:col-span-2">
                        <label className={label} htmlFor="representativeName">
                          Nombre completo *
                        </label>
                        <input id="representativeName" required maxLength={200} className={field} value={form.representativeName} onChange={(e) => update("representativeName", e.target.value)} />
                      </div>

                      <div>
                        <label className={label} htmlFor="representativeDocumentType">
                          Tipo de documento *
                        </label>
                        <select id="representativeDocumentType" className={field} value={form.representativeDocumentType} onChange={(e) => update("representativeDocumentType", e.target.value)}>
                          <option value="CC">Cédula de ciudadanía</option>
                          <option value="CE">Cédula de extranjería</option>
                          <option value="PASSPORT">Pasaporte</option>
                        </select>
                      </div>

                      <div>
                        <label className={label} htmlFor="representativeDocumentNumber">
                          Número de documento *
                        </label>
                        <input id="representativeDocumentNumber" required maxLength={40} className={field} value={form.representativeDocumentNumber} onChange={(e) => update("representativeDocumentNumber", e.target.value)} />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-6 text-lg font-semibold tracking-tight">
                      03 / Contacto y ubicación
                    </legend>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={label} htmlFor="email">Correo empresarial *</label>
                        <input id="email" type="email" required maxLength={254} className={field} value={form.email} onChange={(e) => update("email", e.target.value)} />
                      </div>

                      <div>
                        <label className={label} htmlFor="phone">Teléfono *</label>
                        <input id="phone" type="tel" required maxLength={40} className={field} value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                      </div>

                      <div>
                        <label className={label} htmlFor="city">Ciudad principal *</label>
                        <input id="city" required maxLength={120} className={field} value={form.city} onChange={(e) => update("city", e.target.value)} />
                      </div>

                      <div>
                        <label className={label} htmlFor="department">Departamento</label>
                        <input id="department" maxLength={120} className={field} value={form.department} onChange={(e) => update("department", e.target.value)} />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={label} htmlFor="businessAddress">Dirección principal *</label>
                        <input id="businessAddress" required maxLength={300} className={field} value={form.businessAddress} onChange={(e) => update("businessAddress", e.target.value)} />
                      </div>
                    </div>
                  </fieldset>

                  <fieldset>
                    <legend className="mb-6 text-lg font-semibold tracking-tight">
                      04 / Presencia comercial
                    </legend>

                    <div className="grid gap-5 sm:grid-cols-2">
                      <div>
                        <label className={label} htmlFor="branchCount">Número de puntos de venta *</label>
                        <input id="branchCount" type="number" min="1" max="1000" required className={field} value={form.branchCount} onChange={(e) => update("branchCount", e.target.value)} />
                      </div>

                      <div>
                        <label className={label} htmlFor="operatingCities">Ciudades donde opera</label>
                        <input id="operatingCities" maxLength={500} placeholder="Ej. Cartagena, Sincelejo, Tolú" className={field} value={form.operatingCities} onChange={(e) => update("operatingCities", e.target.value)} />
                      </div>

                      <div className="sm:col-span-2">
                        <label className={label} htmlFor="businessDescription">Cuéntanos sobre tu negocio</label>
                        <textarea id="businessDescription" rows={4} maxLength={1500} className={field} placeholder="Tipo de tienda, trayectoria, marcas que comercializa..." value={form.businessDescription} onChange={(e) => update("businessDescription", e.target.value)} />
                      </div>
                    </div>
                  </fieldset>

                  <div className="space-y-4 border-t border-neutral-300 pt-8">
                    <label className="flex items-start gap-3 text-sm leading-6 text-neutral-600">
                      <input type="checkbox" required checked={form.privacyAccepted} onChange={(e) => update("privacyAccepted", e.target.checked)} className="mt-1 h-4 w-4 accent-neutral-900" />
                      <span>Autorizo el tratamiento de los datos suministrados para gestionar mi solicitud de afiliación comercial. *</span>
                    </label>

                    <label className="flex items-start gap-3 text-sm leading-6 text-neutral-600">
                      <input type="checkbox" required checked={form.termsAccepted} onChange={(e) => update("termsAccepted", e.target.checked)} className="mt-1 h-4 w-4 accent-neutral-900" />
                      <span>Declaro que la información es verídica y acepto las condiciones del proceso de evaluación comercial. *</span>
                    </label>
                  </div>

                  <div className="rounded-xl border border-neutral-300 bg-white p-5">
                    <p className="mb-4 text-xs font-semibold uppercase tracking-[0.12em] text-neutral-600">
                      Verificación de seguridad
                    </p>
                    <StoreTurnstile
                      onTokenChange={setTurnstileToken}
                      resetKey={turnstileResetKey}
                    />
                  </div>

                  {error && (
                    <p role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                      {error}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={loading || !turnstileToken}
                    className="w-full rounded-full bg-[#171717] px-8 py-4 text-sm font-semibold uppercase tracking-[0.13em] text-white transition hover:bg-[#343434] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {loading ? "Enviando solicitud..." : "Enviar solicitud comercial →"}
                  </button>

                  <p className="text-center text-xs leading-6 text-neutral-500">
                    La recepción de esta solicitud no representa aprobación,
                    contratación ni habilitación comercial.
                  </p>
                </form>
              </>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}



