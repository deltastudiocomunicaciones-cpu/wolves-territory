import type { Metadata } from "next";
export const metadata: Metadata = {
  title: "Wolves Fit Studio — Laboratorio 3D",
  description: "Visor tridimensional experimental y aislado de Wolves Fit Studio.",
  robots: { index: false, follow: false },
};
export default function FitStudio3DLabPage() {
  return (
    <main className="min-h-screen bg-[#10110f]">
      <iframe title="Wolves Fit Studio — Laboratorio 3D" src="/fit-studio/prototype.html" className="block min-h-screen w-full border-0" style={{ height: "100dvh" }} />
    </main>
  );
}
