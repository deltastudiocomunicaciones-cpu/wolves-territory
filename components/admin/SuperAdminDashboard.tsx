"use client";

import Link from "next/link";
import ColombiaTerritoryMap from "./ColombiaTerritoryMap";

type SuperAdminDashboardProps = {
  fullName: string;
  metrics: {
    applications: number | null;
    payouts: number | null;
    settlements: number | null;
  };
  inventoryMetrics: {
    stock: number;
    reserved: number;
    available: number;
    lowStock: number;
    outOfStock: number;
    references: number;
  } | null;
};


const panels = [
  {
    title: "Rendimiento comercial",
    description: "Ventas, pedidos y evolución del negocio.",
    category: "INTELIGENCIA COMERCIAL",
    href: null,
  },
  {
    title: "Inventario",
    description: "Existencias y movimientos de mercancía.",
    category: "CONTROL OPERATIVO",
    href: "/admin/inventory",
  },
  {
    title: "Red de tiendas",
    description: "Vinculación y expansión comercial.",
    category: "TERRITORIO",
    href: "/admin/store-applications",
  },
];


export default function SuperAdminDashboard({
  fullName,
  metrics,
  inventoryMetrics,
}: SuperAdminDashboardProps) {
  return (
    <div className="space-y-8 text-[#252821]">

<section className="relative isolate min-h-[420px] overflow-hidden rounded-[28px] bg-[#171717] text-white sm:min-h-[470px]">
  {/* Fotografía ejecutiva */}
  <div
    aria-hidden="true"
    className="absolute inset-0 bg-cover bg-[center_center] bg-no-repeat sm:bg-center"
    style={{
      backgroundImage:
        "url('/images/admin/superadmin/wolves_territory_superadmin_hero.webp')",
    }}
  />

  {/* Contraste para la lectura */}
  <div
    aria-hidden="true"
    className="absolute inset-0 bg-gradient-to-r from-[#080808]/95 via-[#080808]/75 to-transparent"
  />

  {/* Tratamiento cinematográfico */}
  <div
    aria-hidden="true"
    className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10"
  />

  <div className="relative z-10 flex min-h-[420px] flex-col justify-between p-7 sm:min-h-[470px] sm:p-10 xl:p-12">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.26em] text-[#e08a49]">
        Wolves Territory / Executive Control
      </p>

      <div className="mt-5 h-px w-12 bg-[#c96a1b]" />
    </div>

    <div className="max-w-[620px]">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.24em] text-white/60">
        Dirección · Gobierno comercial
      </p>

      <h1 className="text-[clamp(2.6rem,5vw,5rem)] font-semibold leading-[0.98] tracking-[-0.065em]">
        El territorio
        <br />
        bajo tu visión.
      </h1>

      <p className="mt-6 max-w-[490px] text-[13px] leading-7 text-white/75 sm:text-sm">
        Bienvenido, {fullName}. Un espacio para interpretar el
        desempeño comercial, supervisar la operación y comprender
        la expansión nacional de Wolves Territory.
      </p>
    </div>

    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/20 pt-5">
      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-white/55">
        Commercial Operating System
      </span>

      <span className="text-[9px] font-semibold uppercase tracking-[0.2em] text-[#e08a49]">
        SUPER_ADMIN / CONTROL
      </span>
    </div>
  </div>
</section>


<section aria-labelledby="business-intelligence-title">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a47757]">
        01 / Visión ejecutiva
      </p>
      <h2
        id="business-intelligence-title"
        className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[#171717]"
      >
        Inteligencia del negocio
      </h2>
    </div>

    <span className="rounded-full border border-[#c96a1b]/30 bg-[#c96a1b]/5 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.12em] text-[#9a5b2d]">
      Información disponible
    </span>
  </div>

  <div className="grid gap-4 md:grid-cols-3">
    {panels.map((panel, index) => (
      <article
        key={panel.title}
        className="group relative flex min-h-[260px] flex-col overflow-hidden rounded-[24px] border border-white/10 bg-[#171717] p-6 text-white transition duration-300 hover:-translate-y-1 hover:border-[#c96a1b]/50 hover:shadow-xl"
      >
       {panel.href && (
      <Link
        href={panel.href}
        aria-label={`Abrir ${panel.title}`}
        className="absolute inset-0 z-20 rounded-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c96a1b]"
      >
        <span className="sr-only">Abrir {panel.title}</span>
      </Link>
    )}

        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-12 -top-12 h-40 w-40 rounded-full border border-white/10"
        />

        <div className="relative z-10 flex items-start justify-between gap-3">
          <p className="text-[9px] font-bold uppercase tracking-[0.17em] text-[#d58a51]">
            {panel.category}
          </p>
          <span className="text-[11px] font-medium text-white/30">
            0{index + 1}
          </span>
        </div>

        <div className="relative z-10 mt-8">
          <h3 className="text-[22px] font-semibold tracking-[-0.045em]">
            {panel.title}
          </h3>

          <p className="mt-2 text-[12px] leading-6 text-white/55">
            {panel.description}
          </p>
        </div>

        <div className="relative z-10 mt-auto pt-6">
          {panel.title === "Inventario" ? (
            inventoryMetrics === null ? (
              <p className="border-t border-white/10 pt-4 text-xs text-white/45">
                Dato no disponible
              </p>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-3 gap-2 border-t border-white/15 pt-4">
                  {[
                    {
                      label: "Existencias",
                      value: inventoryMetrics.stock,
                    },
                    {
                      label: "Reservadas",
                      value: inventoryMetrics.reserved,
                    },
                    {
                      label: "Disponibles",
                      value: inventoryMetrics.available,
                    },
                  ].map((item) => (
                    <div key={item.label}>
                      <p className="text-[9px] text-white/45">
                        {item.label}
                      </p>
                      <p className="mt-1 text-xl font-semibold tabular-nums text-white">
                        {item.value.toLocaleString("es-CO")}
                      </p>
                    </div>
                  ))}
                </div>

                <p className="text-[10px] leading-5 text-white/45">
                  {inventoryMetrics.references} referencias activas ·{" "}
                  {inventoryMetrics.lowStock} bajo mínimo ·{" "}
                  {inventoryMetrics.outOfStock} agotadas
                </p>
              </div>
            )
          ) : (
            <div className="border-t border-white/10 pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.12em] text-[#d58a51]">
                Integración de indicadores pendiente
              </p>
            </div>
          )}
        </div>
      </article>
    ))}
  </div>
</section>



<section aria-labelledby="admin-metrics-title">
  <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
    <div>
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a47757]">
        Control administrativo
      </p>
      <h2
        id="admin-metrics-title"
        className="mt-2 text-2xl font-semibold tracking-[-0.045em] text-[#171717]"
      >
        Indicadores de gestión
      </h2>
    </div>
    <span className="text-[10px] uppercase tracking-[0.14em] text-black/40">
      Seguimiento ejecutivo
    </span>
  </div>

  <div className="grid gap-4 md:grid-cols-3">

{[
  {
    label: "Solicitudes Referral",
    detail: "Estado APPLIED",
    value: metrics.applications,
    href: "/admin/applications",
  },
  {
    label: "Cuentas de pago",
    detail: "Activas sin verificar",
    value: metrics.payouts,
    href: "/admin/payouts",
  },
  {
    label: "Liquidaciones READY",
    detail: "En estado READY",
    value: metrics.settlements,
    href: "/admin/settlements",
  },
].map((item, index) => (

      <article
        key={item.label}
        className="relative flex min-h-[190px] flex-col justify-between overflow-hidden rounded-[24px] border border-white/10 bg-[#171717] p-6 text-white transition duration-300 hover:border-[#c96a1b]/50"
      >

    <Link
      href={item.href}
      aria-label={`Abrir ${item.label}`}
      className="absolute inset-0 z-20 rounded-[24px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#c96a1b]"
    >
      <span className="sr-only">
        Abrir {item.label}
      </span>
    </Link>

        <div className="flex items-start justify-between gap-3">
          <p className="text-[12px] font-medium text-white/70">
            {item.label}
          </p>
          <span className="text-[10px] font-semibold text-[#d58a51]">
            0{index + 1}
          </span>
        </div>

        <div>
          <p className="text-[clamp(2.8rem,4vw,4rem)] font-semibold leading-none tracking-[-0.065em] tabular-nums text-white">
            {item.value === null
              ? "—"
              : item.value.toLocaleString("es-CO")}
          </p>

          <div className="mt-5 h-px w-10 bg-[#c96a1b]" />

          <p className="mt-3 text-[11px] leading-5 text-white/50">
            {item.value === null
              ? "Dato no disponible"
              : item.detail}
          </p>
        </div>
      </article>
    ))}
  </div>
</section>


<section className="grid gap-4 xl:grid-cols-[1.15fr_1fr]">
  {/* Evolución comercial */}
  <article className="relative flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-white/10 bg-[#171717] p-7 text-white sm:p-9">
    <div
      aria-hidden="true"
      className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-white/10"
    />

    <div className="relative z-10">
      <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#d58a51]">
        02 / Rendimiento
      </p>

      <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.045em]">
        Evolución comercial
      </h2>

      <p className="mt-3 max-w-md text-[12px] leading-6 text-white/50">
        Seguimiento estratégico de ventas y pedidos confirmados.
      </p>
    </div>

    <div className="relative z-10 mt-8 flex flex-1 flex-col items-center justify-center rounded-[20px] border border-dashed border-white/15 bg-white/[0.035] p-7 text-center">
      <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full border border-[#c96a1b]/40 bg-[#c96a1b]/10">
        <span aria-hidden="true" className="text-[25px] text-[#e08a49]">
          ↗
        </span>
      </div>

      <p className="max-w-xs text-[13px] font-medium leading-6 text-white/80">
        La evolución comercial se visualizará cuando existan datos
        de ventas y pedidos confirmados.
      </p>

      <p className="mt-3 text-[10px] uppercase tracking-[0.14em] text-white/35">
        Sin cifras simuladas
      </p>
    </div>

    <div className="relative z-10 mt-6 flex items-center justify-between border-t border-white/10 pt-5">
      <span className="text-[9px] uppercase tracking-[0.16em] text-white/40">
        Inteligencia comercial
      </span>
      <span className="text-[9px] font-semibold uppercase tracking-[0.16em] text-[#d58a51]">
        Integración pendiente
      </span>
    </div>
  </article>

  {/* Red comercial colombiana */}
  <article className="relative flex min-h-[390px] flex-col overflow-hidden rounded-[26px] border border-[#dedbd2] bg-[#eae7df] p-7 sm:p-9">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#a47757]">
          03 / Territory Network
        </p>

        <h2 className="mt-3 text-[26px] font-semibold tracking-[-0.045em] text-[#171717]">
          Colombia
          <span className="text-[#a47757]"> · </span>
          Red comercial
        </h2>
      </div>

      <span
        aria-hidden="true"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[#c96a1b]/30 text-[#a47757]"
      >
        ↗
      </span>
    </div>

    <p className="mt-3 max-w-sm text-[12px] leading-6 text-[#171717]/55">
      Visión territorial de la red comercial de Wolves Territory.
    </p>

    <div className="mt-5 min-w-0 flex-1">
      <ColombiaTerritoryMap />
    </div>

    <div className="mt-5 border-t border-black/10 pt-4">
      <p className="text-[9px] uppercase tracking-[0.14em] text-[#171717]/45">
        Expansión nacional · Información territorial
      </p>
    </div>
  </article>
</section>

    </div>
  );
}
