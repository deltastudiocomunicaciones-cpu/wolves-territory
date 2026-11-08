import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wolves Fit Studio — Prototipo 3D",
  description: "Exploración tridimensional de looks Wolves Territory. Prototipo privado sin compras ni almacenamiento de imágenes.",
  robots: { index: false, follow: false },
};

export default function FitStudioPrototypePage() {
  return (
    <main className="min-h-screen bg-[#10110f]">
      <iframe
        title="Wolves Fit Studio — Prototipo tridimensional"
        src="/fit-studio/prototype.html"
        className="block min-h-screen w-full border-0"
        style={{ height: "100dvh" }}
        allow="fullscreen"
      />
    </main>
  );
}
