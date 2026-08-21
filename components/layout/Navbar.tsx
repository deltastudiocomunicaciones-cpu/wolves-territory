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
    { label: "NEW", href: "/#new" },
    { label: "SHOP", href: "/#coleccion" },
    { label: "COLLECTIONS", href: "/#collections" },
    { label: "CAPS", href: "/#caps" },
    { label: "APPAREL", href: "/#apparel" },
    { label: "STORES", href: "/#stores" },
    { label: "WOLVES", href: "/#nosotros" },
  ];

  return (
    <>
      {/* ANNOUNCEMENT BAR */}
      <div className="fixed top-0 z-[60] w-full border-b border-white/10 bg-black text-white">
        <div className="flex h-8 items-center justify-center px-4 text-[9px] font-medium uppercase tracking-[0.28em] text-white/55">
          Free shipping on selected orders · Secure payments · Colombia
        </div>
      </div>

      {/* NAVBAR */}
      <nav className="fixed top-8 z-50 w-full border-b border-white/10 bg-black/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1600px] items-center justify-between px-5 md:px-10 lg:px-14">
          
          {/* BRAND */}
          <Link
            href="/"
            className="shrink-0 text-[13px] font-semibold uppercase tracking-[0.24em] text-white"
          >
            WOLVES TERRITORY
          </Link>

          {/* DESKTOP NAV */}
          <div className="hidden items-center gap-7 lg:flex">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="text-[10px] font-medium uppercase tracking-[0.22em] text-white/50 transition hover:text-white"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* ACTIONS */}
          <div className="flex items-center gap-5">
            {/* SEARCH */}
            <button
              type="button"
              aria-label="Search"
              className="text-white/60 transition hover:text-white"
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
              className="hidden text-white/60 transition hover:text-white sm:block"
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
              className="relative text-white/60 transition hover:text-white"
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
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[9px] font-bold text-black">
                  {totalItems}
                </span>
              )}
            </button>

            {/* MOBILE MENU */}
            <button
              type="button"
              aria-label="Menu"
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex w-5 flex-col gap-1.5 lg:hidden"
            >
              <span className="h-px w-5 bg-white/80" />
              <span className="h-px w-5 bg-white/80" />
            </button>
          </div>
        </div>

        {/* MOBILE DRAWER */}
        {menuOpen && (
          <div className="border-t border-white/10 bg-[#0b0b0b] lg:hidden">
            <div className="flex min-h-[calc(100vh-96px)] flex-col justify-between px-6 py-10">
              <div className="flex flex-col gap-7">
                {navLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className="border-b border-white/10 pb-5 text-lg font-medium uppercase tracking-[0.14em] text-white"
                  >
                    {link.label}
                  </Link>
                ))}
              </div>

              <div className="mt-12 border-t border-white/10 pt-8">
                <p className="text-[9px] uppercase tracking-[0.3em] text-white/30">
                  Wolves Territory
                </p>

                <p className="mt-3 max-w-xs text-sm leading-6 text-white/50">
                  Designed for men who move with intention.
                </p>
              </div>
            </div>
          </div>
        )}
      </nav>

      {/* CART DRAWER */}
      <CartDrawer
        open={cartOpen}
        onClose={() => setCartOpen(false)}
      />
    </>
  );
}