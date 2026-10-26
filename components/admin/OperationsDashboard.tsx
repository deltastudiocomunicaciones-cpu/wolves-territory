
"use client";

import Image from "next/image";
import Link from "next/link";

type OperationsDashboardProps = {
  fullName: string;
};

const IMAGE_ROOT = "/images/admin/operations";

const modules = [
  {
    number: "01",
    eyebrow: "FULFILLMENT",
    title: "Operación",
    description: "Preparación, empaque y seguimiento de pedidos.",
    href: "/admin/operations",
    image: `${IMAGE_ROOT}/wolves_territory_operacion_card.webp`,
    alt: "Centro de operaciones de Wolves Territory",
  },
  {
    number: "02",
    eyebrow: "STOCK CONTROL",
    title: "Inventario",
    description: "Consulta de existencias y disponibilidad.",
    href: "/admin/inventory",
    image: `${IMAGE_ROOT}/wolves_territory_inventario_logo_correcto.webp`,
    alt: "Inventario de prendas Wolves Territory",
  },
  {
    number: "03",
    eyebrow: "INBOUND",
    title: "Recepciones",
    description: "Registro y seguimiento de mercancía.",
    href: "/admin/inventory/receipts",
    image: `${IMAGE_ROOT}/wolves_territory_recepciones_card.webp`,
    alt: "Recepción de mercancía Wolves Territory",
  },
  {
    number: "04",
    eyebrow: "PHYSICAL CONTROL",
    title: "Conteos",
    description: "Control físico y conciliación operativa.",
    href: "/admin/inventory/counts",
    image: `${IMAGE_ROOT}/wolves_territory_conteos_card.webp`,
    alt: "Conteo físico de mercancía Wolves Territory",
  },
] as const;

export default function OperationsDashboard({
  fullName,
}: OperationsDashboardProps) {
  return (
    <div className="space-y-11">
      {/* HERO CINEMATOGRÁFICO */}
      <section
        aria-labelledby="operations-hero-title"
        className="relative isolate min-h-[430px] overflow-hidden rounded-[28px] bg-[#111] text-white sm:min-h-[470px]"
      >
        <Image
          src={`${IMAGE_ROOT}/wolves_territory_operations_panoramic_dashboard_bg.webp`}
          alt="Centro logístico Wolves Territory"
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1100px"
          className="object-cover object-[76%_center] sm:object-center"
        />

        {/* Protección de lectura del texto */}
        <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />

        <div className="relative z-10 flex min-h-[430px] flex-col justify-center px-7 py-12 sm:min-h-[470px] sm:px-12 xl:px-14">
          <div className="max-w-[610px]">
            <div className="flex items-center gap-3">
              <span className="h-[2px] w-8 bg-[#e08a49]" />
              <p className="text-[10px] font-semibold uppercase tracking-[0.27em] text-[#e6a779]">
                Wolves Territory / Operations
              </p>
            </div>

            <h1
              id="operations-hero-title"
              className="mt-8 text-[clamp(2.7rem,5.5vw,5.1rem)] font-bold uppercase leading-[0.96] tracking-[-0.065em]"
            >
              Hola,
              <span className="mt-2 block text-[#e08a49]">
                {fullName}.
              </span>
            </h1>

            <p className="mt-7 max-w-[440px] text-[13px] leading-7 text-white/75">
              Cada movimiento cuenta. Tu territorio de trabajo,
              inventario y control operativo en un solo lugar.
            </p>

            <div className="mt-9 flex flex-wrap gap-3">
              <Link
                href="/admin/inventory/receipts"
                className="inline-flex min-h-12 items-center justify-center gap-5 rounded-full bg-[#c96a1b] px-6 text-[10px] font-bold uppercase tracking-[0.12em] text-white transition hover:bg-[#e0802c] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Recepciones <span aria-hidden="true">↗</span>
              </Link>

              <Link
                href="/admin/inventory/counts"
                className="inline-flex min-h-12 items-center justify-center gap-5 rounded-full border border-white/35 bg-black/20 px-6 text-[10px] font-bold uppercase tracking-[0.12em] text-white backdrop-blur-sm transition hover:border-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
              >
                Iniciar conteo <span aria-hidden="true">↗</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="absolute bottom-5 right-6 z-10 hidden text-[9px] font-semibold uppercase tracking-[0.2em] text-white/60 sm:block">
          WT / Territory Control
        </div>
      </section>

      {/* MÓDULOS FOTOGRÁFICOS */}
      <section aria-labelledby="operations-modules">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-[#a47757]">
              01 / Territorio operativo
            </p>
            <h2
              id="operations-modules"
              className="mt-2 text-2xl font-semibold tracking-[-0.045em]"
            >
              Espacios de trabajo
            </h2>
          </div>

          <span className="text-xs text-black/40">
            {modules.length} módulos
          </span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          {modules.map((module) => (
            <Link
              key={module.number}
              href={module.href}
              className="group relative isolate flex min-h-[340px] flex-col justify-between overflow-hidden rounded-[24px] bg-[#171717] p-6 text-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[#c96a1b]"
            >
              <Image
                src={module.image}
                alt={module.alt}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1536px) 50vw, 25vw"
                className="object-cover transition-transform duration-700 group-hover:scale-105"
              />

              <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-black/20" />

              <div className="relative z-10 flex items-start justify-between gap-3">
                <span className="text-[9px] font-bold uppercase tracking-[0.16em] text-white/80">
                  {module.number} / {module.eyebrow}
                </span>
                <span
                  aria-hidden="true"
                  className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/40 bg-black/25 text-lg backdrop-blur-sm transition group-hover:border-[#c96a1b] group-hover:bg-[#c96a1b]"
                >
                  ↗
                </span>
              </div>

              <div className="relative z-10">
                <div className="mb-4 h-[2px] w-9 bg-[#e08a49]" />
                <h3 className="text-[25px] font-bold uppercase leading-none tracking-[-0.045em]">
                  {module.title}
                </h3>
                <p className="mt-3 max-w-[230px] text-[12px] leading-5 text-white/80">
                  {module.description}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
