import Link from "next/link";

export default function Footer() {
  return (
    <footer>

      {/* =====================================================
          TRUST STRIP · BLACK
      ===================================================== */}

      <section className="border-b border-white/10 bg-black text-white">

        <div className="mx-auto grid max-w-[1600px] grid-cols-2 lg:grid-cols-4">

          <TrustItem
            eyebrow="Secure Checkout"
            title="Pago seguro"
            description="Pagos procesados con Wompi."
          />

          <TrustItem
            eyebrow="Colombia"
            title="Envíos nacionales"
            description="Seguimiento de tu pedido."
          />

          <TrustItem
            eyebrow="Territory Care"
            title="Cambios"
            description="Proceso simple y acompañado."
          />

          <TrustItem
            eyebrow="Support"
            title="Estamos contigo"
            description="Soporte Wolves Territory."
          />

        </div>

      </section>

      {/* =====================================================
          MAIN FOOTER · ICE
      ===================================================== */}

      <section className="bg-[#EEF2F3] px-6 py-16 text-[#101820] md:px-10 lg:px-14 lg:py-20">

        <div className="mx-auto max-w-[1600px]">

          <div className="grid gap-14 lg:grid-cols-[1.35fr_0.65fr_0.65fr_0.7fr]">

            {/* BRAND */}

            <div className="max-w-lg">

              <p className="text-[9px] font-semibold uppercase tracking-[0.38em] text-[#187E83]">
                Wolves Territory
              </p>

              <h2 className="mt-6 text-5xl font-semibold uppercase leading-[0.86] tracking-[-0.06em] md:text-6xl">
                Usa
                <br />
                el Territorio.
              </h2>

              <p className="mt-8 max-w-sm text-sm leading-7 text-[#101820]/50">
                Una marca construida desde la disciplina,
                la identidad y el territorio.
              </p>

              <p className="mt-8 text-[9px] uppercase tracking-[0.24em] text-[#101820]/30">
                Medellín · Colombia
              </p>

            </div>

            {/* SHOP */}

            <FooterColumn title="Shop">

              <FooterLink href="/#coleccion">
                New Drop
              </FooterLink>

              <FooterLink href="/#coleccion">
                Tienda
              </FooterLink>

              <FooterLink href="/">
                Wolves Territory
              </FooterLink>

            </FooterColumn>

            {/* TERRITORY */}

            <FooterColumn title="Territory">

              <FooterLink href="/seller/apply">
                Haz parte del territorio
              </FooterLink>

              <FooterLink href="/seller/login">
                Vendedor Login
              </FooterLink>

              <FooterLink href="/#collections">
                Colecciones
              </FooterLink>

            </FooterColumn>

            {/* SUPPORT */}

            <FooterColumn title="Support">

              <a
                href="mailto:wolvesterritoryco@gmail.com"
                className="text-sm text-[#101820]/55 transition-colors duration-300 hover:text-[#187E83]"
              >
                Contacto
              </a>

              <p className="text-sm text-[#101820]/45">
                Envíos
              </p>

              <p className="text-sm text-[#101820]/45">
                Cambios
              </p>

              <p className="text-sm text-[#101820]/45">
                Privacidad
              </p>

            </FooterColumn>

          </div>

        </div>

      </section>

      {/* =====================================================
          SELLER NETWORK · POWDER
      ===================================================== */}

      <section className="border-y border-[#101820]/10 bg-[#D9E3E8] px-6 py-16 text-[#101820] md:px-10 lg:px-14 lg:py-20">

        <div className="mx-auto grid max-w-[1600px] gap-12 lg:grid-cols-[1fr_auto] lg:items-end">

          {/* COPY */}

          <div>

            <p className="text-[9px] font-semibold uppercase tracking-[0.32em] text-[#187E83]">
              comunidad de vendedores
            </p>

            <h3 className="mt-5 max-w-3xl text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] text-[#101820] md:text-5xl lg:text-6xl">
              Haz parte
              <br />
              del territorio.
            </h3>

            <p className="mt-6 max-w-xl text-sm leading-7 text-[#101820]/55">
              Empieza una aventura vendiendo Wolves Territory.
              Construye tu red, comparte la marca y genera
              ingresos desde tu propio territorio.
            </p>

          </div>

          {/* WOLVES SIGNATURE + ACTIONS */}

          <div className="flex flex-col items-start lg:items-end">

            <div className="mb-7 flex w-full justify-start lg:justify-end">

              <img
                src="/images/brands/wolves-territory.png"
                alt="Wolves Territory"
                className="h-auto w-[190px] object-contain md:w-[220px]"
              />

            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row lg:flex-col">

              <Link
                href="/seller/apply"
                className="group flex min-w-64 items-center justify-between bg-[#101820] px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white transition duration-300 hover:bg-[#187E83]"
              >
                Quiero ser Lobo

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

              <Link
                href="/seller/login"
                className="group flex min-w-64 items-center justify-between border border-[#101820]/25 px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-[#101820] transition duration-300 hover:border-[#101820] hover:bg-[#EEF2F3]"
              >
                Ya soy Lobo

                <span className="transition-transform duration-300 group-hover:translate-x-1">
                  →
                </span>
              </Link>

            </div>

          </div>

        </div>

      </section>

      {/* =====================================================
          INSTITUTIONAL SIGNATURE · ICE
      ===================================================== */}

      <section className="bg-[#EEF2F3] px-6 py-12 text-[#101820] md:px-10 lg:px-14 lg:py-14">

        <div className="mx-auto max-w-[1600px]">

          <div className="grid gap-12 md:grid-cols-3 md:items-center">

            {/* GRUPO A&C */}

            <div>

              <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#101820]/35">
                Una marca del
              </p>

              <a
                href="https://www.grupoayc.co"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Visitar Grupo Análisis & Consultorías"
                className="mt-5 inline-block transition duration-300 hover:opacity-70"
           >
              <img
               src="/images/brands/grupo-ayc.png"
               alt="Grupo Análisis & Consultorías"
               className="h-auto w-[190px] object-contain"
           />
              </a>

              <p className="mt-4 max-w-xs text-[8px] uppercase leading-5 tracking-[0.18em] text-[#101820]/35">
                Grupo Análisis & Consultorías
              </p>

            </div>

            {/* WOLVES CENTRAL SIGNATURE */}

            <div className="md:text-center">

              <p className="text-[10px] font-semibold uppercase tracking-[0.32em]">
                Wolves Territory
              </p>

              <p className="mt-3 text-[8px] uppercase tracking-[0.24em] text-[#101820]/35">
                Derechos reservados · 2025
              </p>

              <div className="mx-auto mt-6 hidden h-px w-20 bg-[#101820]/15 md:block" />

            </div>

            {/* FASI */}

            <div className="md:flex md:flex-col md:items-end md:text-right">

              <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#101820]/35">
                Plataforma desarrollada por
              </p>

              <a
              href="https://www.fasi.com.co"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Visitar FASI"
              className="mt-5 inline-block transition duration-300 hover:opacity-70"
              >
             <img
             src="/images/brands/fasi.png"
             alt="FASI"
             className="h-auto w-[130px] object-contain"
             />
             </a>

            </div>

          </div>

          {/* MICRO SIGNATURE */}

          <div className="mt-12 border-t border-[#101820]/10 pt-6">

            <div className="flex flex-col gap-3 text-[7px] uppercase tracking-[0.24em] text-[#101820]/25 sm:flex-row sm:items-center sm:justify-between">

              <p>
                Wolves Territory · Medellín · Colombia
              </p>

              <p>
                Diseñado para el Territorio
              </p>

            </div>

          </div>

        </div>

      </section>

    </footer>
  );
}

/* =========================================================
 * TRUST ITEM
 * ========================================================= */

function TrustItem({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div className="border-b border-r border-white/10 px-5 py-8 last:border-r-0 lg:border-b-0 lg:px-8">

      <p className="text-[7px] uppercase tracking-[0.28em] text-white/25">
        {eyebrow}
      </p>

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
        {title}
      </p>

      <p className="mt-2 max-w-xs text-xs leading-5 text-white/35">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
 * FOOTER COLUMN
 * ========================================================= */

function FooterColumn({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>

      <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-[#101820]/35">
        {title}
      </p>

      <div className="mt-6 flex flex-col gap-4">
        {children}
      </div>

    </div>
  );
}

/* =========================================================
 * FOOTER LINK
 * ========================================================= */

function FooterLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="text-sm text-[#101820]/55 transition-colors duration-300 hover:text-[#187E83]"
    >
      {children}
    </Link>
  );
}