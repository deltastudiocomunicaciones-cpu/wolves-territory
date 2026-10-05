"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowser } from "@/lib/supabase-browser";

type InventoryItem = {
  inventory_id: string;
  product_id: string;
  product_name: string | null;
  variant_key: string;
  sku: string | null;
  color: string | null;
  size: string | null;
  category: string | null;
  stock: number;
  reserved_stock: number;
  available_stock: number;
  low_stock_threshold: number;
  active: boolean;
};

export default function InventoryCountsPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [search, setSearch] = useState("");
const [categoryFilter, setCategoryFilter] = useState("");
const [colorFilter, setColorFilter] = useState("");
const [sizeFilter, setSizeFilter] = useState("");
const [stockFilter, setStockFilter] = useState("");
const [physicalCounts, setPhysicalCounts] = useState<
  Record<string, string>
>({});

const [observations, setObservations] = useState<
  Record<string, string>
>({});

const [submittingCount, setSubmittingCount] = useState(false);

const [countId, setCountId] = useState<string | null>(null);
const [countReference, setCountReference] = useState<string | null>(null);
const [creatingCount, setCreatingCount] = useState(false);
const [countStatus, setCountStatus] = useState<string | null>(null);

  useEffect(() => {
    async function loadInventory() {
      try {
        const supabase = getSupabaseBrowser();

        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          router.replace("/admin/login");
          return;
        }

        const { data, error } = await supabase.rpc(
          "get_inventory_catalog"
        );

        if (error) {
          throw error;
        }

        setInventory((data ?? []) as InventoryItem[]);

      /* =========================================================
 * RECOVER OPEN INVENTORY COUNT
 * ========================================================= */

const {
  data: openCount,
  error: openCountError,
} = await supabase.rpc(
  "get_open_inventory_count"
);

if (openCountError) {
  console.error(
    "OPEN INVENTORY COUNT ERROR:",
    openCountError
  );
} else if (openCount) {
  setCountId(openCount.count_id);
  setCountReference(openCount.reference);
  setCountStatus(openCount.status);

  const {
    data: savedItems,
    error: savedItemsError,
  } = await supabase.rpc(
    "get_inventory_count_items",
    {
      p_count_id: openCount.count_id,
    }
  );

  if (savedItemsError) {
    console.error(
      "COUNT ITEMS RECOVERY ERROR:",
      savedItemsError
    );
  } else if (savedItems) {
    const recoveredPhysicalCounts: Record<string, string> = {};
    const recoveredObservations: Record<string, string> = {};

    for (const item of savedItems) {
      if (item.physical_stock !== null) {
        recoveredPhysicalCounts[item.inventory_id] =
          String(item.physical_stock);
      }

      recoveredObservations[item.inventory_id] =
        item.observation ?? "";
    }

    setPhysicalCounts(recoveredPhysicalCounts);
    setObservations(recoveredObservations);
  }
}

      } catch (error) {
        console.error("INVENTORY CATALOG ERROR:", error);

        setErrorMessage(
          "No fue posible cargar el inventario."
        );
      } finally {
        setLoading(false);
      }
    }

    loadInventory();
  }, [router]);

  const categories = Array.from(
  new Set(
    inventory
      .map((item) => item.category)
      .filter((value): value is string => Boolean(value))
  )
).sort();

const colors = Array.from(
  new Set(
    inventory
      .map((item) => item.color)
      .filter((value): value is string => Boolean(value))
  )
).sort();

const sizes = Array.from(
  new Set(
    inventory
      .map((item) => item.size)
      .filter((value): value is string => Boolean(value))
  )
).sort();

const filteredInventory = inventory.filter((item) => {
  const query = search.trim().toLowerCase();

  const matchesSearch =
    !query ||
    [
      item.product_name,
      item.product_id,
      item.sku,
      item.color,
      item.size,
      item.category,
    ].some((value) =>
      value?.toLowerCase().includes(query)
    );

  const matchesCategory =
    !categoryFilter ||
    item.category === categoryFilter;

  const matchesColor =
    !colorFilter ||
    item.color === colorFilter;

  const matchesSize =
    !sizeFilter ||
    item.size === sizeFilter;

  const matchesStock =
    !stockFilter ||
    (stockFilter === "AVAILABLE" &&
      item.available_stock > 0) ||
    (stockFilter === "OUT" &&
      item.available_stock <= 0) ||
    (stockFilter === "LOW" &&
      item.available_stock > 0 &&
      item.available_stock <= item.low_stock_threshold);

  return (
    matchesSearch &&
    matchesCategory &&
    matchesColor &&
    matchesSize &&
    matchesStock
  );
});

    async function saveCountItem(item: InventoryItem) {
  if (!countId) return;

  const physicalValue = physicalCounts[item.inventory_id];

  if (
    physicalValue === undefined ||
    physicalValue === ""
  ) {
    return;
  }

  try {
    const supabase = getSupabaseBrowser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Sesión no disponible.");
    }

    const response = await fetch(
      "/api/admin/inventory/counts/items",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          countId,
          inventoryId: item.inventory_id,
          physicalStock: Number(physicalValue),
          observation:
            observations[item.inventory_id]?.trim() || null,
        }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail ||
        result.error ||
        "No fue posible registrar el conteo."
      );
    }

    console.log("COUNT ITEM SAVED:", result);
  } catch (error) {
    console.error("COUNT ITEM SAVE ERROR:", error);

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "No fue posible registrar el conteo."
    );
  }
}    

 

async function createCount() {
  try {
    setCreatingCount(true);
    setErrorMessage(null);

    const supabase = getSupabaseBrowser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch("/api/admin/inventory/counts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        countType: "STANDARD",
        notes: "Conteo físico iniciado desde Territory Control",
      }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw new Error(result.detail || result.error);
    }

    setCountId(result.count.count_id);
    setCountReference(result.count.reference);
    setCountStatus("DRAFT");
  } catch (error) {
    console.error("CREATE COUNT ERROR:", error);

    setErrorMessage(
      "No fue posible iniciar el conteo."
    );
  } finally {
    setCreatingCount(false);
  }
}

async function submitCount() {
  if (!countId || submittingCount) return;

  try {
    setSubmittingCount(true);
    setErrorMessage(null);

    const supabase = getSupabaseBrowser();

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.access_token) {
      router.replace("/admin/login");
      return;
    }

    const response = await fetch(
      "/api/admin/inventory/counts/submit",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ countId }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw new Error(
        result.detail ||
          result.error ||
          "No fue posible enviar el conteo."
      );
    }

    setCountStatus("SUBMITTED");
  } catch (error) {
    console.error("COUNT SUBMIT ERROR:", error);

    setErrorMessage(
      error instanceof Error
        ? error.message
        : "No fue posible enviar el conteo."
    );
  } finally {
    setSubmittingCount(false);
  }
}

  return (
    <main className="min-h-screen bg-[#f2f0eb] px-6 py-10 text-black md:px-12">
      <div className="mx-auto max-w-7xl">

        <button
          onClick={() => router.push("/admin")}
          className="text-xs uppercase tracking-[0.2em] text-black/40"
        >
          ← Territory Control
        </button>

        <div className="mt-12 border-b border-black/10 pb-8">
          <p className="text-[9px] uppercase tracking-[0.3em] text-black/35">
            Inventory Control
          </p>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight">
            Conteo físico
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">
            Registro y conciliación de existencias físicas contra
            el inventario registrado en el sistema.
          </p>
        </div>

        {loading && (
          <p className="mt-10 text-sm text-black/40">
            Cargando inventario...
          </p>
        )}

        {errorMessage && (
          <div className="mt-10 border border-red-200 bg-red-50 p-4 text-sm">
            {errorMessage}
          </div>
        )}

       {!loading && !errorMessage && (
  <>
    {/* CONTEO ACTIVO */}
    <div className="mt-10 flex flex-col gap-4 border border-black/10 bg-white p-5 md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-[9px] uppercase tracking-[0.2em] text-black/35">
          Conteo actual
        </p>

        <p className="mt-2 text-sm font-medium">
          {countReference ?? "No hay conteo iniciado"}
        </p>
      </div>

      {!countId ? (
  <button
    type="button"
    onClick={createCount}
    disabled={creatingCount}
    className="bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40"
  >
    {creatingCount ? "Iniciando..." : "Iniciar conteo"}
  </button>
) : (
  <div className="flex items-center gap-4">
    <span className="text-[10px] font-semibold uppercase tracking-[0.18em]">
      {countStatus ?? "IN_PROGRESS"}
    </span>

    {countStatus !== "SUBMITTED" && (
      <button
        type="button"
        onClick={submitCount}
        disabled={submittingCount}
        className="bg-black px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submittingCount ? "Enviando..." : "Enviar conteo"}
      </button>
    )}
  </div>
)}
    </div>

    {/* BUSCADOR Y FILTROS */}

    <div className="mt-10 border border-black/10 bg-white/40 p-5">
      <input
        type="search"
        value={search}
        onChange={(event) => setSearch(event.target.value)}
        placeholder="Buscar producto, SKU, color o talla..."
        className="w-full border border-black/10 bg-white px-4 py-3 text-sm outline-none"
      />

      <div className="mt-4 grid gap-3 md:grid-cols-4">
        <select
          value={categoryFilter}
          onChange={(event) => setCategoryFilter(event.target.value)}
          className="border border-black/10 bg-white px-3 py-3 text-xs"
        >
          <option value="">Todas las categorías</option>
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>

        <select
          value={colorFilter}
          onChange={(event) => setColorFilter(event.target.value)}
          className="border border-black/10 bg-white px-3 py-3 text-xs"
        >
          <option value="">Todos los colores</option>
          {colors.map((color) => (
            <option key={color} value={color}>
              {color}
            </option>
          ))}
        </select>

        <select
          value={sizeFilter}
          onChange={(event) => setSizeFilter(event.target.value)}
          className="border border-black/10 bg-white px-3 py-3 text-xs"
        >
          <option value="">Todas las tallas</option>
          {sizes.map((size) => (
            <option key={size} value={size}>
              {size}
            </option>
          ))}
        </select>

        <select
          value={stockFilter}
          onChange={(event) => setStockFilter(event.target.value)}
          className="border border-black/10 bg-white px-3 py-3 text-xs"
        >
          <option value="">Todo el inventario</option>
          <option value="AVAILABLE">Con stock</option>
          <option value="LOW">Stock bajo</option>
          <option value="OUT">Sin stock</option>
        </select>
      </div>

      <p className="mt-4 text-[10px] uppercase tracking-[0.16em] text-black/40">
        Mostrando {filteredInventory.length} de {inventory.length} referencias
      </p>
    </div>

    {/* TABLA */}
    <div className="mt-6 overflow-x-auto">
      <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-black/15 text-[9px] uppercase tracking-[0.18em] text-black/40">
                  <th className="py-4 pr-6">Producto</th>
                  <th className="py-4 pr-6">SKU</th>
                  <th className="py-4 pr-6">Color</th>
                  <th className="py-4 pr-6">Talla</th>
                  <th className="py-4 pr-6 text-right">Sistema</th>
<th className="py-4 pr-6 text-right">Físico</th>
<th className="py-4 pr-6 text-right">Diferencia</th>
<th className="py-4 text-right">Observación</th>
                </tr>
              </thead>

              <tbody>
                {filteredInventory.map((item) => (
                  <tr
                    key={item.inventory_id}
                    className="border-b border-black/5 text-sm"
                  >
                    <td className="py-5 pr-6 font-medium">
                      {item.product_name || item.product_id}
                    </td>

                    <td className="py-5 pr-6 text-black/55">
                      {item.sku || "—"}
                    </td>

                    <td className="py-5 pr-6 text-black/55">
                      {item.color || "—"}
                    </td>

                    <td className="py-5 pr-6 text-black/55">
                      {item.size || "—"}
                    </td>

                    <td className="py-5 pr-6 text-right font-medium">
  {item.stock}
</td>

<td className="py-5 pr-6">
  <input
    type="number"
    min="0"
    value={physicalCounts[item.inventory_id] ?? ""}
    onChange={(event) =>
      setPhysicalCounts((current) => ({
        ...current,
        [item.inventory_id]: event.target.value,
      }))
    }
    onBlur={() => saveCountItem(item)}
    placeholder="—"
    className="w-20 border border-black/10 bg-white px-3 py-2 text-right"
  />
</td>

<td className="py-5 pr-6 text-right font-semibold">
  {physicalCounts[item.inventory_id] != null &&
  physicalCounts[item.inventory_id] !== ""
    ? Number(physicalCounts[item.inventory_id]) - item.stock
    : "—"}
</td>

<td className="py-5">
  <input
    type="text"
    value={observations[item.inventory_id] ?? ""}
    onChange={(event) =>
      setObservations((current) => ({
        ...current,
        [item.inventory_id]: event.target.value,
      }))
    }
    placeholder="Observación..."
    className="min-w-48 border border-black/10 bg-white px-3 py-2 text-xs"
  />
</td>
                  </tr>
                ))}
              </tbody>
                       </table>
          </div>
        </>
      )}
      </div>
    </main>
  );
}
