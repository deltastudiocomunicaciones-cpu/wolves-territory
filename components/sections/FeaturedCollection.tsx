import Link from "next/link";

export default function FeaturedCollection() {
  return (
    <section id="current-drop" className="scroll-mt-20 bg-[#e9f2f5] text-[#101820]" aria-label="Editorial colección ORIGEN">
      <div className="grid min-h-[430px] grid-cols-1 gap-[3px] sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.15fr]">
        <Link href="/#coleccion" className="group relative block min-h-[360px] overflow-hidden bg-[#a9d9dc]">
          <img src="/images/polo-origen.png" alt="Polo de la colección ORIGEN" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"/>
          <span className="absolute bottom-5 left-6 bg-[#f8fafb]/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em]">01 / DETALLES</span>
        </Link>
        <Link href="/#the-pack" className="group relative block min-h-[360px] overflow-hidden bg-[#bdd6dc]">
          <img src="/products/origen-models.webp" alt="Modelos y looks de la colección ORIGEN" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]"/>
          <span className="absolute bottom-5 left-6 bg-[#f8fafb]/90 px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.18em]">02 / LOOKBOOK</span>
        </Link>
        <div className="flex min-h-[360px] flex-col justify-center bg-[#edf4f6] px-8 py-14 sm:col-span-2 sm:px-12 lg:col-span-1 lg:px-14">
          <p className="font-mono text-[11px] uppercase tracking-[0.22em] text-[#187E83]">LA COLECCIÓN</p>
          <h2 className="mt-6 text-[clamp(3.5rem,5.8vw,6.5rem)] font-black uppercase leading-[0.88] tracking-[-0.075em]">ORIGEN <span aria-hidden="true" className="inline-block text-[#187E83]">↗</span></h2>
          <p className="mt-6 max-w-sm text-base leading-7 text-[#405b66]">Descubre nuestras piezas, colores y siluetas. Una colección que nace del territorio.</p>
          <Link href="/#coleccion" className="mt-9 inline-flex w-fit items-center gap-8 border-b border-[#187E83] pb-3 text-sm font-semibold text-[#075F6C] transition-colors hover:text-[#101820]">
            Explorar todas las prendas <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}