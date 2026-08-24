import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-black text-white">

      {/* =====================================================
          TRUST STRIP
      ===================================================== */}

      <section className="border-b border-white/10">
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
          MAIN FOOTER
      ===================================================== */}

      <section className="px-6 py-16 md:px-10 lg:px-14 lg:py-20">
        <div className="mx-auto max-w-[1600px]">

          <div className="grid gap-14 lg:grid-cols-[1.35fr_0.65fr_0.65fr_0.7fr]">

            {/* BRAND */}

            <div className="max-w-lg">

              <p className="text-[9px] uppercase tracking-[0.38em] text-[#c9a96e]">
                Wolves Territory
              </p>

              <h2 className="mt-6 text-5xl font-semibold uppercase leading-[0.86] tracking-[-0.06em] md:text-6xl">
                Wear
                <br />
                the Territory.
              </h2>

              <p className="mt-8 max-w-sm text-sm leading-7 text-white/45">
                Una marca construida desde la disciplina,
                la identidad y el territorio.
              </p>

              <p className="mt-8 text-[9px] uppercase tracking-[0.24em] text-white/25">
                Medellín · Colombia
              </p>

            </div>

            {/* SHOP */}

            <FooterColumn title="Shop">

              <FooterLink href="/">
                New Drop
              </FooterLink>

              <FooterLink href="/#shop">
                Shop All
              </FooterLink>

              <FooterLink href="/cart">
                Your Bag
              </FooterLink>

            </FooterColumn>

            {/* TERRITORY */}

            <FooterColumn title="Territory">

              <FooterLink href="/seller/apply">
                Haz parte del territorio
              </FooterLink>

              <FooterLink href="/seller/login">
                Seller Login
              </FooterLink>

              <FooterLink href="/">
                Wolves Territory
              </FooterLink>

            </FooterColumn>

            {/* SUPPORT */}

            <FooterColumn title="Support">

              <a
                href="mailto:wolvesterritoryco@gmail.com"
                className="text-sm text-white/45 transition hover:text-white"
              >
                Contacto
              </a>

              <p className="text-sm text-white/35">
                Envíos
              </p>

              <p className="text-sm text-white/35">
                Cambios
              </p>

              <p className="text-sm text-white/35">
                Privacidad
              </p>

            </FooterColumn>

          </div>

        </div>
      </section>

      {/* =====================================================
          SELLER NETWORK CTA
      ===================================================== */}

      <section className="border-y border-white/10 px-6 py-14 md:px-10 lg:px-14">
        <div className="mx-auto grid max-w-[1600px] gap-10 lg:grid-cols-[1fr_auto] lg:items-end">

          <div>

            <p className="text-[9px] uppercase tracking-[0.32em] text-[#c9a96e]">
              Seller Network
            </p>

            <h3 className="mt-5 max-w-3xl text-4xl font-semibold uppercase leading-[0.92] tracking-[-0.05em] md:text-5xl lg:text-6xl">
              Haz parte
              <br />
              del territorio.
            </h3>

            <p className="mt-6 max-w-xl text-sm leading-7 text-white/45">
              Empieza una aventura vendiendo Wolves Territory.
              Construye tu red, comparte la marca y genera
              ingresos desde tu propio territorio.
            </p>

          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">

            <Link
              href="/seller/apply"
              className="group flex min-w-64 items-center justify-between bg-white px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-black transition hover:bg-[#c9a96e]"
            >
              Quiero ser Seller

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/seller/login"
              className="group flex min-w-64 items-center justify-between border border-white/20 px-6 py-5 text-[9px] font-semibold uppercase tracking-[0.25em] text-white transition hover:border-white"
            >
              Ya soy Seller

              <span className="transition-transform duration-300 group-hover:translate-x-1">
                →
              </span>
            </Link>

          </div>

        </div>
      </section>

      {/* =====================================================
          BOTTOM
      ===================================================== */}

      <section className="px-6 py-7 md:px-10 lg:px-14">

        <div className="mx-auto flex max-w-[1600px] flex-col gap-5 text-[8px] uppercase tracking-[0.22em] text-white/25 md:flex-row md:items-center md:justify-between">

          <p>
            Wolves Territory © {new Date().getFullYear()}
          </p>

          <div className="flex flex-wrap gap-x-6 gap-y-3">

            <span>
              Built for Territory
            </span>

            <span>
              Colombia
            </span>

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

      <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.16em]">
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

      <p className="text-[8px] font-semibold uppercase tracking-[0.28em] text-white/30">
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
      className="text-sm text-white/45 transition hover:text-white"
    >
      {children}
    </Link>
  );
}