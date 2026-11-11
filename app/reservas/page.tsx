import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import ReservationForm from "@/components/reservas/ReservationForm";

const reserveUrl = "https://www.wolves-territory.co/reservas";
const shareTitle = "Diciembre te espera. SEPARA YA | Wolves Territory";
const shareDescription = "¿Ya pensaste qué vas a vestir en diciembre? Arma tu look ORIGEN con hoodies, camisetas, polos, bermudas y gorras. Selecciona tus favoritos y habla con nuestro equipo.";

export const metadata: Metadata = {
  title: { absolute: shareTitle },
  description: shareDescription,
  alternates: { canonical: reserveUrl },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: reserveUrl,
    siteName: "Wolves Territory",
    title: shareTitle,
    description: shareDescription,
    // app/reservas/opengraph-image.tsx supplies the campaign image automatically.
  },
  twitter: {
    card: "summary_large_image",
    title: shareTitle,
    description: shareDescription,
    images: ["https://www.wolves-territory.co/reservas/opengraph-image"],
  },
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
      <section className="relative isolate min-h-[calc(100vh-76px)] overflow-hidden px-4 py-12 sm:px-8 sm:py-20">
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-20 bg-[url('/images/separa-ya-origen-diciembre.jpg')] bg-cover bg-[position:65%_center] bg-no-repeat md:bg-center" />
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-r from-[#111111]/85 via-[#111111]/80 to-[#111111]/65 sm:from-[#111111]/78 sm:via-[#111111]/69 sm:to-[#111111]/58" />
        <div className="relative">
          <Suspense fallback={<p className="text-center text-sm text-white/70">Cargando catálogo...</p>}>
            <ReservationForm />
          </Suspense>
        </div>
      </section>
    </main>
  );
}
