import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ReservationForm from "@/components/reservas/ReservationForm";

export const metadata: Metadata = {
  title: "Separa ya | Solicitudes de reserva ORIGEN",
  description: "Descubre tu look de diciembre con Wolves Territory. Elige tu referencia ORIGEN y solicita al equipo comercial información para separarla.",
  alternates: { canonical: "https://www.wolves-territory.co/reservas" },
};

export default function ReservasPage() {
  return (
    <main className="min-h-screen bg-[#141413] text-white">
      <header className="border-b border-white/20 px-5 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <Link href="/" className="text-xs font-bold uppercase tracking-[.22em]">Wolves Territory</Link>
          <div className="flex flex-wrap items-center gap-4"><a href="https://wa.me/573043795035?text=Hola%2C%20Wolves%20Territory.%20Quiero%20informaci%C3%B3n%20para%20separar%20mi%20look%20de%20diciembre." target="_blank" rel="noopener noreferrer" className="text-[10px] font-semibold uppercase tracking-[.15em] text-[#b5ddb9] hover:text-white">WhatsApp comercial ↗</a><Link href="/#coleccion" className="text-[10px] uppercase tracking-[.15em] text-white/65 hover:text-white">Volver a la tienda ↗</Link></div>
        </div>
      </header>
      <section className="relative overflow-hidden px-4 py-12 sm:px-8 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_10%_20%,#55412e_0%,transparent_46%)] opacity-65"/>
        <div className="relative">
          <Suspense fallback={<p className="text-center text-sm text-white/70">Cargando catálogo...</p>}>
            <ReservationForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
