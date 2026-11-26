"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { products } from "@/data/products";

type Measurement = "chest" | "waist" | "hip";
const measurementNames: Record<Measurement, string> = {
  chest: "Contorno de pecho",
  waist: "Contorno de cintura",
  hip: "Contorno de cadera",
};
const guide: Record<Measurement, string> = {
  chest: "Rodea el pecho con la cinta horizontal, sin apretar, en su punto de mayor contorno.",
  waist: "Mide el contorno natural de la cintura, con la cinta horizontal y respirando con normalidad.",
  hip: "Rodea la zona de mayor contorno de la cadera, manteniendo la cinta paralela al suelo.",
};
const items = products
  .filter((product) => ["Hoodie", "Polo", "T-Shirt", "Short"].includes(product.category))
  .flatMap((product) => (product.variants?.length ? product.variants : [null]).map((variant) => ({
    key: variant?.skuBase ?? product.sku ?? product.slug,
    name: product.name,
    category: product.category,
    slug: variant?.slug ?? product.slug,
    color: variant?.color ?? "Original",
    image: variant?.image ?? product.image,
    price: product.price,
  })));
const validCm = (value: string) => {
  if (!value.trim()) return null;
  const number = Number(value.replace(",", "."));
  return Number.isFinite(number) && number >= 40 && number <= 220 ? number : null;
};

export default function FitGuidePage() {
  const [selection, setSelection] = useState(items[0]?.key ?? "");
  const [measurements, setMeasurements] = useState<Record<Measurement, string>>({ chest: "", waist: "", hip: "" });
  const [fit, setFit] = useState("regular");
  const item = useMemo(() => items.find((entry) => entry.key === selection) ?? items[0], [selection]);
  const needed: Measurement[] = item?.category === "Short" ? ["waist", "hip"] : ["chest"];
  const complete = needed.every((field) => validCm(measurements[field]) !== null);
  const invalid = needed.filter((field) => measurements[field].trim() && validCm(measurements[field]) === null);
  return (
    <main className="min-h-screen bg-[#171715] text-[#f5f0e8]">
      <header className="border-b border-[#d8c5a3]/25 px-5 py-5 sm:px-10">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4">
          <div><p className="text-xs font-bold tracking-[.2em]">WOLVES TERRITORY</p><p className="mt-1 text-[10px] uppercase tracking-[.2em] text-[#d9ba93]">Fit Studio · Guía de medidas</p></div>
          <Link href="/fit-studio/immersive" className="border border-[#cbb18d]/50 px-4 py-3 text-xs hover:bg-white/10">Regresar al showroom ↗</Link>
        </div>
      </header>
      <div className="mx-auto grid max-w-6xl gap-9 px-5 py-12 lg:grid-cols-[.85fr_1.15fr] lg:px-10">
        <section className="space-y-6">
          <div><p className="text-xs uppercase tracking-[.24em] text-[#cbb18d]">01 / Pieza real</p><h1 className="mt-3 text-4xl font-light tracking-tight sm:text-5xl">Encuentra tu referencia.</h1><p className="mt-4 text-sm leading-7 text-white/65">Selecciona una prenda real de ORIGEN. Esta guía registra tus medidas únicamente en la memoria temporal de esta página; no guarda ni transmite tus datos.</p></div>
          <label className="block text-xs uppercase tracking-[.16em] text-[#e7c9a2]" htmlFor="wt-fit-product">Prenda y color</label>
          <select id="wt-fit-product" value={selection} onChange={(e) => setSelection(e.target.value)} className="w-full border border-white/30 bg-[#28251f] p-4 text-sm text-white">
            {items.map((entry) => <option key={entry.key} value={entry.key}>{entry.name} · {entry.color}</option>)}
          </select>
          {item && <div className="grid grid-cols-[120px_1fr] gap-5 border border-white/15 bg-[#24221e] p-4 sm:grid-cols-[170px_1fr]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={item.image} alt={item.name + " " + item.color} className="aspect-[3/4] w-full bg-[#ded6c8] object-cover" />
            <div className="flex flex-col justify-between gap-4"><div><p className="text-[10px] uppercase tracking-[.17em] text-[#d5b591]">{item.category} · {item.color}</p><h2 className="mt-2 text-xl">{item.name}</h2><p className="mt-3 text-xs text-white/50">SKU: {item.key}</p><p className="mt-3 text-sm">{new Intl.NumberFormat("es-CO", {style:"currency",currency:"COP",maximumFractionDigits:0}).format(item.price)}</p></div><Link href={"/product/" + encodeURIComponent(item.slug)} className="border border-[#d4ba96] px-4 py-3 text-center text-xs hover:bg-white/10">Ver ficha comercial ↗</Link></div>
          </div>}
        </section>
        <section className="border border-[#cbb18d]/35 bg-[#211f1b] p-5 sm:p-8">
          <p className="text-xs uppercase tracking-[.24em] text-[#d5b591]">02 / Tu referencia corporal</p><h2 className="mt-3 text-2xl font-light sm:text-3xl">Medidas en centímetros</h2>
          <p className="mt-3 text-sm leading-6 text-white/65">Utiliza una cinta métrica flexible. No estimamos medidas a partir de una fotografía y no equiparamos las medidas corporales con las dimensiones de una prenda.</p>
          <div className="mt-6 grid gap-5">
            {needed.map((field) => <div key={field}><label htmlFor={"wt-" + field} className="text-sm font-medium">{measurementNames[field]} <span className="text-[#d9ba93]">*</span></label><p className="mb-2 mt-1 text-xs leading-5 text-white/50">{guide[field]}</p><div className="flex"><input id={"wt-" + field} type="text" inputMode="decimal" autoComplete="off" placeholder="Ej. 100" value={measurements[field]} onChange={(e) => setMeasurements((old) => ({...old, [field]: e.target.value}))} className="min-w-0 flex-1 border border-white/25 bg-[#111110] p-3 text-white outline-offset-2 outline-[#d9ba93]" /><span className="border border-l-0 border-white/25 px-4 py-3 text-sm text-white/60">cm</span></div></div>)}
            <div><label htmlFor="wt-fit-preference" className="text-sm font-medium">Ajuste que prefieres</label><select id="wt-fit-preference" value={fit} onChange={(e) => setFit(e.target.value)} className="mt-2 w-full border border-white/25 bg-[#111110] p-3 text-sm text-white"><option value="regular">Regular</option><option value="holgado">Holgado</option><option value="ajustado">Ajustado</option></select></div>
          </div>
          {invalid.length > 0 && <p role="alert" className="mt-4 text-sm text-[#f2b9a8]">Revisa las medidas indicadas: introduce valores numéricos entre 40 y 220 cm.</p>}
          <div aria-live="polite" className="mt-7 border-t border-white/20 pt-6">
            <p className="text-xs uppercase tracking-[.2em] text-[#d9ba93]">03 / Estado de la recomendación</p>
            {complete ? <p className="mt-3 text-sm leading-7">Medidas capturadas en esta sesión. Preferencia: <strong>{fit}</strong>.</p> : <p className="mt-3 text-sm leading-7 text-white/65">Completa las medidas señaladas para preparar tu referencia corporal.</p>}
            <div className="mt-4 border border-[#c7a67a]/55 bg-[#312a21] p-4">
              <p className="text-sm font-medium text-[#eed2af]">Recomendación automática de talla: no disponible todavía</p>
              <p className="mt-2 text-xs leading-6 text-white/70">El catálogo no contiene una tabla técnica verificada con medidas de cada talla y margen de holgura de esta prenda. Elegir M, L, XL o XXL por intuición sería engañoso. Este módulo quedará listo para calcular la recomendación cuando incorporemos esas medidas reales.</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-3"><button type="button" onClick={() => setMeasurements({chest:"",waist:"",hip:""})} className="border border-white/30 px-5 py-3 text-xs hover:bg-white/10">Borrar mis medidas</button>{item && <Link href={"/product/" + encodeURIComponent(item.slug)} className="bg-[#e1cfb7] px-5 py-3 text-xs font-semibold text-[#191715] hover:bg-white">Consultar tallas en la ficha ↗</Link>}</div>
            <p className="mt-5 text-[11px] leading-5 text-white/45">Privacidad: sin fotos, cookies de medición, solicitudes de red propias ni almacenamiento persistente de tus medidas. Al salir o recargar esta página se descartan.</p>
          </div>
        </section>
      </div>
    </main>
  );
}
