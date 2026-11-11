import Link from "next/link";

const pillars = [
  { index: "01", title: "Diseño propio", detail: "Colección ORIGEN" },
  { index: "02", title: "Territorio local", detail: "Medellín, Colombia" },
  { index: "03", title: "Identidad en cada pieza", detail: "Moda masculina" },
  { index: "04", title: "Comunidad WT", detail: "Un territorio compartido" },
];

export default function Hero() {
  return (
    <>
      <section className="relative isolate flex min-h-[740px] flex-col overflow-hidden bg-[#dcebf1] text-[#101820] md:min-h-[780px] xl:min-h-[810px]">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_30%_30%,#f3f8fa_0%,#c6e1ec_47%,#adcbd9_100%)]" />
        <div className="pointer-events-none absolute -right-[14%] top-[11%] -z-10 h-[118%] w-[57%] rotate-[25deg] border-l-[14px] border-white/65 bg-[linear-gradient(110deg,#eff5f6_0%,#d8e5e9_55%,#bbd0d6_100%)] shadow-[-20px_0_65px_rgba(27,79,100,0.06)] md:-right-[7%]" />
        <div className="pointer-events-none absolute inset-y-0 right-0 -z-10 w-full bg-[linear-gradient(90deg,rgba(231,242,246,0)_12%,rgba(231,242,246,0)_49%,rgba(231,242,246,0.08)_100%)]" />
        <div className="absolute bottom-0 right-[-9%] top-[90px] z-0 w-[93%] sm:right-[-3%] sm:w-[73%] lg:right-[4%] lg:top-[65px] lg:w-[59%] xl:right-[6%]">
          <img
            src="/products/origen-hoodie-ivory.webp"
            alt="Hoodie ORIGEN Ivory de Wolves Territory"
            className="h-full w-full object-contain object-bottom drop-shadow-[0_18px_30px_rgba(16,24,32,0.12)]"
          />
        </div>
        <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-b from-[#e8f2f5]/80 via-[#e8f2f5]/25 to-[#d4e5eb]/5 sm:bg-gradient-to-r sm:from-[#e7f3f8]/85 sm:via-[#d7e8ed]/30 sm:to-transparent" />
        <div className="relative z-10 mx-auto flex w-full max-w-[1600px] flex-1 flex-col justify-between px-6 pb-10 pt-36 sm:px-10 md:pb-14 md:pt-48 lg:px-16">
          <div className="max-w-[760px]">
            <p className="mb-7 flex items-center gap-5 font-mono text-[10px] font-medium uppercase tracking-[0.22em] text-[#187E83] sm:text-xs">
              COLECCIÓN 01 / MEDELLÍN <span className="h-px w-10 bg-[#101820]"/>
            </p>
            <h1 className="text-[clamp(4.6rem,13.5vw,10.8rem)] font-black uppercase leading-[0.8] tracking-[-0.095em]">ORIGEN</h1>
            <p className="mt-8 max-w-[400px] text-[16px] leading-[1.65] text-[#101820] sm:text-[20px]">
              Diseño urbano. Identidad propia.<br/>Prendas para habitar tu territorio.
            </p>
            <div className="mt-8 flex flex-wrap gap-3 sm:mt-10">
              <Link href="/#coleccion" className="inline-flex min-h-12 items-center justify-center gap-5 bg-[#075F6C] px-6 py-3 text-xs font-semibold text-white transition-colors hover:bg-[#074551] sm:text-sm">
                Explorar colección <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/#the-pack" className="inline-flex min-h-12 items-center justify-center border border-[#075F6C] px-6 py-3 text-xs font-semibold text-[#075F6C] transition-colors hover:bg-white/60 sm:text-sm">
                Ver lookbook
              </Link>
            </div>
          </div>
          <div className="mt-40 font-mono text-[10px] leading-6 tracking-[0.08em] text-[#425b65]/80 sm:mt-16">
            <p>6.2442° N — 75.5812° W</p>
            <p>MEDELLÍN, CO</p>
          </div>
        </div>
        <div className="absolute bottom-12 right-6 z-10 hidden flex-col items-center gap-3 font-mono text-[11px] text-white lg:flex">
          <span>01</span><span className="h-8 w-px bg-white/80"/><span>01</span>
        </div>
      </section>
      <section aria-label="Filosofía Wolves Territory" className="bg-[#f8fafb] text-[#101820]">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-y-8 px-6 py-8 sm:px-10 md:grid-cols-4 lg:px-16 lg:py-10">
          {pillars.map((pillar, index) => (
            <div key={pillar.index} className={`flex gap-4 border-[#b3c2c8] px-2 sm:gap-5 md:px-5 ${index ? "md:border-l" : ""}`}>
              <span className="mt-0.5 font-mono text-xs text-[#187E83]">{pillar.index}</span>
              <div>
                <h2 className="text-sm font-semibold sm:text-[15px]">{pillar.title}</h2>
                <p className="mt-1 text-xs text-[#566e78]">{pillar.detail}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}