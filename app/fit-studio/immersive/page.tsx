"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { products, type Product, type ProductVariant } from "@/data/products";

type Exhibit = { product: Product; variant: ProductVariant | null; key: string; slug: string; image: string; color: string };
type Zone = "entrada" | "prendas" | "gorras" | "probador";

const exhibits: Exhibit[] = products
  .flatMap((product) => {
    const variants = product.variants?.length ? product.variants : [null];
    return variants.map((variant) => ({
      product,
      variant,
      key: variant?.skuBase ?? product.sku ?? product.slug,
      slug: variant?.slug ?? product.slug,
      image: variant?.image ?? product.image,
      color: variant?.color ?? "",
    }));
  })
  .filter(({ product }) => ["Hoodie", "Polo", "Short", "Cap"].includes(product.category));

function formatCop(n: number) {
  return new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(n);
}

const zones: Array<{ id: Zone; label: string; eyebrow: string }> = [
  { id: "entrada", label: "Atrio", eyebrow: "01 / Acceso" },
  { id: "prendas", label: "Colección ORIGEN", eyebrow: "02 / Prendas" },
  { id: "gorras", label: "Galería de gorras", eyebrow: "03 / Accesorios" },
  { id: "probador", label: "Fit Studio", eyebrow: "04 / Experiencia" },
];

export default function ImmersiveShowroom() {
  const [zone, setZone] = useState<Zone>("entrada");
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const [showWelcome, setShowWelcome] = useState(true);
  const visible = useMemo(
    () => exhibits.filter(({ product }) =>
      zone === "gorras" ? product.category === "Cap" : product.category !== "Cap"
    ),
    [zone]
  );
  const selected = exhibits.find((item) => item.key === selectedKey) ?? null;
  const featured = visible.slice(0, 8);
  const activeZone = zones.find((item) => item.id === zone) ?? zones[0];

  return (
    <main className="relative min-h-[100dvh] overflow-hidden bg-[#171715] text-[#f3f0e9]">
      <style jsx global>{`
        .wt-room { background: radial-gradient(ellipse at 50% 32%,#555046 0%,#34332f 40%,#191a19 82%); }
        .wt-wall { background: linear-gradient(90deg,#3e3c36 0%,#706a5e 16%,#999184 50%,#716c61 83%,#393832 100%); box-shadow: inset 0 -35px 60px rgba(0,0,0,.38); }
        .wt-ceiling { background: linear-gradient(180deg,#211f1b,#48443c 55%,#665f53); clip-path:polygon(0 0,100% 0,90% 100%,10% 100%); }
        .wt-floor { background: repeating-linear-gradient(90deg,transparent 0,transparent 12%,rgba(255,255,255,.036) 12.1%,transparent 12.2%),linear-gradient(0deg,#37342f,#80776b 98%); clip-path:polygon(0 100%,100% 100%,87% 0,13% 0); transform-origin:center top; }
        .wt-perspective { perspective:950px; }
        .wt-rack { background:linear-gradient(130deg,#343330,#121313 56%,#45413c); border:1px solid #827b6e; box-shadow:0 25px 32px #0b0c0bbc; }
        .wt-rack:focus-visible,.wt-zone-button:focus-visible { outline:2px solid #e5c8a0;outline-offset:4px; }
        .wt-glow { box-shadow:0 0 65px rgba(243,215,165,.15),0 0 10px rgba(243,215,165,.2); }
        @media (prefers-reduced-motion:reduce) { .wt-motion { transition:none!important;animation:none!important; } }
      `}</style>

      <header className="relative z-30 flex items-center justify-between gap-3 border-b border-white/15 bg-[#111110]/95 px-4 py-4 sm:px-7">
        <div className="flex items-center gap-3">
          <span className="flex h-9 w-9 items-center justify-center border border-[#d8c5a3]/50 text-xl font-light text-[#e5ccad]">W</span>
          <div><p className="text-[11px] font-semibold tracking-[.21em] sm:text-[13px]">WOLVES TERRITORY</p><p className="text-[9px] uppercase tracking-[.26em] text-white/45">Immersive showroom · Concept V1</p></div>
        </div>
        <div className="flex gap-2">
          <Link href="/fit-studio" className="border border-white/25 px-3 py-2 text-[10px] uppercase tracking-[.12em] hover:bg-white/10">Fit Studio V0.6</Link>
          <Link href="/" className="bg-[#e8ddd0] px-3 py-2 text-[10px] font-semibold uppercase tracking-[.12em] text-black hover:bg-white">Volver a tienda ↗</Link>
        </div>
      </header>

      <div className="relative z-20 flex items-center justify-between gap-4 border-b border-white/10 bg-[#24231f] px-4 py-3 sm:px-7">
        <div><span className="text-[9px] uppercase tracking-[.22em] text-[#dbb98e]">The house of Wolves</span><h1 className="text-xl font-light tracking-tight sm:text-2xl">Explora la boutique.</h1></div>
        <span className="hidden text-right text-[10px] uppercase tracking-[.17em] text-white/55 md:block">Un espacio digital de exhibición<br/>Productos reales · Sin compras simuladas</span>
      </div>

      <nav aria-label="Salas del showroom" className="relative z-20 grid grid-cols-2 gap-px bg-white/10 md:grid-cols-4">
        {zones.map((item) => (
          <button key={item.id} className={`wt-zone-button wt-motion flex flex-col items-start px-4 py-3 text-left transition-colors sm:px-7 ${zone === item.id ? "bg-[#d6c4aa] text-[#171715]" : "bg-[#24231f] hover:bg-[#33302a]"}`}
            type="button" onClick={() => { setZone(item.id); setSelectedKey(null); setShowWelcome(false); }}>
            <span className={`text-[9px] uppercase tracking-[.14em] ${zone === item.id ? "text-black/60" : "text-white/40"}`}>{item.eyebrow}</span>
            <span className="mt-1 text-xs font-medium sm:text-sm">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="relative wt-room min-h-[630px] overflow-hidden">
        <div className="pointer-events-none absolute inset-0 wt-perspective" aria-hidden="true">
          <div className="wt-wall absolute inset-x-[8%] top-[12%] h-[62%] border-x-[14px] border-[#302c27]" />
          <div className="wt-ceiling absolute inset-x-0 top-0 h-[20%] opacity-80" />
          <div className="wt-floor absolute inset-x-[-38%] bottom-0 h-[35%]" />
          <div className="absolute inset-x-[12%] top-[13%] h-[1px] bg-[#f5d5a8] wt-glow" />
          <div className="absolute left-[13%] top-[21%] h-[41%] w-[2px] bg-[#c1b3a0]/35" />
          <div className="absolute right-[13%] top-[21%] h-[41%] w-[2px] bg-[#c1b3a0]/35" />
          <div className="absolute inset-x-[30%] top-[19%] h-[39%] border border-[#d6c2a2]/40 bg-[#161614]/70 shadow-[0_0_50px_#211d17]" />
          <div className="absolute inset-x-[37%] top-[23%] border-t border-[#eddfc8]/60" />
          <div className="absolute inset-x-[37%] bottom-[42%] border-t border-[#eddfc8]/60" />
          <div className="absolute left-1/2 top-[27%] -translate-x-1/2 text-center text-5xl font-extralight tracking-[.20em] text-[#e8dfd0]/65 sm:text-7xl">W</div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_50%_18%,transparent_20%,rgba(0,0,0,.45)_90%)]" />
        </div>

        <div className="relative z-10 mx-auto flex max-w-7xl flex-col items-center px-4 pb-14 pt-12 sm:px-8">
          <div className="text-center">
            <p className="text-[10px] uppercase tracking-[.4em] text-[#f0d3aa]">{activeZone.eyebrow}</p>
            <h2 className="mt-3 text-3xl font-light tracking-tight sm:text-5xl">{zone === "entrada" ? "WELCOME TO THE TERRITORY" : zone === "prendas" ? "THE ORIGEN GALLERY" : zone === "gorras" ? "THE HEADWEAR WALL" : "THE FITTING ROOM"}</h2>
            <p className="mx-auto mt-3 max-w-lg text-sm leading-6 text-white/75">
              {zone === "entrada" ? "La identidad no se encuentra. Se construye." : zone === "prendas" ? "Acércate a los exhibidores. Descubre cada prenda de nuestra colección." : zone === "gorras" ? "Explora las gorras de nuestro catálogo real." : "Un espacio para experimentar tu estilo. La prueba virtual con fotografía está en desarrollo."}
            </p>
          </div>

          {zone === "entrada" && (
            <div className="mt-16 grid w-full max-w-4xl gap-4 sm:grid-cols-3">
              <button type="button" onClick={() => { setZone("prendas");setShowWelcome(false); }} className="wt-rack wt-motion min-h-52 px-5 py-8 text-left transition-transform hover:-translate-y-2">
                <span className="text-5xl font-extralight text-[#d6b993]">01</span><p className="mt-8 text-lg">Sala ORIGEN</p><p className="mt-2 text-xs text-white/55">Hoodies · Polos · Bermudas</p><span className="mt-5 block text-xs text-[#f1cda5]">Entrar →</span>
              </button>
              <button type="button" onClick={() => {setZone("gorras");setShowWelcome(false);}} className="wt-rack wt-motion min-h-52 px-5 py-8 text-left transition-transform hover:-translate-y-2">
                <span className="text-5xl font-extralight text-[#d6b993]">02</span><p className="mt-8 text-lg">Galería Headwear</p><p className="mt-2 text-xs text-white/55">Diseño · Color · Carácter</p><span className="mt-5 block text-xs text-[#f1cda5]">Entrar →</span>
              </button>
              <button type="button" onClick={() => {setZone("probador");setShowWelcome(false);}} className="wt-rack wt-motion min-h-52 px-5 py-8 text-left transition-transform hover:-translate-y-2">
                <span className="text-5xl font-extralight text-[#d6b993]">03</span><p className="mt-8 text-lg">Fit Studio</p><p className="mt-2 text-xs text-white/55">Tu estilo · Tu próxima experiencia</p><span className="mt-5 block text-xs text-[#f1cda5]">Explorar →</span>
              </button>
            </div>
          )}

          {(zone === "prendas" || zone === "gorras") && (
            <div className="mt-12 grid w-full grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {featured.map((item) => (
                <button key={item.key} type="button" onClick={() => setSelectedKey(item.key)}
                  className={`wt-rack wt-motion group flex min-w-0 flex-col p-2 text-left transition-transform hover:-translate-y-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#dbc3a2] ${selectedKey === item.key ? "ring-2 ring-[#e8ccaa]" : ""}`}>
                  <div className="relative aspect-[3/4] overflow-hidden bg-[#d1c9bc]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={item.image} alt={item.product.name + (item.color ? " " + item.color : "")} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <span className="mt-3 text-xs font-medium">{item.product.name}</span>
                  <span className="mt-1 text-[10px] text-white/55">{item.color || item.product.collection || "Wolves Territory"}</span>
                  <span className="mt-3 border-t border-white/15 pt-2 text-xs text-[#f1d3af]">{formatCop(item.product.price)} <span className="float-right">↗</span></span>
                </button>
              ))}
            </div>
          )}

          {zone === "probador" && (
            <div className="mt-14 flex w-full max-w-3xl flex-col items-center gap-4 border border-[#c8b18f]/50 bg-[#161613]/85 px-5 py-14 text-center shadow-[0_25px_70px_#090a09a0]">
              <div className="flex h-24 w-20 items-center justify-center border-[7px] border-[#bba78e] text-4xl font-light text-[#e7d5bb]">W</div>
              <p className="mt-3 text-[10px] uppercase tracking-[.35em] text-[#e2c5a3]">Próxima experiencia</p>
              <h3 className="text-2xl font-light sm:text-3xl">Your reflection. Your territory.</h3>
              <p className="max-w-lg text-sm leading-6 text-white/65">El motor de prueba virtual no está habilitado en esta sala. Puedes seguir explorando el Fit Studio experimental existente sin enviar fotografías personales desde aquí.</p>
              <Link href="/fit-studio" className="mt-3 border border-[#e6c9a5] px-6 py-3 text-[11px] uppercase tracking-[.15em] hover:bg-[#e6c9a5] hover:text-black">Ver Fit Studio V0.6 ↗</Link>
            </div>
          )}
        </div>

        {showWelcome && zone === "entrada" && <p className="pointer-events-none absolute bottom-4 left-4 z-10 text-[9px] uppercase tracking-[.2em] text-white/50">Exploración conceptual · No representa una tienda física existente</p>}
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/80 p-2 sm:items-center sm:p-6" role="presentation" onMouseDown={(e) => { if (e.target === e.currentTarget) setSelectedKey(null); }}>
          <section role="dialog" aria-modal="true" aria-labelledby="wt-selected-product" className="grid max-h-[94dvh] w-full max-w-3xl overflow-y-auto border border-[#beac92] bg-[#e9e2d8] text-[#181817] sm:grid-cols-2">
            <div className="bg-[#d5cbbf]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={selected.image} alt={selected.product.name} className="aspect-[4/5] h-full w-full object-cover" />
            </div>
            <div className="flex flex-col p-6 sm:p-8">
              <div className="flex justify-between gap-3"><span className="text-[10px] uppercase tracking-[.2em] text-[#776855]">La pieza · Wolves Territory</span><button type="button" onClick={() => setSelectedKey(null)} aria-label="Cerrar ficha" className="text-2xl">×</button></div>
              <h3 id="wt-selected-product" className="mt-8 text-2xl font-light sm:text-3xl">{selected.product.name}</h3>
              <p className="mt-2 text-sm text-[#655d55]">{selected.color || selected.product.collection}</p>
              <p className="mt-6 text-lg">{formatCop(selected.product.price)}</p>
              <p className="mt-5 text-sm leading-6 text-[#625b53]">{selected.product.description ?? "Una pieza de Wolves Territory."}</p>
              <p className="mt-5 text-[11px] text-[#756d63]">Fotografía y precio del catálogo. Tallas, disponibilidad y compra se confirman en la ficha comercial.</p>
              <div className="mt-auto pt-9">
                <Link href={`/product/${encodeURIComponent(selected.slug)}`} className="block bg-[#181817] px-5 py-4 text-center text-[11px] font-semibold uppercase tracking-[.12em] text-white hover:bg-[#443b32]">Ver ficha real de producto ↗</Link>
                <button onClick={() => setSelectedKey(null)} className="mt-3 w-full border border-[#b9ac9a] px-5 py-3 text-[11px] uppercase tracking-[.12em]">Seguir explorando</button>
              </div>
            </div>
          </section>
        </div>
      )}
      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-white/15 bg-[#101110] px-5 py-5 text-[10px] uppercase tracking-[.14em] text-white/55">
        <span>Wolves Territory © · Experiencia conceptual aislada</span>
        <span>Sin pagos · Sin cambios de inventario · Sin captura de imágenes</span>
      </footer>
    </main>
  );
}
