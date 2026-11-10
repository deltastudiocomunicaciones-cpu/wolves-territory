import type { Metadata } from "next";
import Link from "next/link";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const canonical = "https://www.wolves-territory.co/universo-wolves";

export const metadata: Metadata = {
  title: "Universo Wolves | Streetwear de Medellín y vínculo con Lobos FC",
  description:
    "Conoce Wolves Territory, marca de ropa masculina y streetwear de Medellín, Colombia, vinculada al proyecto deportivo Corporación Deportiva Lobos FC. Explora la colección ORIGEN.",
  alternates: { canonical },
  openGraph: {
    title: "Universo Wolves | Wolves Territory",
    description: "Identidad, disciplina y territorio. Descubre la relación entre Wolves Territory y la Corporación Deportiva Lobos FC, desde Medellín.",
    url: canonical,
    type: "website",
    locale: "es_CO",
  },
};

export default function UniversoWolvesPage() {
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-[#f2f0eb] pt-24 text-[#141414]">
        <section className="bg-[#101820] px-6 py-24 text-[#f5f2ec] md:px-12 lg:py-32">
          <div className="mx-auto max-w-6xl">
            <p className="text-[11px] font-medium uppercase tracking-[.33em] text-[#83c8c5]">Wolves Territory · Medellín, Colombia</p>
            <h1 className="mt-7 max-w-4xl text-5xl font-black uppercase leading-[.9] tracking-tight md:text-7xl">
              El territorio es identidad.
            </h1>
            <p className="mt-8 max-w-2xl text-lg leading-8 text-white/70">
              Wolves Territory es una marca colombiana de moda masculina y streetwear.
              Nuestra propuesta reúne prendas, diseño y una cultura basada en identidad,
              disciplina y pertenencia.
            </p>
            <Link href="/#coleccion" className="mt-10 inline-flex border border-white/50 px-7 py-4 text-xs font-semibold uppercase tracking-[.18em] hover:bg-white hover:text-[#101820]">
              Explorar colección ORIGEN ↗
            </Link>
          </div>
        </section>

        <section className="px-6 py-20 md:px-12 lg:py-28">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2 lg:items-start">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[.3em] text-[#187e83]">Origen y vínculo institucional</p>
              <h2 className="mt-6 text-4xl font-bold uppercase leading-tight tracking-tight md:text-5xl">
                Más que una colección.
              </h2>
            </div>
            <div className="space-y-6 text-base leading-8 text-[#383735]">
              <p>
                Wolves Territory está vinculada al universo de la{" "}
                <a href="https://corporacionlobosfc.com" target="_blank" rel="noopener noreferrer" className="font-semibold underline underline-offset-4">
                  Corporación Deportiva Lobos FC
                </a>, un proyecto deportivo colombiano.
                La conexión expresa valores compartidos y una identidad común; las
                actividades de formación deportiva y la oferta comercial de moda
                tienen propósitos y recorridos diferentes.
              </p>
              <p>
                En nuestra tienda encuentras la colección ORIGEN y categorías de
                ropa masculina como hoodies, camisetas, polos, bermudas y gorras.
                Las fotografías y referencias comerciales pertenecen al catálogo
                de Wolves Territory.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-[#d9e3e8] px-6 py-16 md:px-12">
          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-2">
            <div className="border-t border-[#101820]/25 pt-6">
              <p className="text-[10px] uppercase tracking-[.23em] text-[#187e83]">La marca</p>
              <h3 className="mt-3 text-2xl font-bold uppercase">Wolves Territory</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#101820]/70">Moda masculina, streetwear y colección ORIGEN en Colombia.</p>
              <Link href="/#coleccion" className="mt-6 inline-block border-b border-[#101820] pb-2 text-xs font-semibold uppercase tracking-[.2em]">Conocer prendas ↗</Link>
            </div>
            <div className="border-t border-[#101820]/25 pt-6">
              <p className="text-[10px] uppercase tracking-[.23em] text-[#187e83]">El club</p>
              <h3 className="mt-3 text-2xl font-bold uppercase">Corporación Deportiva Lobos FC</h3>
              <p className="mt-3 max-w-md text-sm leading-7 text-[#101820]/70">Conoce el proyecto deportivo en su sitio institucional.</p>
              <a href="https://corporacionlobosfc.com" target="_blank" rel="noopener noreferrer" className="mt-6 inline-block border-b border-[#101820] pb-2 text-xs font-semibold uppercase tracking-[.2em]">Visitar Lobos FC ↗</a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
