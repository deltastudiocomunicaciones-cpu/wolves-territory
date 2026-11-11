import Link from "next/link";

export default function FeaturedCollection() {
  return (
    <section id="current-drop" className="scroll-mt-24 bg-[#e9f3f7] text-[#101820]" aria-label="Editorial Colección ORIGEN">
      <div className="grid grid-cols-1 lg:min-h-[570px] lg:grid-cols-[minmax(0,1.55fr)_minmax(420px,1fr)]">
        <Link href="/#the-pack" className="group relative block min-h-[480px] overflow-hidden bg-[#d3e3ea] sm:min-h-[550px] lg:min-h-[570px]">
          <img
            src="/products/origen-hoodie-ivory.webp"
            alt="Hoodie Ivory, colección ORIGEN Wolves Territory"
            className="absolute inset-0 h-full w-full object-cover object-[center_30%] transition-transform duration-700 group-hover:scale-[1.035]"
          />
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-[#102733]/35 via-transparent to-transparent"/>
          <div className="absolute bottom-8 left-8 font-mono text-[11px] font-semibold uppercase tracking-[0.25em] text-white sm:left-12">
            01 / THE ORIGIN LOOKBOOK
          </div>
        </Link>
        <div className="flex min-h-[370px] flex-col justify-center bg-[linear-gradient(135deg,#f3f8fa_0%,#dcebf1_100%)] px-8 py-16 sm:px-14 lg:px-16 xl:px-20">
          <p className="font-mono text-xs uppercase tracking-[0.22em] text-[#187E83]">LA COLECCIÓN</p>
          <h2 className="mt-6 text-[clamp(3.6rem,6.2vw,7rem)] font-black uppercase leading-[0.88] tracking-[-0.085em]">
            ORIGEN <span aria-hidden="true" className="text-[#087f90]">↗</span>
          </h2>
          <p className="mt-8 max-w-[410px] text-[15px] leading-7 text-[#355864] sm:text-[17px]">
            Descubre nuestras piezas, colores y siluetas. Una colección que nace del territorio.
          </p>
          <Link href="/#coleccion" className="mt-10 inline-flex w-fit items-center gap-12 border-b border-[#075F6C] pb-3 text-[14px] font-semibold text-[#075F6C] transition-colors hover:text-[#101820]">
            Explorar todas las prendas <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
