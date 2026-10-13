"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type AdminTerritory = "SUPER_ADMIN" | "OPERATIONS" | "FINANCE" | "ADMIN";
type AdminProfile = { full_name: string; role: AdminTerritory };
type Metrics = { applications: number; payouts: number; settlements: number };
type Destination = { eyebrow: string; title: string; description: string; href?: string; number: string; status?: string };

const superAdminDestinations: Destination[] = [
  { number: "01", eyebrow: "STOCK CONTROL", title: "Inventario", description: "Existencias, catálogo y control de stock.", href: "/admin/inventory" },
  { number: "02", eyebrow: "FULFILLMENT", title: "Operaciones", description: "Pedidos, preparación y despachos.", href: "/admin/operations" },
  { number: "03", eyebrow: "INBOUND", title: "Recepciones", description: "Ingreso y aprobación de mercancía.", href: "/admin/inventory/receipts" },
  { number: "04", eyebrow: "STOCK AUDIT", title: "Conciliaciones", description: "Conteos físicos y revisión de ajustes.", href: "/admin/inventory/review" },
  { number: "05", eyebrow: "RETAIL NETWORK", title: "Store", description: "Solicitudes, evaluación y vinculación de tiendas aliadas.", href: "/admin/store-applications" },
  { number: "06", eyebrow: "SELLER NETWORK", title: "Referral", description: "Solicitudes y gestión de vendedores.", href: "/admin/applications" },
  { number: "07", eyebrow: "COMMISSIONS", title: "Liquidaciones", description: "Liquidaciones comerciales y pagos.", href: "/admin/settlements" },
  { number: "08", eyebrow: "FINANCIAL GOVERNANCE", title: "Tesorería", description: "Autorizaciones y remisión de pagos.", status: "EN DESARROLLO" },
];

const operationsDestinations: Destination[] = [
  { number: "01", eyebrow: "FULFILLMENT", title: "Operación", description: "Preparación, empaque, despacho y seguimiento de pedidos.", href: "/admin/operations" },
  { number: "02", eyebrow: "STOCK VISIBILITY", title: "Inventario", description: "Consulta operativa de existencias.", status: "PENDIENTE DE HABILITAR" },
  { number: "03", eyebrow: "INBOUND", title: "Recepciones", description: "Registro y seguimiento de entradas de mercancía.", status: "PENDIENTE DE HABILITAR" },
  { number: "04", eyebrow: "PHYSICAL CONTROL", title: "Conteos", description: "Conteos físicos y conciliación operativa.", href: "/admin/inventory/counts" },
];

function isAdminTerritory(role: unknown): role is AdminTerritory {
  return role === "SUPER_ADMIN" || role === "OPERATIONS" || role === "FINANCE" || role === "ADMIN";
}

function ArrowIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="h-5 w-5 transition-transform duration-300 group-hover:translate-x-1 group-hover:-translate-y-1">
      <path d="M5 19 19 5M7 5h12v12" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function TerritoryTile({ item, onNavigate }: { item: Destination; onNavigate: (href: string) => void }) {
  const enabled = Boolean(item.href);
  const content = (
    <>
      <div className="flex items-start justify-between gap-4">
        <span className="text-[10px] font-medium tracking-[0.2em] text-black/35 group-hover:text-white/45">{item.number} / {item.eyebrow}</span>
        {enabled ? <ArrowIcon /> : <span className="text-[9px] tracking-[0.12em] text-black/30">—</span>}
      </div>
      <div className="mt-8 sm:mt-10">
        <h3 className="text-[21px] font-semibold uppercase leading-none tracking-[-0.045em] sm:text-[23px]">{item.title}</h3>
        <p className="mt-4 max-w-[245px] text-[12px] leading-[1.7] text-black/50 group-hover:text-white/65">{item.description}</p>
      </div>
      <div className="mt-7 flex min-h-4 items-center justify-between border-t border-black/10 pt-4 text-[9px] font-medium uppercase tracking-[0.18em] group-hover:border-white/20">
        <span className={enabled ? "text-black/55 group-hover:text-white/70" : "text-black/30"}>
          {enabled ? "EXPLORAR TERRITORIO" : item.status ?? "PRÓXIMAMENTE"}
        </span>
        {enabled && <span aria-hidden="true">↗</span>}
      </div>
    </>
  );
  const className = "group flex min-h-[220px] rounded-2xl border border-black/10 flex-col justify-between bg-white p-6 text-left transition-colors duration-300 sm:p-7 " + (enabled ? "cursor-pointer hover:bg-[#171717] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-[-3px] focus-visible:outline-black" : "cursor-default");
  if (!item.href) return <div className={className} aria-label={`${item.title}: ${item.status ?? "Próximamente"}`}>{content}</div>;
  return <button type="button" className={className} onClick={() => onNavigate(item.href!)}>{content}</button>;
}

function MetricCard({ label, title, value, onClick }: { label: string; title: string; value: number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group flex min-h-[150px] flex-col justify-between border border-black/10 bg-[#f7f5f0] p-6 text-left transition-colors hover:bg-black hover:text-white focus-visible:outline-2 focus-visible:outline-black">
      <div className="flex items-center justify-between gap-3"><span className="text-[9px] uppercase tracking-[0.19em] opacity-45">{label}</span><ArrowIcon /></div>
      <div className="mt-7 flex items-end justify-between gap-3"><span className="text-[40px] font-semibold leading-none tracking-[-0.07em] tabular-nums">{value}</span><span className="max-w-[150px] text-right text-[10px] font-medium uppercase leading-4 tracking-[0.12em]">{title}</span></div>
    </button>
  );
}

export default function AdminPage() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [metrics, setMetrics] = useState<Metrics>({ applications: 0, payouts: 0, settlements: 0 });
  const [loading, setLoading] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function loadAdmin() {
      try {
        const supabase = getSupabaseBrowser();
        const { data: userData, error: userError } = await supabase.auth.getUser();
        if (userError || !userData.user) { router.replace("/admin/login"); return; }
        const { data: adminData, error: adminError } = await supabase
          .from("admin_users")
          .select("full_name, role, active")
          .eq("auth_user_id", userData.user.id)
          .maybeSingle();
        if (adminError || !adminData || !adminData.active || !isAdminTerritory(adminData.role)) {
          await supabase.auth.signOut();
          router.replace("/admin/login");
          return;
        }
        if (cancelled) return;
        setAdmin({ full_name: adminData.full_name, role: adminData.role });
        const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
        const accessToken = sessionData.session?.access_token;
        if (sessionError || !accessToken) { router.replace("/admin/login"); return; }
        if (adminData.role !== "SUPER_ADMIN") return;

        const paths = ["/api/admin/applications", "/api/admin/payouts", "/api/admin/settlements"];
        const responses = await Promise.all(paths.map(path => fetch(path, { method: "GET", headers: { Authorization: `Bearer ${accessToken}` }, cache: "no-store" })));
        const payloads = await Promise.all(responses.map(async response => {
          try { return await response.json(); } catch { return {}; }
        }));
        responses.forEach((response, index) => { if (!response.ok) console.error("ADMIN METRIC ERROR:", paths[index], payloads[index]); });
        const applications = responses[0].ok && Array.isArray(payloads[0].applications)
          ? payloads[0].applications.filter((application: { status?: string }) => application.status === "APPLIED").length : 0;
        const payouts = responses[1].ok ? Number(payloads[1].count ?? 0) : 0;
        const settlements = responses[2].ok ? Number(payloads[2].count ?? 0) : 0;
        if (!cancelled) setMetrics({ applications, payouts, settlements });
      } catch (error) {
        console.error("ADMIN DASHBOARD ERROR:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    void loadAdmin();
    return () => { cancelled = true; };
  }, [router]);

  async function handleLogout() {
    const supabase = getSupabaseBrowser();
    await supabase.auth.signOut();
    router.replace("/admin/login");
    router.refresh();
  }

  if (loading) return <main className="flex min-h-screen items-center justify-center bg-[#111] px-6 text-center text-[10px] uppercase tracking-[0.3em] text-white/55">Loading Territory Control...</main>;
  if (!admin) return <main className="min-h-screen bg-[#f2f0eb]" />;

  const isSuperAdmin = admin.role === "SUPER_ADMIN";
  const isOperations = admin.role === "OPERATIONS";
  const destinations = isSuperAdmin ? superAdminDestinations : operationsDestinations;

  const quickLinks = isSuperAdmin ? [
    { title: "Solicitudes Referral", href: "/admin/applications", value: metrics.applications, detail: "Por revisar" },
    { title: "Cuentas de pago", href: "/admin/payouts", value: metrics.payouts, detail: "Por verificar" },
    { title: "Liquidaciones", href: "/admin/settlements", value: metrics.settlements, detail: "Registradas en indicador" },
  ] : [];

  const navigate = (href: string) => { setMobileMenuOpen(false); router.push(href); };
  const navigation = (
    <>
      <p className="px-4 pt-7 text-[10px] font-semibold uppercase tracking-[0.24em] text-black/35">Navegación</p>
      <button onClick={() => navigate("/admin")} className="mt-4 flex w-full items-center justify-between rounded-xl bg-[#171717] px-4 py-3.5 text-left text-[12px] font-semibold text-white">
        <span>◫ &nbsp; Vista general</span><span className="text-white/45">01</span>
      </button>
      <div className="mt-3 space-y-1">
        {destinations.map(item => item.href ? (
          <button key={item.number} onClick={() => navigate(item.href!)} className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[12px] font-medium text-black/65 transition hover:bg-black/5 hover:text-black">
            <span>{item.title}</span><span className="text-black/30">↗</span>
          </button>
        ) : (
          <div key={item.number} className="flex items-center justify-between px-4 py-3 text-[12px] text-black/30"><span>{item.title}</span><span className="text-[9px]">PRÓX.</span></div>
        ))}
      </div>
      {isSuperAdmin && <><p className="px-4 pt-8 text-[10px] font-semibold uppercase tracking-[0.24em] text-black/35">Validaciones</p>
        <button onClick={() => navigate("/admin/payouts")} className="mt-3 flex w-full items-center justify-between rounded-xl px-4 py-3 text-left text-[12px] text-black/65 hover:bg-black/5"><span>Cuentas de pago</span><span>↗</span></button>
      </>}
    </>
  );

  return (
    <main className="min-h-screen bg-[#f5f3ef] text-[#171717]">
      <div className="mx-auto flex min-h-screen max-w-[1800px]">
        <aside className="sticky top-0 hidden h-screen w-[258px] shrink-0 flex-col border-r border-black/10 bg-[#eeebe5] px-4 py-7 lg:flex">
          <div className="px-4 pb-7"><p className="text-[14px] font-black uppercase tracking-[0.22em]">Wolves<span className="font-light"> Territory</span></p><p className="mt-2 text-[9px] uppercase tracking-[0.22em] text-black/40">Commercial Operating System</p></div>
          <div className="min-h-0 flex-1 overflow-y-auto">{navigation}</div>
          <div className="mt-4 border-t border-black/10 px-4 pt-5"><p className="text-[10px] font-semibold uppercase tracking-[0.18em]">{admin.full_name}</p><p className="mt-1 text-[10px] text-black/45">{admin.role.replaceAll("_", " ")}</p><button onClick={handleLogout} className="mt-5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/50 hover:text-black">Cerrar sesión ↗</button></div>
        </aside>
        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex min-h-[76px] items-center justify-between gap-3 border-b border-black/10 bg-[#f5f3ef]/95 px-5 backdrop-blur-md sm:px-8 xl:px-12">
            <div className="flex items-center gap-4"><button type="button" onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="rounded-lg border border-black/15 px-3 py-2 text-lg lg:hidden" aria-label="Abrir o cerrar menú" aria-expanded={mobileMenuOpen}>☰</button><div><p className="text-[11px] font-bold uppercase tracking-[0.15em]">Territory Control</p><p className="mt-1 text-[10px] text-black/40">Centro {isSuperAdmin ? "de gobierno" : isOperations ? "de operaciones" : "administrativo"}</p></div></div>
            <div className="flex items-center gap-3"><span className="hidden rounded-full border border-black/15 px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] sm:block">{admin.role.replaceAll("_", " ")}</span><span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#171717] text-[11px] font-bold text-white" aria-label="Perfil">{admin.full_name.trim().charAt(0).toUpperCase()}</span></div>
          </header>
          {mobileMenuOpen && <div className="absolute inset-x-0 top-[76px] z-30 max-h-[75vh] overflow-y-auto border-b border-black/15 bg-[#eeebe5] px-5 pb-6 shadow-xl lg:hidden">{navigation}<button onClick={handleLogout} className="mt-6 px-4 text-[11px] font-semibold uppercase">Cerrar sesión ↗</button></div>}
          <div className="mx-auto max-w-[1440px] px-5 pb-20 pt-9 sm:px-8 xl:px-12 xl:pt-12">
            <div className="mb-7 flex flex-wrap items-center justify-between gap-3"><p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-black/40">Plataforma comercial / Vista general</p><span className="text-[10px] text-black/40">WT — CONTROL / 2026</span></div>
            <section className="relative overflow-hidden rounded-[22px] bg-[#171717] px-6 py-10 text-white sm:px-10 sm:py-12 xl:px-12">
              <div className="pointer-events-none absolute -right-16 -top-24 h-80 w-80 rounded-full border border-white/10"/><div className="pointer-events-none absolute -right-2 -top-12 h-60 w-60 rounded-full border border-white/10"/>
              <div className="relative z-10 flex flex-col justify-between gap-9 md:flex-row md:items-end"><div><p className="text-[10px] font-semibold uppercase tracking-[0.27em] text-[#d0bca4]">{isSuperAdmin ? "Dirección y control comercial" : isOperations ? "Gestión operativa" : "Acceso administrativo"}</p><h1 className="mt-6 max-w-[680px] text-[clamp(2.3rem,4.5vw,4.8rem)] font-semibold uppercase leading-[0.99] tracking-[-0.065em]">Hola,<br />{admin.full_name}.</h1><p className="mt-6 max-w-xl text-[13px] leading-6 text-white/60">{isSuperAdmin ? "Una visión integrada de tu red comercial, inventario y operaciones. Las decisiones comienzan con información verificable." : isOperations ? "Cada movimiento cuenta. Prepara, registra y da seguimiento a la operación desde tu territorio." : "Tu espacio administrativo está autenticado. Las capacidades se habilitan según los permisos vigentes."}</p></div><div className="shrink-0 border-l border-white/20 pl-5"><p className="text-[10px] uppercase tracking-[0.2em] text-white/40">Territorio asignado</p><p className="mt-2 text-sm font-semibold">{admin.role.replaceAll("_", " ")}</p></div></div>
            </section>
            {(isSuperAdmin || isOperations) ? <>
              {isSuperAdmin && <section className="mt-11" aria-labelledby="pulse-title"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">01 / Actividad comercial</p><h2 id="pulse-title" className="mt-2 text-[24px] font-semibold tracking-[-0.045em]">Indicadores de gestión</h2></div><span className="text-[10px] text-black/40">Datos de módulos existentes</span></div><div className="grid gap-3 md:grid-cols-3">{quickLinks.map(link => <button key={link.href} onClick={() => navigate(link.href)} className="group flex min-h-[156px] flex-col justify-between rounded-2xl border border-black/10 bg-white p-6 text-left transition hover:-translate-y-0.5 hover:border-black/30 hover:shadow-lg"><div className="flex items-start justify-between"><p className="text-[11px] font-semibold text-black/50">{link.title}</p><span className="text-black/40 group-hover:text-black">↗</span></div><div className="flex items-end justify-between"><span className="text-[43px] font-semibold leading-none tracking-[-0.06em] tabular-nums">{link.value}</span><span className="text-[10px] text-black/40">{link.detail}</span></div></button>)}</div></section>}
              <section className="mt-12" aria-labelledby="modules-title"><div className="mb-5 flex flex-wrap items-end justify-between gap-3"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">{isSuperAdmin ? "02 / Arquitectura comercial" : "01 / Territorio operativo"}</p><h2 id="modules-title" className="mt-2 text-[24px] font-semibold tracking-[-0.045em]">{isSuperAdmin ? "Áreas de control" : "Espacios de trabajo"}</h2></div><span className="text-[10px] text-black/40">{destinations.length} módulos</span></div><div className="grid gap-3 sm:grid-cols-2 2xl:grid-cols-4">{destinations.map(item => <div key={item.number} className="min-w-0"><TerritoryTile item={item} onNavigate={navigate}/></div>)}</div></section>
              <section className="mt-10 grid gap-4 rounded-2xl border border-black/10 bg-[#eae6df] p-6 sm:grid-cols-[1fr_auto] sm:items-center sm:p-8"><div><p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-black/40">Próxima etapa</p><h3 className="mt-2 text-lg font-semibold">{isSuperAdmin ? "Store · Red de tiendas aliadas" : "Inventario y recepciones"}</h3><p className="mt-2 max-w-2xl text-[12px] leading-6 text-black/55">{isSuperAdmin ? "Vinculación de establecimientos, evaluación y contratación electrónica. En desarrollo; todavía no se ejecutan acciones." : "La consulta de existencias y el flujo de recepciones se conectarán después de verificar las autorizaciones efectivas."}</p></div><span className="w-fit rounded-full border border-black/15 px-4 py-2 text-[10px] font-semibold uppercase tracking-[0.1em] text-black/55">En desarrollo</span></section>
            </> : <section className="mt-10 rounded-2xl border border-black/10 bg-white p-8"><h2 className="text-xl font-semibold">Territorio {admin.role === "FINANCE" ? "financiero" : "administrativo"}</h2><p className="mt-3 text-sm text-black/50">Las funciones específicas de este rol están pendientes de habilitación.</p></section>}
            <footer className="mt-14 flex flex-wrap justify-between gap-3 border-t border-black/10 pt-6 text-[10px] text-black/40"><span>Wolves Territory / Commercial Operating System</span><span>Los permisos efectivos se validan en el backend.</span></footer>
          </div>
        </div>
      </div>
    </main>
  );
}
