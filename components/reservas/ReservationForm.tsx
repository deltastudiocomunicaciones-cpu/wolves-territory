"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";

type Option = { slug: string; name: string; color: string | null; image: string; price: number; category: string };
const options: Option[] = products.flatMap<Option>((product) => product.variants?.length
  ? product.variants.map((variant) => ({ slug: variant.slug, name: product.name, color: variant.color, image: variant.image, price: product.price, category: product.category }))
  : [{ slug: product.slug, name: product.name, color: null, image: product.image, price: product.price, category: product.category }]
);
const formatCOP = (amount: number) => new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);

export default function ReservationForm() {
  const params = useSearchParams();
  const requestedSlug = params.get("producto") ?? "";
  const [productSlug, setProductSlug] = useState(options.find((item) => item.slug === requestedSlug)?.slug ?? "");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reference, setReference] = useState("");

  const selected = useMemo(() => options.find((item) => item.slug === productSlug), [productSlug]);
  const requiresSize = selected && selected.category !== "Cap" && selected.category !== "Accessory";
  const field = "w-full border border-black/15 bg-white px-4 py-3 text-sm text-[#161616] outline-none focus:border-[#987248]";
  const label = "mb-2 block text-[10px] font-semibold uppercase tracking-[.16em] text-black/65";

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productSlug, size: requiresSize ? size : "", quantity, name, email, phone, city, consent, company }),
      });
      const payload = await response.json() as { error?: string; reference?: string };
      if (!response.ok || !payload.reference) {
        setError(payload.error ?? "No fue posible registrar la solicitud.");
        return;
      }
      setReference(payload.reference);
    } catch {
      setError("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) return (
    <div className="mx-auto max-w-xl border border-[#baa27e]/70 bg-white p-8 text-center shadow-xl sm:p-12" role="status">
      <p className="text-xs uppercase tracking-[.26em] text-[#80613b]">Primero en el territorio</p>
      <h2 className="mt-5 text-3xl font-bold uppercase tracking-tight sm:text-4xl">Recibimos tu solicitud.</h2>
      <p className="mt-6 text-sm leading-7 text-black/70">Registramos tu interés en la colección ORIGEN. Conserva este número para consultas.</p>
      <p className="mt-6 break-all bg-[#f1ede6] px-4 py-5 font-mono text-sm font-semibold">{reference}</p>
      <p className="mt-5 text-xs leading-6 text-black/60">Tu solicitud fue registrada. Este formulario no procesó ningún pago ni apartó inventario. Nuestro equipo podrá informarte las condiciones de separación y, si acuerdas un anticipo por un canal institucional, deberá confirmarte el valor, los términos y entregarte el comprobante al recibirlo.</p>
      <a href={`mailto:wolvesterritoryco@gmail.com?subject=${encodeURIComponent("Solicitud Wolves Territory " + reference)}`} className="mt-8 inline-block bg-black px-6 py-4 text-xs font-semibold uppercase tracking-[.18em] text-white">Escribir a Wolves Territory</a><div><Link href="/#coleccion" className="mt-5 inline-block text-xs uppercase tracking-[.18em] underline">Seguir explorando</Link></div>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.9fr_1.1fr]">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-[11px] uppercase tracking-[.28em] text-[#c5a47c]">Wolves Territory · ORIGEN</p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[.93] tracking-[-.05em] sm:text-6xl">Diciembre<br/>te espera.</h1><p className="mt-5 text-xl font-semibold uppercase tracking-[.12em] text-[#e2bf91]">SEPARA YA · ORIGEN</p>
        <p className="mt-7 max-w-md text-base leading-8 text-white/70">¿Ya pensaste qué vas a vestir en diciembre? Los mejores encuentros merecen un look a tu altura. Escoge tu prenda ORIGEN y déjanos tus datos: nuestro equipo te contactará para ayudarte a separarla.</p>
        <div className="mt-9 border-l-2 border-[#c5a47c] pl-5 text-sm leading-7 text-white/75">
          Consulta con nuestro equipo las opciones de separación, los medios institucionales habilitados para anticipos y las condiciones de entrega. El formulario registra tu solicitud; cualquier anticipo se acuerda y se confirma por separado.
        </div>
        <Link href="/#coleccion" className="mt-8 inline-block border-b border-white/45 pb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/80 hover:text-white">← Explorar colección</Link>
      </div>
      <form onSubmit={submit} className="border border-[#ddd2c2] bg-[#f5f1e9] p-5 text-[#151515] shadow-2xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#876a46]">Diciembre ORIGEN · Solicitud de separación</p>
        <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight">Elige tu referencia</h2>
        <div className="mt-7">
          <label htmlFor="reserve-product" className={label}>Producto y color</label>
          <select id="reserve-product" className={field} required value={productSlug} onChange={(e) => { setProductSlug(e.target.value); setSize(""); }}>
            <option value="">Selecciona una prenda</option>
            {options.map((item) => <option key={item.slug} value={item.slug}>{item.name}{item.color ? ` · ${item.color}` : ""}</option>)}
          </select>
        </div>
        {selected && (
          <div className="mt-5 flex gap-4 border border-black/10 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt={selected.name} className="h-28 w-24 shrink-0 object-cover" />
            <div className="flex flex-col justify-center gap-2">
              <p className="text-sm font-semibold uppercase">{selected.name}{selected.color ? ` · ${selected.color}` : ""}</p>
              <p className="text-sm">{formatCOP(selected.price)} COP</p>
              <p className="text-[10px] leading-4 text-black/55">Precio mostrado como referencia; sujeto a confirmación comercial.</p>
            </div>
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {requiresSize ? <div><label htmlFor="reserve-size" className={label}>Talla</label><select id="reserve-size" required value={size} onChange={(e) => setSize(e.target.value)} className={field}><option value="">Elige talla</option>{["M", "L", "XL", "XXL"].map(s=><option key={s}>{s}</option>)}</select></div> : <div><p className={label}>Talla</p><div className="border border-black/10 bg-white/60 px-4 py-3 text-sm text-black/55">No aplica</div></div>}
          <div><label htmlFor="reserve-qty" className={label}>Unidades de interés</label><select id="reserve-qty" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className={field}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        </div>
        <div className="mt-7 border-t border-black/10 pt-6">
          <h3 className="mb-5 text-sm font-bold uppercase tracking-[.12em]">Tus datos de contacto</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="reserve-name" className={label}>Nombre completo</label><input id="reserve-name" type="text" autoComplete="name" maxLength={100} required minLength={3} value={name} onChange={e=>setName(e.target.value)} className={field} placeholder="Tu nombre" /></div>
            <div><label htmlFor="reserve-email" className={label}>Correo electrónico</label><input id="reserve-email" type="email" autoComplete="email" maxLength={180} required value={email} onChange={e=>setEmail(e.target.value)} className={field} placeholder="correo@ejemplo.com" /></div>
            <div><label htmlFor="reserve-phone" className={label}>Celular</label><input id="reserve-phone" type="tel" autoComplete="tel" maxLength={25} required value={phone} onChange={e=>setPhone(e.target.value)} className={field} placeholder="+57 300 000 0000" /></div>
            <div><label htmlFor="reserve-city" className={label}>Ciudad en Colombia</label><input id="reserve-city" type="text" autoComplete="address-level2" maxLength={90} required value={city} onChange={e=>setCity(e.target.value)} className={field} placeholder="Medellín" /></div>
          </div>
        </div>
        <div className="absolute -left-[10000px] h-0 w-0 overflow-hidden" aria-hidden="true"><label htmlFor="reserve-company">Empresa</label><input id="reserve-company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={e=>setCompany(e.target.value)}/></div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-6 text-black/70">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-black" checked={consent} required onChange={e=>setConsent(e.target.checked)}/>
          <span>Autorizo el tratamiento de mis datos para atender esta solicitud, conforme al <Link href="/reservas/privacidad" target="_blank" className="font-semibold underline">aviso de privacidad</Link>. Entiendo que el envío del formulario no realiza un cobro ni confirma un apartado; las condiciones se acuerdan directamente con el equipo.</span>
        </label>
        {error && <div role="alert" className="mt-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        <button disabled={busy} type="submit" className="mt-7 w-full bg-[#141414] px-6 py-5 text-[12px] font-bold uppercase tracking-[.22em] text-white transition hover:bg-[#816143] disabled:cursor-wait disabled:opacity-60">
          {busy ? "Registrando solicitud..." : "SEPARA YA · QUIERO MI LOOK"}
        </button>
        <p className="mt-4 text-center text-[10px] leading-5 text-black/50">Recibirás una referencia de solicitud. Para formalizar un anticipo, consulta directamente con nuestro equipo las condiciones y exige el comprobante al efectuar el pago.</p>
      </form>
    </div>
  );
}
