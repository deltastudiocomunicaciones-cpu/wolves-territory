"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type ReceiptRow = {
  id: string;
  reference: string;
  status: string;
  receipt_type: string;
  source: string | null;
  created_by: string;
  submitted_at: string | null;
  created_at: string;
  updated_at: string;
};

const statusNames: Record<string, string> = {
  DRAFT: "Borrador",
  IN_PROGRESS: "En captura",
  SUBMITTED: "En revisión",
  APPROVED: "Autorizada · sin aplicar",
  APPLIED: "Aplicada",
  REJECTED: "Rechazada",
};

function dateLabel(value: string) {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "—"
    : date.toLocaleString("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });
}

export default function ReceiptHistory() {
  const router = useRouter();
  const [rows, setRows] = useState<ReceiptRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");
  const [scope, setScope] = useState<"COMMERCIAL" | "ALL">("COMMERCIAL");

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const supabase = getSupabaseBrowser();
      const { data: session, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !session.session?.access_token) {
        throw new Error("Sesión administrativa no disponible.");
      }
      // SECURITY: RPC validates INVENTORY_RECEIPT_VIEW; never fetch tables with service keys.
      const { data, error: rpcError } = await supabase.rpc("list_inventory_receipts", { p_limit: 100 });
      if (rpcError) {
        throw new Error(rpcError.code === "42501" ? "No tienes autorización para consultar recepciones."
          : "No fue posible cargar el historial de recepciones.");
      }
      setRows(Array.isArray(data) ? (data as ReceiptRow[]) : []);
    } catch (caught) {
      setRows([]);
      setError(caught instanceof Error ? caught.message : "No fue posible cargar el historial.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const shown = useMemo(() => {
    const q = search.trim().toLocaleLowerCase("es");
    return rows.filter((r) => {
      const commercial = /^WT-REC-20\d\d-\d+$/.test(r.reference);
      return (scope === "ALL" || commercial)
        && (status === "ALL" || r.status === status)
        && (!q || [r.reference, r.source ?? ""].some((v) => v.toLocaleLowerCase("es").includes(q)));
    });
  }, [rows, search, status, scope]);

  const pending = rows.filter((r) => r.status === "SUBMITTED").length;
  const approved = rows.filter((r) => r.status === "APPROVED").length;

  return (
    <section aria-labelledby="wt-receipts-history" className="mt-7 border border-black/10 bg-white p-5 md:p-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.24em] text-black/40">Control institucional</p>
          <h2 id="wt-receipts-history" className="mt-2 text-xl font-semibold tracking-tight md:text-2xl">
            Historial y bandeja de recepciones
          </h2>
          <p className="mt-2 max-w-3xl text-xs leading-5 text-black/55">
            Expedientes documentales de ingreso de mercancía. Una conciliación física puede modificar existencias
            sin aplicar una recepción: son circuitos distintos y se consultan por separado.
          </p>
        </div>
        <button type="button" onClick={() => void refresh()} disabled={loading}
          className="border border-black/25 px-4 py-3 text-[10px] font-semibold uppercase tracking-[0.12em] hover:bg-black hover:text-white disabled:opacity-40">
          {loading ? "Consultando..." : "Actualizar"}
        </button>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <div className="border border-amber-200 bg-amber-50 p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-amber-900">Pendientes de revisión</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{loading ? "—" : pending}</p>
        </div>
        <div className="border border-black/10 bg-[#f5f2eb] p-4">
          <p className="text-[10px] uppercase tracking-[0.12em] text-black/65">Autorizadas, sin aplicar</p>
          <p className="mt-2 text-3xl font-semibold tabular-nums">{loading ? "—" : approved}</p>
        </div>
      </div>

      <div className="mt-5 flex flex-col gap-3 md:flex-row">
        <input aria-label="Buscar documento o proveedor" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar documento o proveedor"
          className="min-w-0 flex-1 border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm outline-none focus:border-black" />
        <select aria-label="Filtrar estado" value={status} onChange={(e) => setStatus(e.target.value)}
          className="border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm">
          <option value="ALL">Todos los estados</option>
          <option value="SUBMITTED">En revisión</option>
          <option value="APPROVED">Autorizada, sin aplicar</option>
          <option value="IN_PROGRESS">En captura</option>
          <option value="DRAFT">Borrador</option>
          <option value="APPLIED">Aplicada</option>
          <option value="REJECTED">Rechazada</option>
        </select>
        <select aria-label="Alcance del historial" value={scope} onChange={(e) => setScope(e.target.value as "COMMERCIAL" | "ALL")}
          className="border border-black/15 bg-[#f5f2eb] px-4 py-3 text-sm">
          <option value="COMMERCIAL">Documentos comerciales</option>
          <option value="ALL">Incluir pruebas históricas</option>
        </select>
      </div>

      {error && <p role="alert" className="mt-4 border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}
      {loading && <p className="mt-5 text-sm text-black/50">Cargando historial...</p>}
      {!loading && !error && (
        <>
          <p className="mt-5 text-xs text-black/50">{shown.length} expediente(s) visibles · máximo 100 registros consultados.</p>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-black/15 text-[10px] uppercase tracking-[0.1em] text-black/55">
                  <th scope="col" className="py-3 pr-4">Documento</th>
                  <th scope="col" className="py-3 pr-4">Proveedor</th>
                  <th scope="col" className="py-3 pr-4">Creación (Colombia)</th>
                  <th scope="col" className="py-3 pr-4">Estado</th>
                  <th scope="col" className="py-3">Expediente</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r) => (
                  <tr key={r.id} className="border-b border-black/10">
                    <td className="py-3 pr-4 font-semibold">{r.reference}</td>
                    <td className="py-3 pr-4">{r.source ?? "—"}</td>
                    <td className="whitespace-nowrap py-3 pr-4">{dateLabel(r.created_at)}</td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block border px-2 py-1 text-[10px] font-semibold ${r.status === "SUBMITTED"
                        ? "border-amber-300 bg-amber-50 text-amber-900"
                        : r.status === "APPLIED"
                          ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                          : "border-black/15 bg-[#f5f2eb] text-black/75"}`}>
                        {statusNames[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="py-3">
                      <button type="button" onClick={() => router.push(`/admin/inventory/receipts?receiptId=${encodeURIComponent(r.id)}`)}
                        className="font-semibold underline underline-offset-4 hover:text-black/60">
                        Abrir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {shown.length === 0 && <p className="py-5 text-sm text-black/50">No hay expedientes para estos filtros.</p>}
          </div>
          <p className="mt-5 text-xs text-black/60">
            ¿Buscas una conciliación física? Consulta la sección de
            <button type="button" onClick={() => router.push("/admin/inventory/review")}
              className="ml-1 font-semibold underline underline-offset-2">revisión de ajustes</button>.
            Las cantidades aplicadas mediante conteos no convierten un borrador de recepción en APPLIED.
          </p>
        </>
      )}
    </section>
  );
}
