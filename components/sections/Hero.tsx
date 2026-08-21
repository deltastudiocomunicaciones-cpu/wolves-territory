export default function Hero() {
  return (
    <section className="relative min-h-screen overflow-hidden bg-black">
      {/* BACKGROUND */}
      <img
        src="/images/hero-wolves.jpg"
        alt="Wolves Territory Campaign"
        className="absolute inset-0 h-full w-full object-cover object-center"
      />

      {/* OVERLAYS */}
      <div className="absolute inset-0 bg-black/25" />
      <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/45 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/25" />

      {/* CONTENT */}
      <div className="relative z-10 mx-auto flex min-h-screen max-w-[1600px] items-end px-6 pb-16 pt-40 md:px-12 md:pb-20 lg:px-16">
        <div className="grid w-full items-end gap-12 lg:grid-cols-[1.4fr_0.6fr]">
          
          {/* LEFT */}
          <div>
            <div className="mb-7 flex items-center gap-4">
              <span className="h-px w-10 bg-[#c9a96e]" />
              <p className="text-[10px] font-medium uppercase tracking-[0.45em] text-[#c9a96e] md:text-xs">
                Origen · First Season
              </p>
            </div>

            <h1 className="max-w-5xl text-[14vw] font-black uppercase leading-[0.78] tracking-[-0.06em] text-white sm:text-[11vw] md:text-[9vw] lg:text-[7.5vw]">
              Wear
              <br />
              The
              <br />
              Territory
            </h1>
          </div>

          {/* RIGHT */}
          <div className="max-w-sm lg:pb-3">
            <p className="text-sm leading-7 text-white/60 md:text-[15px]">
              Designed for men who move with intention.
              A wardrobe built around presence, discipline
              and identity.
            </p>

            <div className="mt-8 flex flex-col gap-5">
              <a
                href="#coleccion"
                className="group inline-flex items-center justify-between border-b border-white/35 pb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white transition hover:border-[#c9a96e] hover:text-[#c9a96e]"
              >
                Shop Origen

                <span className="transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </a>

              <a
                href="#nosotros"
                className="group inline-flex items-center justify-between border-b border-white/15 pb-4 text-xs font-semibold uppercase tracking-[0.28em] text-white/55 transition hover:border-white/40 hover:text-white"
              >
                Discover Wolves

                <span className="transition-transform duration-300 group-hover:translate-x-2">
                  →
                </span>
              </a>
            </div>
          </div>

        </div>
      </div>

      {/* BOTTOM META */}
      <div className="absolute bottom-5 right-6 z-20 hidden items-center gap-6 text-[9px] uppercase tracking-[0.3em] text-white/35 md:flex md:right-12 lg:right-16">
        <span>Wolves Territory</span>
        <span>—</span>
        <span>Colombia · 2026</span>
      </div>
    </section>
  );
}