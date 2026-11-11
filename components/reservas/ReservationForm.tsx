"use client";

import { useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { products } from "@/data/products";

type Option = {
  slug: string;
  name: string;
  color: string | null;
  image: string;
  price: number;
  category: string;
};
type SelectedItem = { slug: string; size: string; quantity: number };

const options: Option[] = products.flatMap<Option>((product) => product.variants?.length
  ? product.variants.map((variant) => ({
      slug: variant.slug, name: product.name.replace(/\\s+(Black|Ivory|Gray|Beige|White|Red)$/i, ""), color: variant.color,
      image: variant.image, price: product.price, category: product.category,
    }))
  : [{
      slug: product.slug, name: product.name, color: null,
      image: product.image, price: product.price, category: product.category,
    }]
);

const formatCOP = (amount: number) =>
  new Intl.NumberFormat("es-CO", { style: "currency", currency: "COP", maximumFractionDigits: 0 }).format(amount);
const whatsappUrl = (message: string) =>
  `https://wa.me/573043795035?text=${encodeURIComponent(message)}`;
const requiresSize = (option: Option) => !["Cap", "Accessory"].includes(option.category);
const selectedKey = (item: SelectedItem) => `${item.slug}:${item.size}`;

function itemLabel(item: SelectedItem) {
  const option = options.find((candidate) => candidate.slug === item.slug);
  if (!option) return item.slug;
  return `${option.name}${option.color ? " · " + option.color : ""}${item.size ? " · " + item.size : ""}`;
}

export default function ReservationForm() {
  const params = useSearchParams();
  const initialSlug = params.get("producto") ?? "";
  const [productSlug, setProductSlug] = useState(options.find((o) => o.slug === initialSlug)?.slug ?? "");
  const [size, setSize] = useState("");
  const [quantity, setQuantity] = useState(1);
  const [selection, setSelection] = useState<SelectedItem[]>([]);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [consent, setConsent] = useState(false);
  const [company, setCompany] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [selectionError, setSelectionError] = useState("");
  const [reference, setReference] = useState("");

  const selected = useMemo(() => options.find((option) => option.slug === productSlug), [productSlug]);
  const draftRequiresSize = selected ? requiresSize(selected) : false;
  const totalUnits = selection.reduce((sum, item) => sum + item.quantity, 0);
  const totalReference = selection.reduce((sum, item) => {
    const option = options.find((o) => o.slug === item.slug);
    return sum + (option?.price ?? 0) * item.quantity;
  }, 0);

  const whatsappItems = selection.map((item) =>
    `• ${itemLabel(item)} × ${item.quantity}`
  ).join("\n");
  const advisorMessage = selection.length
    ? `Hola, Wolves Territory. Me interesa separar estas prendas para diciembre:\n${whatsappItems}\nQuiero conocer disponibilidad y condiciones.`
    : "Hola, Wolves Territory. Quiero consultar cómo separar mi look de diciembre de la colección ORIGEN.";

  const field = "w-full border border-black/15 bg-white px-4 py-3 text-sm text-[#161616] outline-none focus:border-[#987248]";
  const label = "mb-2 block text-[10px] font-semibold uppercase tracking-[.16em] text-black/65";

  function addToSelection() {
    setSelectionError("");
    if (!selected) {
      setSelectionError("Elige primero un producto.");
      return;
    }
    const selectedSize = draftRequiresSize ? size : "";
    if (draftRequiresSize && !["M", "L", "XL", "XXL"].includes(selectedSize)) {
      setSelectionError("Elige una talla para esta prenda.");
      return;
    }
    const target: SelectedItem = { slug: selected.slug, size: selectedSize, quantity };
    const existing = selection.find((item) => selectedKey(item) === selectedKey(target));
    if (existing && existing.quantity + quantity > 3) {
      setSelectionError("Puedes solicitar hasta tres unidades por referencia y talla.");
      return;
    }
    if (!existing && selection.length >= 12) {
      setSelectionError("Puedes elegir hasta doce referencias diferentes en una solicitud.");
      return;
    }
    if (totalUnits + quantity > 20) {
      setSelectionError("El máximo por solicitud es de veinte unidades.");
      return;
    }
    setSelection((current) => existing
      ? current.map((item) => selectedKey(item) === selectedKey(target)
        ? { ...item, quantity: item.quantity + quantity } : item)
      : [...current, target]
    );
    setError("");
    setQuantity(1);
  }

  function removeFromSelection(target: SelectedItem) {
    setSelection((current) => current.filter((item) => selectedKey(item) !== selectedKey(target)));
    setSelectionError("");
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    if (selection.length === 0) {
      setSelectionError("Agrega al menos una prenda a tu selección antes de enviarla.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/reservas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: selection, name, email, phone, city, consent, company }),
      });
      const result = await response.json() as { error?: string; reference?: string };
      if (!response.ok || !result.reference) {
        setError(result.error ?? "No fue posible registrar la solicitud.");
        return;
      }
      setReference(result.reference);
    } catch {
      setError("No pudimos conectar con el servidor. Comprueba tu conexión e inténtalo nuevamente.");
    } finally {
      setBusy(false);
    }
  }

  if (reference) return (
    <div className="mx-auto max-w-2xl border border-[#baa27e]/70 bg-white p-7 text-center text-[#161616] shadow-xl sm:p-12" role="status">
      <p className="text-xs uppercase tracking-[.26em] text-[#80613b]">Tu look de diciembre · Wolves Territory</p>
      <h2 className="mt-5 text-3xl font-bold uppercase tracking-tight sm:text-4xl">¡Selección recibida!</h2>
      <p className="mt-6 text-sm leading-7 text-black/70">Registramos las {selection.length} referencias de tu selección. Conserva este número y úsalo para continuar con nuestro asesor comercial.</p>
      <p className="mt-5 break-all bg-[#f1ede6] px-4 py-5 font-mono text-sm font-semibold">{reference}</p>
      <div className="mt-5 space-y-2 text-left">
        {selection.map((item) => (
          <div key={selectedKey(item)} className="flex justify-between gap-3 border-b border-black/10 pb-2 text-xs">
            <span>{itemLabel(item)}</span><strong>× {item.quantity}</strong>
          </div>
        ))}
      </div>
      <p className="mt-6 text-xs leading-6 text-black/65">Este formulario no procesó pagos ni descontó inventario. La disponibilidad, las condiciones y cualquier anticipo deben confirmarse con el equipo comercial; exige comprobante al realizar un pago.</p>
      <a
        href={whatsappUrl(`Hola, Wolves Territory. Mi solicitud es ${reference}. Quiero concretar la separación de mi selección para diciembre:\n${whatsappItems}`)}
        target="_blank" rel="noopener noreferrer"
        className="mt-7 inline-flex w-full justify-center bg-[#245337] px-5 py-4 text-xs font-bold uppercase tracking-[.14em] text-white hover:bg-[#1c452d]"
      >Continuar mi solicitud por WhatsApp ↗</a>
      <Link href="/#coleccion" className="mt-5 inline-block text-xs uppercase tracking-[.18em] underline">Seguir explorando</Link>
    </div>
  );

  return (
    <div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.85fr_1.15fr]">
      <div className="lg:sticky lg:top-8 lg:self-start">
        <p className="text-[11px] uppercase tracking-[.28em] text-[#c5a47c]">Wolves Territory · ORIGEN</p>
        <h1 className="mt-5 text-5xl font-black uppercase leading-[.93] tracking-[-.05em] sm:text-6xl">Diciembre<br/>te espera.</h1>
        <p className="mt-5 text-xl font-semibold uppercase tracking-[.12em] text-[#e2bf91]">SEPARA YA · ARMA TU LOOK</p>
        <p className="mt-7 max-w-md text-base leading-8 text-white/70">¿Ya pensaste qué vas a vestir en diciembre? Combina tus prendas favoritas de ORIGEN en una misma selección. Nuestro equipo te ayudará a concretar tu look.</p>
        <div className="mt-9 border-l-2 border-[#c5a47c] pl-5 text-sm leading-7 text-white/75">
          Agrega varias prendas, colores y tallas. Luego envía tu selección o consulta directamente por WhatsApp las condiciones de separación y los canales institucionales para anticipos.
        </div>
        <a
          href={whatsappUrl(advisorMessage)} target="_blank" rel="noopener noreferrer"
          className="mt-8 inline-flex items-center gap-2 border border-[#a6d3aa] px-5 py-4 text-[11px] font-bold uppercase tracking-[.14em] text-[#c8ebcc] hover:bg-[#19452a]"
        >Consultar por WhatsApp ↗</a>
        <div><Link href="/#coleccion" className="mt-7 inline-block border-b border-white/45 pb-2 text-[10px] font-semibold uppercase tracking-[.2em] text-white/80 hover:text-white">← Explorar colección</Link></div>
      </div>

      <form onSubmit={submit} className="border border-[#ddd2c2] bg-[#f5f1e9] p-5 text-[#151515] shadow-2xl sm:p-8">
        <p className="text-[10px] font-semibold uppercase tracking-[.22em] text-[#876a46]">Diciembre ORIGEN · Selección de prendas</p>
        <h2 className="mt-3 text-2xl font-bold uppercase tracking-tight">1. Arma tu selección</h2>
        <div className="mt-6">
          <label htmlFor="reserve-product" className={label}>Prenda y color</label>
          <select id="reserve-product" className={field} value={productSlug} onChange={(e) => { setProductSlug(e.target.value); setSize(""); setSelectionError(""); }}>
            <option value="">Elige una prenda</option>
            {options.map((item) => <option key={item.slug} value={item.slug}>{item.name}{item.color ? ` · ${item.color}` : ""}</option>)}
          </select>
        </div>
        {selected && (
          <div className="mt-4 flex gap-4 border border-black/10 bg-white p-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={selected.image} alt={selected.name} className="h-28 w-24 shrink-0 object-cover" />
            <div className="flex flex-col justify-center gap-2">
              <p className="text-sm font-semibold uppercase">{selected.name}{selected.color ? ` · ${selected.color}` : ""}</p>
              <p className="text-sm">{formatCOP(selected.price)}</p>
              <p className="text-[10px] leading-4 text-black/55">Valor del catálogo sujeto a confirmación comercial.</p>
            </div>
          </div>
        )}
        <div className="mt-5 grid grid-cols-2 gap-4">
          {draftRequiresSize
            ? <div><label htmlFor="reserve-size" className={label}>Talla</label><select id="reserve-size" value={size} onChange={e=>setSize(e.target.value)} className={field}><option value="">Elige talla</option>{["M","L","XL","XXL"].map(s=><option key={s} value={s}>{s}</option>)}</select></div>
            : <div><p className={label}>Talla</p><div className="border border-black/10 bg-white/60 px-4 py-3 text-sm text-black/55">No aplica</div></div>}
          <div><label htmlFor="reserve-qty" className={label}>Unidades</label><select id="reserve-qty" value={quantity} onChange={e=>setQuantity(Number(e.target.value))} className={field}>{[1,2,3].map(n=><option key={n} value={n}>{n}</option>)}</select></div>
        </div>
        {selectionError && <p className="mt-4 text-xs font-semibold text-red-700" role="alert">{selectionError}</p>}
        <button type="button" onClick={addToSelection} className="mt-5 w-full border border-[#141414] px-5 py-4 text-[11px] font-bold uppercase tracking-[.17em] transition hover:bg-black hover:text-white">
          + Agregar a mi selección
        </button>

        <section className="mt-8 border-t border-black/15 pt-6" aria-label="Tu selección acumulada">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-bold uppercase tracking-[.14em]">2. Mi selección</h3>
            <span className="bg-[#e8dfd1] px-3 py-2 text-[10px] font-semibold uppercase tracking-widest">{totalUnits} {totalUnits === 1 ? "unidad" : "unidades"}</span>
          </div>
          {selection.length === 0 ? (
            <p className="mt-5 border border-dashed border-black/20 px-4 py-6 text-center text-sm text-black/55">Aún no has agregado prendas. Elige tu primera referencia y pulsa «Agregar a mi selección».</p>
          ) : (
            <div className="mt-5 space-y-3">
              {selection.map((item) => {
                const option = options.find((o) => o.slug === item.slug);
                return (
                  <div key={selectedKey(item)} className="flex items-center gap-3 border border-black/10 bg-white p-3">
                    {option && <img src={option.image} alt="" className="h-16 w-14 shrink-0 object-cover" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-[12px] font-semibold uppercase leading-5">{itemLabel(item)}</p>
                      <p className="mt-1 text-[11px] text-black/60">{option ? formatCOP(option.price * item.quantity) : ""} · {item.quantity} {item.quantity === 1 ? "unidad" : "unidades"}</p>
                    </div>
                    <button type="button" onClick={() => removeFromSelection(item)} className="shrink-0 px-2 py-2 text-[10px] font-semibold uppercase text-red-800 underline underline-offset-4" aria-label={`Quitar ${itemLabel(item)}`}>Quitar</button>
                  </div>
                );
              })}
              <div className="flex items-end justify-between gap-4 border-t border-black/15 pt-5">
                <span className="text-[11px] font-semibold uppercase tracking-wider">Valor referencial</span>
                <strong className="text-xl">{formatCOP(totalReference)}</strong>
              </div>
              <p className="text-[10px] leading-5 text-black/55">Estimación del catálogo, no cobro ni confirmación de existencia. El equipo confirmará condiciones antes de cualquier pago.</p>
            </div>
          )}
        </section>

        <section className="mt-8 border-t border-black/15 pt-6">
          <h3 className="mb-5 text-sm font-bold uppercase tracking-[.14em]">3. Tus datos de contacto</h3>
          <div className="grid gap-5 sm:grid-cols-2">
            <div><label htmlFor="reserve-name" className={label}>Nombre completo</label><input id="reserve-name" type="text" autoComplete="name" maxLength={100} minLength={3} required value={name} onChange={e=>setName(e.target.value)} className={field} placeholder="Tu nombre" /></div>
            <div><label htmlFor="reserve-email" className={label}>Correo electrónico</label><input id="reserve-email" type="email" autoComplete="email" maxLength={180} required value={email} onChange={e=>setEmail(e.target.value)} className={field} placeholder="correo@ejemplo.com" /></div>
            <div><label htmlFor="reserve-phone" className={label}>Celular</label><input id="reserve-phone" type="tel" autoComplete="tel" maxLength={25} required value={phone} onChange={e=>setPhone(e.target.value)} className={field} placeholder="+57 300 000 0000" /></div>
            <div><label htmlFor="reserve-city" className={label}>Ciudad en Colombia</label><input id="reserve-city" type="text" autoComplete="address-level2" maxLength={90} required value={city} onChange={e=>setCity(e.target.value)} className={field} placeholder="Medellín" /></div>
          </div>
        </section>
        <div className="absolute -left-[10000px] h-0 w-0 overflow-hidden" aria-hidden="true"><label htmlFor="reserve-company">Empresa</label><input id="reserve-company" type="text" tabIndex={-1} autoComplete="off" value={company} onChange={e=>setCompany(e.target.value)}/></div>
        <label className="mt-6 flex cursor-pointer items-start gap-3 text-xs leading-6 text-black/70">
          <input type="checkbox" className="mt-1 h-4 w-4 accent-black" checked={consent} required onChange={e=>setConsent(e.target.checked)} />
          <span>Autorizo el tratamiento de mis datos para atender esta solicitud conforme al <Link href="/reservas/privacidad" target="_blank" className="font-semibold underline">aviso de privacidad</Link>. Entiendo que enviar este formulario no cobra ni aparta mercancía; las condiciones se acuerdan con el equipo.</span>
        </label>
        {error && <div role="alert" className="mt-5 border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</div>}
        <button disabled={busy || selection.length === 0} type="submit" className="mt-7 w-full bg-[#141414] px-6 py-5 text-[12px] font-bold uppercase tracking-[.18em] text-white transition hover:bg-[#816143] disabled:cursor-not-allowed disabled:opacity-45">
          {busy ? "Registrando tu selección..." : "SEPARA YA · ENVIAR MI SELECCIÓN"}
        </button>
        <a href={whatsappUrl(advisorMessage)} target="_blank" rel="noopener noreferrer" className="mt-3 flex w-full items-center justify-center border border-[#245337] px-4 py-4 text-[11px] font-bold uppercase tracking-[.14em] text-[#245337] hover:bg-[#e2eddf]">Consultar mi selección por WhatsApp ↗</a>
        <p className="mt-4 text-center text-[10px] leading-5 text-black/55">El envío registra tu solicitud completa y devuelve una única referencia. Para cualquier anticipo, solicita al asesor las condiciones y el comprobante al pagar.</p>
      </form>
    </div>
  );
}
