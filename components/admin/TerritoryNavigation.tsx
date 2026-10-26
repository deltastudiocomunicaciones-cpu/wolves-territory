
"use client";

import Link from "next/link";

type TerritoryNavigationProps = {
  section: string;
  parentLabel: string;
  parentHref: string;
  rootLevel?: boolean;
};

export default function TerritoryNavigation({
  section,
  parentLabel,
  parentHref,
  rootLevel = false,
}: TerritoryNavigationProps) {
  return (
    <nav
      aria-label="Navegación administrativa"
      className="mb-8 border-b border-black/10 pb-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-4">
        <Link
          href={parentHref}
          className="group inline-flex items-center gap-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-black/55 transition hover:text-black"
        >
          <span
            aria-hidden="true"
            className="text-lg transition-transform group-hover:-translate-x-1"
          >
            ←
          </span>

          Volver a {parentLabel}
        </Link>

        <span className="text-[9px] uppercase tracking-[0.22em] text-black/30">
          WT / CONTROL
        </span>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-2 text-[10px]">
        <Link
          href="/admin"
          className="text-black/45 transition hover:text-black"
        >
          Territory Control
        </Link>

        {!rootLevel && (
          <>
            <span aria-hidden="true" className="text-black/25">
              /
            </span>

            <Link
              href={parentHref}
              className="text-black/45 transition hover:text-black"
            >
              {parentLabel}
            </Link>
          </>
        )}

        <span aria-hidden="true" className="text-black/25">
          /
        </span>

        <span
          aria-current="page"
          className="font-semibold text-black"
        >
          {section}
        </span>
      </div>
    </nav>
  );
}
