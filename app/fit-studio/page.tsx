import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wolves Fit Studio — Showroom Experimental",
  description: "Showroom interactivo de Wolves Territory con catálogo real, selección de talla y póster descargable. Prototipo aislado.",
  robots: { index: false, follow: false },
};

export default function FitStudioPrototypePage() {
  return (
    <main className="min-h-screen bg-[#10110f]">
      <iframe
        title="Wolves Fit Studio — Showroom privado"
        src="/fit-studio/showroom.html"
        className="block min-h-screen w-full border-0"
        style={{ height: "100dvh" }}
        allow="fullscreen"
      />
    </main>
  );
}
