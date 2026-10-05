import { Suspense } from "react";
import InventoryReceiptsClient from "./InventoryReceiptsClient";

export default function InventoryReceiptsPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-screen bg-[#f5f2eb] text-black">
          <div className="mx-auto w-full max-w-7xl px-5 py-8 md:px-8 md:py-12">
            <p className="text-[9px] uppercase tracking-[0.22em] text-black/35">
              Cargando recepciones de inventario...
            </p>
          </div>
        </main>
      }
    >
      <InventoryReceiptsClient />
    </Suspense>
  );
}