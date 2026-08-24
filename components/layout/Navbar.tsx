"use client";

import { useState } from "react";
import Link from "next/link";

import { useCart } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);

  const { totalItems } = useCart();

  const navLinks = [
    {
      label: "NEW",
      href: "/#coleccion",
    },
    {
      label: "SHOP",
      href: "/#coleccion",
    },
    {
      label: "COLECCIONES",
      href: "/#collections",
    },
    {
      label: "CAPS",
      href: "/?category=Cap#coleccion",
    },
    {
      label: "APPAREL",
      href: "/?category=Hoodie#coleccion",
    },
    {
      label: "TIENDAS",
      href: "/#stores",
    },
  ];

  return (
    <>
      {/* =====================================================
          ANNOUNCEMENT BAR · POWDER
      ===================================================== */}

      <div className="fixed top-0 z-[60] w-full border-b border-[#101820]/10 bg-[#D9E3E8] text-[#101820]">
        <div className="flex h-8 items-center justify-center px-4 text-center text-[9px] font-medium uppercase tracking-[0.22em] text-[#101820]/60 md:tracking-[0.28em]">
          Envío gratis en pedidos seleccionados · Pago Seguro · Colombia
        </div>
      </div>

      {/* =====================================================
          NAVBAR · AQUA
      ===================================================== */}

      <nav className="fixed top-8 z-50 w-full border-b border-[#101820]/10 bg-[#83C8C5]/95 text-[#101820] backdrop-blur-xl">

        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-8 lg:px-12 xl:px-14">

          {/* =================================================
              BRAND
          ================================================= */}

          <Link
            href="/"
            className="group flex shrink-0 items-center gap-3"
          >
            <img
              src="/images/wolves-isotipo.png"
              alt="Wolves Territory"
              className="h-9 w-auto object-contain transition-transform duration-300 group-hover:scale-105 md:h-10"
            />

            <div className="hidden flex-col leading-none sm:flex">

              <span className="text-[12px] font-semibold uppercase tracking-[0.28em] text-[#101820] md:text-[13px]">
                WOLVES
              </span>

              <span className="mt-1 text-[7px] font-semibold uppercase tracking-[0.42em] text-[#187E83] md:text-[8px]">
                TERRITORY
              </span>

            </div>
          </Link>

          {/* =================================================
              DESKTOP NAV
          ================================================= */}

          <div className="hidden items-center gap-4 md:flex lg:gap-6 xl:gap-8">

            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="group relative text-[9px] font-medium uppercase tracking-[0.18em] text-[#101820]/60 transition-colors duration-300 hover:text-[#101820] lg:text-[10px] lg:tracking-[0.22em]"
              >
                {link.label}

                <span className="absolute -bottom-2 left-0 h-px w-0 bg-[#187E83] transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}

          </div>

          {/* =================================================
              ACTIONS
          ================================================= */}

          <div className="flex shrink-0 items-center gap-4 lg:gap-5">

            {/* SEARCH */}

            <button
              type="button"
              aria-label="Search"
              className="text-[#101820]/55 transition-colors duration-300 hover:text-[#101820]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </button>

            {/* ACCOUNT */}

            <button
              type="button"
              aria-label="Account"
              className="hidden text-[#101820]/55 transition-colors duration-300 hover:text-[#101820] sm:block"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <circle cx="12" cy="8" r="4" />

                <path d="M4 21c1.5-4 4-6 8-6s6.5 2 8 6" />
              </svg>
            </button>

            {/* CART */}

            <button
              type="button"
              aria-label="Cart"
              onClick={() => setCartOpen(true)}
              className="relative text-[#101820]/60 transition-colors duration-300 hover:text-[#101820]"
            >
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M5 8h14l-1 12H6L5 8Z" />

                <path d="M9 8V6a3 3 0 0 1 6 0v2" />
              </svg>

              {totalItems > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#587EAD] px-1 text-[9px] font-bold text-white">
                  {totalItems}
                </span>
              )}
            </button>

            {/* MOBILE MENU */}

            <button
              type="button"
              aria-label="Menu"
              aria-expanded={menuOpen}
              onClick={() =>
                setMenuOpen((current) => !current)
              }
              className="flex w-5 flex-col gap-1.5 md:hidden"
            >
              <span
                className={`h-px w-5 bg-[#101820]/80 transition-transform duration-300 ${
                  menuOpen
                    ? "translate-y-[3.5px] rotate-45"
                    : ""
                }`}
              />

              <span
                className={`h-px w-5 bg-[#101820]/80 transition-transform duration-300 ${
                  menuOpen
                    ? "-translate-y-[3.5px] -rotate-45"
                    : ""
                }`}
              />
            </button>

          </div>
        </div>

        {/* =================================================
            MOBILE DRAWER · SEAFOAM
        ================================================= */}

        {menuOpen && (
          <div className="border-t border-[#101820]/10 bg-[#DCE5DE] md:hidden">

            <div className="flex min-h-[calc(100vh-96px)] flex-col justify-between px-6 py-10">

              <div className="flex flex-col gap-7">

                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-[#101820]/10 pb-5 text-lg font-medium uppercase tracking-[0.14em] text-[#101820] transition hover:text-[#187E83]"
                  >
                    {link.label}
                  </Link>
                ))}

              </div>

              <div className="mt-12 border-t border-[#101820]/10 pt-8">

                <div className="flex items-center gap-3">

                  <img
                    src="/images/wolves-isotipo.png"
                    alt=""
                    className="h-8 w-auto opacity-80"
                  />

                  <p className="text-[9px] uppercase tracking-[0.3em] text-[#101820]/40">
                    Wolves Territory
                  </p>

                </div>

                <p className="mt-4 max-w-xs text-sm leading-6 text-[#101820]/55">
                  Diseñado para el hombre que se mueve con intención.
                </p>

              </div>

            </div>
          </div>
        )}

      </nav>

      {/* =====================================================
          CART DRAWER
      ===================================================== */}

      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}