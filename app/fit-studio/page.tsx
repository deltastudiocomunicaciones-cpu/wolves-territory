import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Wolves Fit Studio — Experiencia Editorial",
  description: "Experiencia editorial con fotografías reales Wolves Territory. Prototipo privado sin compras ni almacenamiento de imágenes.",
  robots: { index: false, follow: false },
};

export default function FitStudioPrototypePage() {
  return (
    <main className="min-h-screen bg-[#10110f]">
      <iframe
        title="Wolves Fit Studio — Experiencia editorial privada"
        src="/fit-studio/editorial.html"
        className="block min-h-screen w-full border-0"
        style={{ height: "100dvh" }}
        allow="fullscreen"
      />
    </main>
  );
}
