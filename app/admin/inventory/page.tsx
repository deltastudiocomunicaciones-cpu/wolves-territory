"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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

type OperationalStatus =
  | "HEALTHY"
  | "LOW_STOCK"
  | "OUT_OF_STOCK";

function getOperationalStatus(
  item: InventoryItem
): OperationalStatus {
  if (item.available_stock <= 0) {
    return "OUT_OF_STOCK";
  }

  if (
    item.available_stock <=
    item.low_stock_threshold
  ) {
    return "LOW_STOCK";
  }

  return "HEALTHY";
}

export default function InventoryControlCenterPage() {
  const router = useRouter();

  const [inventory, setInventory] = useState<
    InventoryItem[]
  >([]);

  const [loading, setLoading] = useState(true);

  const [errorMessage, setErrorMessage] =
    useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");

const [categoryFilter, setCategoryFilter] =
  useState("ALL");

const [statusFilter, setStatusFilter] =
  useState<"ALL" | OperationalStatus>("ALL");  

  const loadInventory = useCallback(async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const supabase = getSupabaseBrowser();

      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      const accessToken =
        sessionData.session?.access_token;

      if (sessionError || !accessToken) {
        router.replace("/admin/login");
        return;
      }

      const response = await fetch(
        "/api/admin/inventory/catalog",
        {
          method: "GET",
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          cache: "no-store",
        }
      );

      const result = await response.json();

      if (!response.ok) {
        throw new Error(
          result.detail ||
            result.error ||
            "INVENTORY_CATALOG_FAILED"
        );
      }

      setInventory(
        (result.inventory ?? []) as InventoryItem[]
      );
    } catch (error) {
      console.error(
        "INVENTORY CONTROL CENTER ERROR:",
        error
      );

      setErrorMessage(
        "No fue posible cargar el inventario."
      );
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  const metrics = useMemo(() => {
    return inventory.reduce(
      (accumulator, item) => {
        accumulator.stock += item.stock;
        accumulator.reserved +=
          item.reserved_stock;
        accumulator.available +=
          item.available_stock;

        const status =
          getOperationalStatus(item);

        if (
          status === "LOW_STOCK" ||
          status === "OUT_OF_STOCK"
        ) {
          accumulator.alerts += 1;
        }

        return accumulator;
      },
      {
        stock: 0,
        reserved: 0,
        available: 0,
        alerts: 0,
      }
    );
  }, [inventory]);

  const categories = useMemo(() => {
  return Array.from(
    new Set(
      inventory
        .map((item) => item.category)
        .filter(
          (category): category is string =>
            Boolean(category)
        )
    )
  ).sort((a, b) =>
    a.localeCompare(b, "es")
  );
}, [inventory]);

const filteredInventory = useMemo(() => {
  const normalizedSearch =
    searchTerm.trim().toLowerCase();

  return inventory.filter((item) => {
    const status =
      getOperationalStatus(item);

    const matchesSearch =
      normalizedSearch.length === 0 ||
      [
        item.product_name,
        item.product_id,
        item.sku,
        item.color,
        item.size,
        item.variant_key,
      ].some((value) =>
        value
          ?.toLowerCase()
          .includes(normalizedSearch)
      );

    const matchesCategory =
      categoryFilter === "ALL" ||
      item.category === categoryFilter;

    const matchesStatus =
      statusFilter === "ALL" ||
      status === statusFilter;

    return (
      matchesSearch &&
      matchesCategory &&
      matchesStatus
    );
  });
}, [
  inventory,
  searchTerm,
  categoryFilter,
  statusFilter,
]);

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">
      <div className="mx-auto max-w-7xl px-5 py-10 md:px-8 md:py-14">
        <div className="border-b border-black/10 pb-8">
          <p className="text-[9px] uppercase tracking-[0.25em] text-black/35">
            Wolves Territory · Administración
          </p>

          <h1 className="mt-3 text-3xl font-semibold tracking-tight md:text-4xl">
            Inventory Control Center
          </h1>

          <p className="mt-3 max-w-2xl text-sm leading-6 text-black/50">
            Estado operacional consolidado del inventario
            activo. Consulta de existencias, reservas,
            disponibilidad y alertas por referencia.
          </p>
        </div>

        {loading && (
          <div className="mt-10 border border-black/10 bg-white p-6 text-sm text-black/40">
            Cargando inventario...
          </div>
        )}

        {errorMessage && (
          <div className="mt-10 border border-red-200 bg-red-50 p-5 text-sm text-red-800">
            {errorMessage}
          </div>
        )}

        <section className="mt-6 grid gap-3 md:grid-cols-3">
  <button
    type="button"
    onClick={() =>
      router.push("/admin/inventory/receipts")
    }
    className="group border border-black/10 bg-white p-5 text-left transition hover:border-black/30"
  >
    <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
      Entrada
    </p>

    <div className="mt-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">
          Recepciones
        </p>

        <p className="mt-1 text-xs leading-5 text-black/40">
          Registrar y controlar ingresos de mercancía.
        </p>
      </div>

      <span className="text-lg transition group-hover:translate-x-1">
        →
      </span>
    </div>
  </button>

  <button
    type="button"
    onClick={() =>
      router.push("/admin/inventory/counts")
    }
    className="group border border-black/10 bg-white p-5 text-left transition hover:border-black/30"
  >
    <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
      Control
    </p>

    <div className="mt-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">
          Conteo físico
        </p>

        <p className="mt-1 text-xs leading-5 text-black/40">
          Conciliar existencias físicas contra sistema.
        </p>
      </div>

      <span className="text-lg transition group-hover:translate-x-1">
        →
      </span>
    </div>
  </button>

  <button
    type="button"
    onClick={() =>
      router.push("/admin/inventory/review")
    }
    className="group border border-black/10 bg-white p-5 text-left transition hover:border-black/30"
  >
    <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
      Autorización
    </p>

    <div className="mt-3 flex items-center justify-between gap-4">
      <div>
        <p className="text-sm font-semibold">
          Revisión de ajustes
        </p>

        <p className="mt-1 text-xs leading-5 text-black/40">
          Revisar discrepancias antes de afectar inventario.
        </p>
      </div>

      <span className="text-lg transition group-hover:translate-x-1">
        →
      </span>
    </div>
  </button>
</section>

        {!loading && !errorMessage && (
          <>
            <section className="mt-10 grid gap-px overflow-hidden border border-black/10 bg-black/10 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white p-6">
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Stock total
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {metrics.stock}
                </p>
              </div>

              <div className="bg-white p-6">
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Reservado
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {metrics.reserved}
                </p>
              </div>

              <div className="bg-white p-6">
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Disponible
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {metrics.available}
                </p>
              </div>

              <div className="bg-white p-6">
                <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                  Alertas
                </p>
                <p className="mt-4 text-3xl font-semibold">
                  {metrics.alerts}
                </p>
              </div>
            </section>

            <section className="mt-10">
              <div className="flex flex-col gap-2 border-b border-black/10 pb-5 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="text-[8px] uppercase tracking-[0.22em] text-black/35">
                    Inventario autoritativo
                  </p>

                  <h2 className="mt-2 text-xl font-semibold tracking-tight">
                    Referencias activas
                  </h2>
                </div>

                <p className="text-[9px] uppercase tracking-[0.18em] text-black/35">
                  {inventory.length} referencias
                </p>
              </div>

              <div className="mt-5 grid gap-3 lg:grid-cols-[minmax(0,1fr)_240px_220px]">
  <input
    type="search"
    value={searchTerm}
    onChange={(event) =>
      setSearchTerm(event.target.value)
    }
    placeholder="Buscar producto, SKU, color, talla..."
    className="h-11 w-full border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/40"
  />

  <select
    value={categoryFilter}
    onChange={(event) =>
      setCategoryFilter(event.target.value)
    }
    className="h-11 w-full border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/40"
  >
    <option value="ALL">
      Todas las categorías
    </option>

    {categories.map((category) => (
      <option
        key={category}
        value={category}
      >
        {category}
      </option>
    ))}
  </select>

  <select
    value={statusFilter}
    onChange={(event) =>
      setStatusFilter(
        event.target.value as
          | "ALL"
          | OperationalStatus
      )
    }
    className="h-11 w-full border border-black/10 bg-white px-4 text-sm outline-none transition focus:border-black/40"
  >
    <option value="ALL">
      Todos los estados
    </option>
    <option value="HEALTHY">
      Saludable
    </option>
    <option value="LOW_STOCK">
      Stock bajo
    </option>
    <option value="OUT_OF_STOCK">
      Sin stock
    </option>
  </select>
</div>

<div className="mt-3 flex items-center justify-between">
  <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
    Mostrando {filteredInventory.length} de{" "}
    {inventory.length} referencias
  </p>

  {(searchTerm ||
    categoryFilter !== "ALL" ||
    statusFilter !== "ALL") && (
    <button
      type="button"
      onClick={() => {
        setSearchTerm("");
        setCategoryFilter("ALL");
        setStatusFilter("ALL");
      }}
      className="text-[8px] font-semibold uppercase tracking-[0.18em] text-black/55 transition hover:text-black"
    >
      Limpiar filtros
    </button>
  )}
</div>

              <div className="mt-5 space-y-3">
                {filteredInventory.map((item) => {
                  const status =
                    getOperationalStatus(item);

                  return (
                    <article
                      key={item.inventory_id}
                      className="border border-black/10 bg-white p-5"
                    >
                      <div className="grid gap-5 md:grid-cols-[minmax(0,2fr)_repeat(4,minmax(80px,0.7fr))] md:items-center">
                        <div>
                          <p className="text-sm font-semibold">
                            {item.product_name ||
                              item.product_id}
                          </p>

                          <p className="mt-1 text-[9px] uppercase tracking-[0.16em] text-black/35">
                            {item.sku || "SIN SKU"}
                            {" · "}
                            {item.color || "Sin color"}
                            {" · "}
                            {item.size || "Sin talla"}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Stock
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {item.stock}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Reservado
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {item.reserved_stock}
                          </p>
                        </div>

                        <div>
                          <p className="text-[8px] uppercase tracking-[0.18em] text-black/35">
                            Disponible
                          </p>
                          <p className="mt-2 text-lg font-semibold">
                            {item.available_stock}
                          </p>
                        </div>

                        <div className="md:text-right">
                          <span className="inline-flex border border-black/10 px-3 py-2 text-[8px] font-semibold uppercase tracking-[0.16em]">
                            {status === "HEALTHY"
                              ? "Saludable"
                              : status === "LOW_STOCK"
                                ? "Stock bajo"
                                : "Sin stock"}
                          </span>
                        </div>
                      </div>
                    </article>
                  );
                })}

                {filteredInventory.length === 0 && (
  <div className="border border-black/10 bg-white px-6 py-12 text-center">
    <p className="text-sm font-medium">
      No hay referencias que coincidan.
    </p>

    <p className="mt-2 text-xs text-black/40">
      Ajusta la búsqueda o limpia los filtros
      para consultar nuevamente el inventario.
    </p>
  </div>
)}

              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}