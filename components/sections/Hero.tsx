import Link from "next/link";

const pillars = [
  { title: "Diseño propio", detail: "Colecciones limitadas", icon: "layers" },
  { title: "Territorio local", detail: "Inspirado en Medellín", icon: "pin" },
  { title: "Colección ORIGEN", detail: "Identidad en cada prenda", icon: "star" },
  { title: "Comunidad WT", detail: "Más que ropa, un territorio", icon: "people" },
] as const;

function PillarIcon({ name }: { name: typeof pillars[number]["icon"] }) {
  const common = { fill: "none", stroke: "currentColor", strokeWidth: 1.7, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  return <svg width="29" height="29" viewBox="0 0 32 32" aria-hidden="true" {...common}>
    {name === "layers" && <><path d="M16 3 29 10 16 17 3 10 16 3Z" /><path d="m3 16 13 7 13-7M3 22l13 7 13-7" /></>}
    {name === "pin" && <><path d="M25 14c0 7-9 15-9 15S7 21 7 14a9 9 0 0 1 18 0Z" /><circle cx="16" cy="14" r="3" /></>}
    {name === "star" && <><path d="m16 2 3.8 10.2L30 16l-10.2 3.8L16 30l-3.8-10.2L2 16l10.2-3.8L16 2Z" /></>}
    {name === "people" && <><circle cx="12" cy="10" r="5" /><path d="M2.5 26v-2a9.5 9.5 0 0 1 19 0v2M21 6a5 5 0 0 1 0 10M23 20a8 8 0 0 1 6.5 8" /></>}
  </svg>;
}

export default function Hero() {
  return (
    <>
      <section className="relative isolate min-h-[680px] overflow-hidden bg-[#dceef5] text-[#101820] sm:min-h-[740px] lg:min-h-[740px]">
        <div aria-hidden="true" className="absolute inset-0 -z-20 bg-[#bfdae5]">
          <div className="absolute inset-0 bg-[url('/images/wt-hero-real.webp')] bg-cover bg-[position:57%_center] bg-no-repeat" />
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 bg-[linear-gradient(90deg,rgba(219,239,248,0.98)_0%,rgba(220,239,247,0.96)_26%,rgba(215,236,244,0.72)_39%,rgba(215,235,243,0.12)_57%,transparent_75%)] max-lg:bg-[linear-gradient(90deg,rgba(219,239,248,0.98)_0%,rgba(220,239,247,0.87)_43%,rgba(215,236,244,0.15)_80%)] max-sm:bg-[linear-gradient(180deg,rgba(224,241,248,0.96)_0%,rgba(222,240,247,0.91)_46%,rgba(220,240,247,0.1)_85%)]" />
        <div className="relative z-10 mx-auto flex min-h-[680px] w-full max-w-[1600px] flex-col justify-between px-6 pb-10 pt-[150px] sm:min-h-[740px] sm:px-10 md:pt-[175px] lg:min-h-[740px] lg:px-16">
          <div className="max-w-[650px]">
            <p className="mb-7 flex items-center gap-5 font-mono text-[11px] font-semibold uppercase tracking-[0.15em] text-[#087889] sm:text-[13px]">
              COLECCIÓN 01 / MEDELLÍN <span className="h-px w-9 bg-[#101820]" />
            </p>
            <h1 className="text-[clamp(4.9rem,10.2vw,9.3rem)] font-black uppercase leading-[0.83] tracking-[-0.09em]">ORIGEN</h1>
            <p className="mt-8 max-w-[470px] text-[17px] leading-[1.5] text-[#101820] sm:text-[22px]">
              Diseño urbano. Identidad propia.<br/>Prendas para habitar tu territorio.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Link href="/#coleccion" className="inline-flex min-h-[50px] items-center justify-center gap-5 bg-[#075F6C] px-7 py-3 text-[13px] font-semibold text-white transition-colors hover:bg-[#064b58]">
                Explorar colección <span aria-hidden="true">↗</span>
              </Link>
              <Link href="/#the-pack" className="inline-flex min-h-[50px] items-center justify-center border border-[#075F6C] bg-[#e0f1f6]/30 px-7 py-3 text-[13px] font-semibold text-[#075F6C] transition-colors hover:bg-[#e0f1f6]">
                Ver lookbook
              </Link>
            </div>
          </div>
          <div className="mt-16 font-mono text-[11px] leading-6 tracking-[0.06em] text-[#45616a]">
            <p>6.2442° N — 75.5812° W</p>
            <p>MEDELLÍN, CO</p>
          </div>
        </div>
        <div aria-hidden="true" className="absolute bottom-[30%] right-8 z-10 hidden flex-col items-center gap-4 font-mono text-xs text-white lg:flex"><span>01</span><span className="h-6 w-px bg-white" /><span>01</span></div>
      </section>
      <section aria-label="Filosofía Wolves Territory" className="border-b border-[#dce6e9] bg-[#fbfcfd] text-[#101820]">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 gap-y-6 px-6 py-7 sm:px-10 md:grid-cols-4 md:gap-y-0 lg:px-16">
          {pillars.map((p, index) => (
            <div key={p.title} className={`flex items-start gap-4 px-2 sm:gap-5 md:px-5 ${index > 0 ? "md:border-l md:border-[#afbdc4]" : ""}`}>
              <div className="shrink-0 text-[#101820]"><PillarIcon name={p.icon} /></div>
              <div><h2 className="text-[13px] font-semibold sm:text-[15px]">{p.title}</h2><p className="mt-1 text-xs leading-5 text-[#3e5c65]">{p.detail}</p></div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}