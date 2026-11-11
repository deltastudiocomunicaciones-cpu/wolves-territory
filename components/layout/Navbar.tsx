"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/cart/CartProvider";
import CartDrawer from "@/components/cart/CartDrawer";

const nav = [
  { label: "Colección", href: "/#coleccion" },
  { label: "The Pack", href: "/#the-pack" },
  { label: "Tiendas aliadas", href: "/store/apply" },
  { label: "Separar ya", href: "/reservas" },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const { totalItems } = useCart();

  return (
    <>
      <header className="absolute left-0 top-0 z-50 w-full border-b border-[#c9d7dd]/65 bg-[#f8fafb]/95 text-[#101820] backdrop-blur-lg">
        <nav className="mx-auto flex h-[82px] max-w-[1600px] items-center justify-between gap-6 px-6 sm:px-10 lg:px-16" aria-label="Navegación principal">
          <Link href="/" aria-label="Wolves Territory, inicio" className="flex shrink-0 items-center">
            <img src="/images/wolves-logo-black.png" alt="Wolves Territory" className="h-[55px] w-auto max-w-[190px] object-contain sm:h-[65px]"/>
          </Link>
          <div className="hidden items-center gap-7 md:flex lg:gap-10">
            {nav.map(item => (
              <Link key={item.href} href={item.href} className="text-[12px] font-semibold text-[#18242c] transition-colors hover:text-[#087381] lg:text-[14px]">
                {item.label}
              </Link>
            ))}
          </div>
          <div className="flex items-center gap-4 sm:gap-6">
            <button type="button" onClick={() => setCartOpen(true)} aria-label={`Abrir carrito, ${totalItems} productos`} className="relative p-2 text-[#101820] hover:text-[#187E83]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
                <path d="M5 8h14l-1 12H6L5 8Z"/><path d="M9 8V6a3 3 0 0 1 6 0v2"/>
              </svg>
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-[#087F90] px-1 text-[11px] font-bold text-white">{totalItems}</span>
            </button>
            <button type="button" aria-label={menuOpen ? "Cerrar menú" : "Abrir menú"} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)} className="flex h-10 w-10 flex-col items-center justify-center gap-[6px] md:hidden">
              <span className={`h-px w-6 bg-[#101820] transition-transform ${menuOpen ? "translate-y-[3.5px] rotate-45" : ""}`}/>
              <span className={`h-px w-6 bg-[#101820] transition-transform ${menuOpen ? "-translate-y-[3.5px] -rotate-45" : ""}`}/>
            </button>
          </div>
        </nav>
        {menuOpen && (
          <div className="border-t border-[#c9d7dd] bg-[#f8fafb] px-7 py-8 md:hidden">
            {nav.map(item => (
              <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)} className="block border-b border-[#c9d7dd] py-5 text-lg font-semibold text-[#101820]">
                {item.label}
              </Link>
            ))}
            <Link href="/?category=Cap#coleccion" onClick={() => setMenuOpen(false)} className="block py-5 text-sm uppercase tracking-wider text-[#187E83]">Gorras y accesorios</Link>
          </div>
        )}
      </header>
      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
