export default function Hero() {
  return (
    <section className="relative min-h-[100svh] overflow-hidden bg-black">
      {/* BACKGROUND */}
      <img
        src="/images/hero-wolves.png"
        alt="Wolves Territory Campaign"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/25" />

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1600px] items-end px-6 pb-14 pt-36 sm:pb-16 md:px-10 md:pb-18 md:pt-40 lg:px-14 lg:pb-16 xl:px-16 xl:pb-20">
        <div className="grid w-full items-end gap-10 lg:grid-cols-[minmax(0,1.45fr)_minmax(280px,0.55fr)] lg:gap-12 xl:gap-16">

          {/* LEFT */}
          <div className="min-w-0">
            <div className="mb-6 flex items-center gap-4 md:mb-7">
              <span className="h-px w-10 shrink-0 bg-[#c9a96e]" />

              <p className="text-[9px] font-medium uppercase tracking-[0.4em] text-[#c9a96e] sm:text-[10px] md:text-[11px]">
                Origen · Primera Colección
              </p>
            </div>

            <h1 className="max-w-[1050px] text-[clamp(4.4rem,8.2vw,9rem)] font-black uppercase leading-[0.78] tracking-[-0.06em] text-white">
              Usa
              <br />
              el
              <br />
              Territorio
            </h1>
          </div>

          {/* RIGHT */}
          <div className="w-full max-w-[390px] lg:justify-self-end lg:pb-2 xl:pb-4">
            <p className="max-w-sm text-[13px] leading-6 text-white/60 md:text-sm md:leading-7 xl:text-[15px]">
              Diseñado para hombres que se mueven con intención.
              Una vestimenta construida en torno a la presencia, la disciplina
              y la identidad.
            </p>

            <div className="mt-7 flex flex-col gap-4 md:mt-8 md:gap-5">
              <a
                href="#coleccion"
                className="group inline-flex items-center justify-between border-b border-white/35 pb-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-white transition hover:border-[#c9a96e] hover:text-[#c9a96e] md:text-xs md:tracking-[0.28em]"
              >
                Shop Origen

                <span className="transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </a>

              <a
                href="#nosotros"
                className="group inline-flex items-center justify-between border-b border-white/15 pb-4 text-[10px] font-semibold uppercase tracking-[0.26em] text-white/55 transition hover:border-white/40 hover:text-white md:text-xs md:tracking-[0.28em]"
              >
                Descubre Wolves territory

                <span className="transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* BOTTOM META */}
      <div className="absolute bottom-5 right-6 z-20 hidden items-center gap-6 text-[9px] uppercase tracking-[0.3em] text-white/35 md:flex md:right-10 lg:right-14 xl:right-16">
        <span>Wolves Territory</span>
        <span>—</span>
        <span>Colombia · 2026</span>
      </div>
    </section>
  );
}