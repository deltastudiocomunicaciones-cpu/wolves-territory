export default function FeaturedCollection() {
  return (
    <section
      id="coleccion"
      className="
        bg-[linear-gradient(135deg,#D9E3E8_0%,#B8D1DF_45%,#83C8C5_100%)]
        px-6 py-32 text-[#101820] md:px-12
      "
    >
      <div className="mx-auto max-w-[1600px]">

        {/* HEADER */}
        <div className="mb-20 text-center">
          <p className="text-xs font-semibold tracking-[0.4em] text-[#187E83]">
            CURRENT DROP
          </p>

          <h2 className="mt-4 text-4xl font-black uppercase tracking-[-0.03em] md:text-6xl">
            ORIGEN COLLECTION
          </h2>

          <div className="mx-auto mt-7 h-px w-16 bg-[#101820]/20" />
        </div>

        {/* COLLECTION */}
        <div className="grid gap-6 md:grid-cols-2">

          {/* CARD 01 */}
          <article className="group relative overflow-hidden rounded-[2rem] border border-[#101820]/10 bg-white/10 shadow-[0_30px_80px_rgba(16,24,32,0.08)]">
            <img
              src="/images/polo-origen.png"
              alt="Polo Origen"
              className="h-[650px] w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.025]"
            />

            {/* OVERLAY MUY SUTIL */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/55 via-[#101820]/5 to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-10">

              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#83C8C5]">
                ESSENTIAL
              </p>

              <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.025em] text-white md:text-4xl">
                POLO ORIGEN
              </h3>

              <div className="mt-6 h-px w-10 bg-white/45 transition-all duration-500 group-hover:w-20" />

            </div>
          </article>

          {/* CARD 02 */}
          <article className="group relative overflow-hidden rounded-[2rem] border border-[#101820]/10 bg-white/10 shadow-[0_30px_80px_rgba(16,24,32,0.08)]">
            <img
              src="/images/drop-collection-2.png"
              alt="Origen Collection"
              className="h-[650px] w-full object-cover transition duration-[1200ms] ease-out group-hover:scale-[1.025]"
            />

            {/* OVERLAY MUY SUTIL */}
            <div className="absolute inset-0 bg-gradient-to-t from-[#101820]/55 via-[#101820]/5 to-transparent" />

            <div className="absolute bottom-0 left-0 w-full p-8 md:p-10">

              <p className="text-[10px] font-semibold uppercase tracking-[0.32em] text-[#83C8C5]">
                MOVEMENT
              </p>

              <h3 className="mt-3 text-3xl font-black uppercase tracking-[-0.025em] text-white md:text-4xl">
                ORIGEN SHORT
              </h3>

              <div className="mt-6 h-px w-10 bg-white/45 transition-all duration-500 group-hover:w-20" />

            </div>
          </article>

        </div>
      </div>
    </section>
  );
}