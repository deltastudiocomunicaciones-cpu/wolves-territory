
import Link from "next/link";

export default function ThePack() {
  return (
    <section
      id="the-pack"
      aria-labelledby="the-pack-title"
      className="relative isolate overflow-hidden bg-[#101010] text-white"
    >
      {/* Fondo editorial sin depender de nuevos archivos */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.035]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg,white 0px,white 1px,transparent 1px,transparent 90px)",
        }}
      />

      <div className="relative mx-auto max-w-[1600px] px-6 py-20 md:px-10 md:py-28 lg:px-14 lg:py-36 xl:px-16">
        {/* Encabezado */}
        <div className="mb-12 flex items-center justify-between gap-6 border-b border-white/15 pb-6">
          <div className="flex items-center gap-4">
            <span className="h-px w-9 bg-[#c9a96e]" />
            <span className="text-[10px] font-semibold uppercase tracking-[0.34em] text-[#c9a96e]">
              Wolves Territory / 002
            </span>
          </div>
          <span className="hidden text-[10px] uppercase tracking-[0.25em] text-white/35 sm:block">
            The Pack
          </span>
        </div>

        <div className="grid items-center gap-14 lg:grid-cols-[1.15fr_0.85fr] lg:gap-20">
          {/* Manifiesto */}
          <div>
            <p className="mb-6 text-[11px] uppercase tracking-[0.42em] text-white/45">
              Identidad · Pertenencia · Territorio
            </p>

            <h2
              id="the-pack-title"
              className="text-[clamp(4.2rem,11vw,11rem)] font-black uppercase leading-[0.76] tracking-[-0.085em]"
            >
              THE
              <br />
              <span className="text-[#c9a96e]">PACK.</span>
            </h2>

            <div className="mt-12 max-w-xl border-l border-[#c9a96e]/70 pl-6 md:mt-16 md:pl-8">
              <p className="text-xl font-light leading-relaxed text-white/90 md:text-2xl">
                El territorio no se hereda.
                <br />
                <strong className="font-semibold text-white">
                  Se construye.
                </strong>
              </p>
              <p className="mt-6 max-w-md text-sm leading-8 text-white/55">
                No seguimos caminos trazados por otros.
                Avanzamos con identidad, carácter y propósito.
                Cada paso expresa quiénes somos.
                Cada decisión deja una huella.
              </p>
            </div>

            <Link
              href="#coleccion"
              className="group mt-12 inline-flex items-center gap-10 border-b border-white/40 pb-4 text-[11px] font-semibold uppercase tracking-[0.25em] transition-colors hover:border-[#c9a96e] hover:text-[#c9a96e]"
            >
              Explora ORIGEN
              <span
                aria-hidden="true"
                className="text-xl transition-transform duration-300 group-hover:translate-x-2"
              >
                ↗
              </span>
            </Link>
          </div>

          {/* Composición gráfica */}
          <div className="relative min-h-[420px] overflow-hidden border border-white/10 bg-[#181818] sm:min-h-[520px]">
            <div
              aria-hidden="true"
              className="absolute inset-0"
              style={{
                background:
                  "radial-gradient(circle at 55% 40%, #343434 0%, #171717 40%, #080808 90%)",
              }}
            />

            {/* Luna abstracta */}
            <div
              aria-hidden="true"
              className="absolute left-1/2 top-[16%] h-56 w-56 -translate-x-1/2 rounded-full border border-white/15 bg-gradient-to-br from-white/25 via-white/10 to-transparent blur-[1px] sm:h-72 sm:w-72"
            />

            {/* Número editorial */}
            <span
              aria-hidden="true"
              className="absolute -bottom-10 -right-4 select-none text-[230px] font-black leading-none tracking-[-0.12em] text-white/[0.035] sm:text-[320px]"
            >
              01
            </span>

            <div className="absolute inset-x-8 top-8 flex justify-between text-[9px] uppercase tracking-[0.3em] text-white/45">
              <span>Origin / Identity</span>
              <span>WT — 2026</span>
            </div>

            <div className="absolute inset-x-8 bottom-9">
              <div className="mb-5 h-px w-full bg-white/20" />
              <p className="text-[clamp(2rem,5vw,4.5rem)] font-black uppercase leading-[0.92] tracking-[-0.065em]">
                NEVER
                <br />
                WALK
                <br />
                ALONE.
              </p>
              <p className="mt-5 text-[10px] uppercase tracking-[0.32em] text-[#c9a96e]">
                One identity. One territory.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-20 grid gap-5 border-t border-white/15 pt-7 text-[10px] uppercase tracking-[0.24em] text-white/40 sm:grid-cols-3">
          <span>01 / Identidad</span>
          <span>02 / Carácter</span>
          <span>03 / Pertenencia</span>
        </div>
      </div>
    </section>
  );
}
