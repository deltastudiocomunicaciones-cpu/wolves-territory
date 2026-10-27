"use client";

import Link from "next/link";
import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type Prospect = {
  id: string;
  trade_name: string;
  prospect_type: "STORE" | "OTHER";
  contact_name: string | null;
  contact_phone: string | null;
  contact_email: string | null;
  department: string | null;
  city: string | null;
  commercial_status: string;
  created_at: string;
};
type Draft = {
  trade_name: string;
  prospect_type: "STORE" | "OTHER";
  contact_name: string;
  contact_phone: string;
  contact_email: string;
  department: string;
  city: string;
};
const initialDraft: Draft = { trade_name: "", prospect_type: "STORE", contact_name: "", contact_phone: "", contact_email: "", department: "", city: "" };
const statusLabels: Record<string, string> = {
  IDENTIFIED: "Identificado",
  CONTACTED: "Contactado",
  IN_CONVERSATION: "En conversación",
  PAUSED: "En pausa",
  CLOSED: "Cerrado",
};

export default function PortfolioPage() {
  const router = useRouter();
  const [identity, setIdentity] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [draft, setDraft] = useState<Draft>(initialDraft);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    const supabase = getSupabaseBrowser();
    const { data, error: rpcError } = await supabase.rpc("list_expansion_prospects", { p_limit: 100, p_offset: 0 });
    if (rpcError) throw rpcError;
    setProspects((data ?? []) as Prospect[]);
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: auth, error: authError } = await supabase.auth.getUser();
        if (authError || !auth.user) { router.replace("/admin/login"); return; }
        const { data: profile, error: profileError } = await supabase.from("admin_users")
          .select("full_name,role,active").eq("auth_user_id", auth.user.id).maybeSingle();
        if (profileError || !profile?.active || !["SUPER_ADMIN", "EXPANSION"].includes(profile.role)) {
          router.replace("/admin"); return;
        }
        const { data, error: rpcError } = await supabase.rpc("list_expansion_prospects", { p_limit: 100, p_offset: 0 });
        if (rpcError) throw rpcError;
        if (!cancelled) {
          setIdentity(profile.full_name || "Representante");
          setProspects((data ?? []) as Prospect[]);
        }
      } catch (caught) {
        if (!cancelled) setError(caught instanceof Error ? caught.message : "No fue posible consultar la cartera.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError(""); setMessage("");
    try {
      const supabase = getSupabaseBrowser();
      const { error: rpcError } = await supabase.rpc("create_expansion_prospect", {
        p_trade_name: draft.trade_name.trim(),
        p_prospect_type: draft.prospect_type,
        p_contact_name: draft.contact_name.trim() || null,
        p_contact_phone: draft.contact_phone.trim() || null,
        p_contact_email: draft.contact_email.trim() || null,
        p_country_code: "CO",
        p_department: draft.department.trim() || null,
        p_city: draft.city.trim() || null,
      });
      if (rpcError) throw rpcError;
      await refresh();
      setDraft(initialDraft); setShowForm(false);
      setMessage("Prospecto registrado con trazabilidad de origen, registro y asignación.");
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "No se pudo registrar el prospecto.");
    } finally { setBusy(false); }
  }

  const fieldClass = "w-full rounded-lg border border-black/15 bg-white px-3 py-3 text-sm outline-none focus:border-[#a66a3d]";
  return (
    <main className="min-h-screen bg-[#f5f3ef] px-5 py-10 text-[#171717] sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <header className="flex flex-wrap items-center justify-between gap-4 border-b border-black/10 pb-6">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.23em] text-[#a66a3d]">Wolves Territory / Expansion Field Command</p>
            <h1 className="mt-3 text-4xl font-semibold uppercase tracking-[-0.06em] sm:text-6xl">Portfolio</h1>
            <p className="mt-3 text-sm text-black/55">Mis prospectos · Construcción y gestión de cartera comercial</p>
          </div>
          <Link href="/admin/expansion" className="rounded-full border border-black/20 px-5 py-3 text-xs font-semibold uppercase tracking-wider hover:bg-black hover:text-white">← Volver a Expansión</Link>
        </header>

        <section className="mt-8 rounded-2xl bg-[#171717] p-7 text-white sm:p-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#d6a477]">01 / Cartera comercial</p>
          <div className="mt-4 flex flex-wrap items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-[-0.05em]">Mis oportunidades</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/60">Cada prospecto inicia un expediente comercial. Su origen, responsable y registro quedan vinculados a la identidad administrativa.</p>
              {identity && <p className="mt-3 text-xs text-white/45">Sesión: {identity}</p>}
            </div>
            <button type="button" onClick={() => { setShowForm(value => !value); setError(""); }} disabled={!identity || busy}
              className="rounded-lg bg-[#d6a477] px-5 py-3 text-xs font-bold uppercase tracking-wider text-black disabled:opacity-50">
              {showForm ? "Cerrar formulario" : "+ Nuevo prospecto"}
            </button>
          </div>
        </section>

        {message && <p role="status" className="mt-5 rounded-lg border border-black/10 bg-white p-4 text-sm">{message}</p>}
        {error && <p role="alert" className="mt-5 rounded-lg border border-red-300 bg-red-50 p-4 text-sm text-red-800">{error}</p>}

        {showForm && identity && (
          <form onSubmit={submit} className="mt-6 rounded-2xl border border-black/10 bg-white p-6 sm:p-8">
            <h3 className="text-xl font-semibold">Registrar oportunidad</h3>
            <p className="mt-2 text-xs text-black/50">Los datos de contacto pueden completarse progresivamente. No se crea una tienda aliada en esta etapa.</p>
            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <label className="text-xs font-semibold">Nombre comercial *<input required minLength={2} maxLength={200} className={fieldClass} value={draft.trade_name} onChange={e => setDraft({ ...draft, trade_name: e.target.value })}/></label>
              <label className="text-xs font-semibold">Tipo de prospecto<select className={fieldClass} value={draft.prospect_type} onChange={e => setDraft({ ...draft, prospect_type: e.target.value as Draft["prospect_type"] })}><option value="STORE">Tienda potencial</option><option value="OTHER">Otra oportunidad</option></select></label>
              <label className="text-xs font-semibold">Persona de contacto<input maxLength={200} className={fieldClass} value={draft.contact_name} onChange={e => setDraft({ ...draft, contact_name: e.target.value })}/></label>
              <label className="text-xs font-semibold">Teléfono<input maxLength={40} type="tel" className={fieldClass} value={draft.contact_phone} onChange={e => setDraft({ ...draft, contact_phone: e.target.value })}/></label>
              <label className="text-xs font-semibold">Correo<input maxLength={254} type="email" className={fieldClass} value={draft.contact_email} onChange={e => setDraft({ ...draft, contact_email: e.target.value })}/></label>
              <label className="text-xs font-semibold">Departamento<input maxLength={120} className={fieldClass} value={draft.department} onChange={e => setDraft({ ...draft, department: e.target.value })}/></label>
              <label className="text-xs font-semibold">Ciudad<input maxLength={120} className={fieldClass} value={draft.city} onChange={e => setDraft({ ...draft, city: e.target.value })}/></label>
            </div>
            <button disabled={busy} type="submit" className="mt-7 rounded-lg bg-[#171717] px-6 py-3 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-50">{busy ? "Registrando..." : "Guardar prospecto"}</button>
          </form>
        )}

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <h3 className="text-xl font-semibold">Cartera registrada</h3>
            <span className="text-xs text-black/50">{loading ? "Consultando..." : prospects.length === 100 ? "Mostrando los primeros 100 registros" : prospects.length + " prospectos"}</span>
          </div>
          {loading ? <p className="rounded-xl bg-white p-8 text-sm text-black/55">Verificando acceso y consultando cartera...</p> :
            prospects.length === 0 ? <p className="rounded-xl border border-black/10 bg-white p-8 text-sm text-black/55">{error ? "No se pudo cargar la cartera." : "Todavía no hay prospectos en esta cartera. Registra la primera oportunidad para comenzar."}</p> :
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {prospects.map(prospect => (
                <article key={prospect.id} className="rounded-2xl border border-black/10 bg-white p-6">
                  <div className="flex items-start justify-between gap-3"><span className="text-[10px] font-bold uppercase tracking-widest text-[#a66a3d]">{prospect.prospect_type === "STORE" ? "Tienda potencial" : "Otra oportunidad"}</span><span className="text-[10px] uppercase text-black/45">{statusLabels[prospect.commercial_status] ?? prospect.commercial_status}</span></div>
                  <h4 className="mt-5 text-xl font-semibold">{prospect.trade_name}</h4>
                  <p className="mt-2 text-xs text-black/55">{[prospect.city, prospect.department].filter(Boolean).join(", ") || "Ubicación por completar"}</p>
                  <div className="mt-5 border-t border-black/10 pt-4 text-xs leading-6 text-black/60">
                    <p>{prospect.contact_name || "Contacto por completar"}</p>
                    {prospect.contact_phone && <p>{prospect.contact_phone}</p>}
                    {prospect.contact_email && <p className="break-all">{prospect.contact_email}</p>}
                  </div>
                  <p className="mt-4 text-[10px] text-black/35">Registrado: {new Date(prospect.created_at).toLocaleDateString("es-CO")}</p>
                </article>
              ))}
            </div>
          }
        </section>
        <footer className="mt-12 border-t border-black/10 pt-6 text-xs text-black/45">PORTFOLIO V0.1 · Datos reales · Acceso sujeto a permisos · Sin integración territorial automática</footer>
      </div>
    </main>
  );
}
