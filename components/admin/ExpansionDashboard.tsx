"use client";

type ExpansionDashboardProps = {
  fullName: string;
};

const workspaces = [
  {
    number: "01",
    eyebrow: "PORTFOLIO",
    title: "Mis prospectos",
    description:
      "Un espacio para construir y gestionar la cartera comercial asignada.",
    status: "Pendiente de conexión",
  },
  {
    number: "02",
    eyebrow: "TERRITORY INTELLIGENCE",
    title: "Mi territorio",
    description:
      "Lectura territorial basada en información geográfica verificable.",
    status: "Pendiente de conexión",
  },
  {
    number: "03",
    eyebrow: "FIELD COMMAND",
    title: "Actividad de campo",
    description:
      "Registro futuro de visitas, resultados y compromisos comerciales.",
    status: "Pendiente de conexión",
  },
  {
    number: "04",
    eyebrow: "INSTITUTIONAL MEMORY",
    title: "Memoria comercial",
    description:
      "Trazabilidad de decisiones y acontecimientos del proceso comercial.",
    status: "Pendiente de conexión",
  },
] as const;

export default function ExpansionDashboard({
  fullName,
}: ExpansionDashboardProps) {
  const displayName = fullName.trim() || "Representante";

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#171717]">
      <div className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 xl:px-12">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-7">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-[#a66a3d]">
              Wolves Territory / Commercial Operating System
            </p>
            <p className="mt-3 text-sm font-semibold uppercase tracking-[0.16em]">
              Expansion Field Command
            </p>
          </div>

          <span className="rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.13em]">
            Fundación V0.1
          </span>
        </header>

        <section className="relative mt-9 overflow-hidden rounded-[24px] bg-[#171717] px-6 py-12 text-white sm:px-10 sm:py-16 xl:px-14">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 -top-24 h-80 w-80 rounded-full border border-white/10"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-5 top-0 h-60 w-60 rounded-full border border-white/10"
          />

          <div className="relative z-10 max-w-3xl">
            <p className="text-[10px] font-semibold uppercase tracking-[0.27em] text-[#d6a477]">
              01 / Territorio comercial
            </p>

            <h1 className="mt-7 text-[clamp(2.5rem,6vw,5.5rem)] font-semibold uppercase leading-[0.98] tracking-[-0.065em]">
              El territorio
              <br />
              comienza aquí.
            </h1>

            <p className="mt-7 max-w-xl text-[13px] leading-7 text-white/65">
              Bienvenido, {displayName}. Este será tu espacio para
              desarrollar oportunidades, documentar actividades y
              construir relaciones comerciales con trazabilidad.
            </p>

            <div className="mt-10 flex flex-wrap gap-3">
              <span className="border border-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75">
                Expansion
              </span>
              <span className="border border-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75">
                Field Command
              </span>
              <span className="border border-white/20 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-white/75">
                Territory Intelligence
              </span>
            </div>
          </div>
        </section>

        <section className="mt-12" aria-labelledby="expansion-workspaces">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">
                02 / Arquitectura comercial
              </p>
              <h2
                id="expansion-workspaces"
                className="mt-2 text-[26px] font-semibold tracking-[-0.05em]"
              >
                Espacios de trabajo
              </h2>
            </div>

            <p className="text-[11px] text-black/45">
              4 capacidades previstas
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {workspaces.map((workspace) => (
              <article
                key={workspace.number}
                className="flex min-h-[270px] flex-col justify-between rounded-2xl border border-black/10 bg-white p-6"
              >
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <span className="text-[10px] font-semibold tracking-[0.18em] text-black/35">
                      {workspace.number}
                    </span>
                    <span
                      aria-hidden="true"
                      className="text-xl text-[#a66a3d]"
                    >
                      ◇
                    </span>
                  </div>

                  <p className="mt-8 text-[9px] font-semibold uppercase tracking-[0.18em] text-[#a66a3d]">
                    {workspace.eyebrow}
                  </p>

                  <h3 className="mt-2 text-xl font-semibold tracking-[-0.045em]">
                    {workspace.title}
                  </h3>

                  <p className="mt-3 text-[12px] leading-6 text-black/55">
                    {workspace.description}
                  </p>
                </div>

                <p className="mt-7 border-t border-black/10 pt-4 text-[10px] font-medium uppercase tracking-[0.1em] text-black/40">
                  {workspace.status}
                </p>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-12 flex flex-wrap justify-between gap-3 border-t border-black/10 pt-6 text-[10px] text-black/45">
          <span>Wolves Territory / Expansion V0.1</span>
          <span>
            Sin datos simulados · Sin conexión operativa
          </span>
        </footer>
      </div>
    </main>
  );
}
