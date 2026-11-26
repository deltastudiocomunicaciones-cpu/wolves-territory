import type { Metadata } from "next";
import ImmersiveShowroom from "./immersive/page";

export const metadata: Metadata = {
  title: "Wolves Fit Studio — Experiencia Inmersiva",
  description: "Explora la colección ORIGEN en el showroom de Wolves Territory y consulta la guía de medidas.",
  robots: { index: false, follow: false },
};

export default function FitStudioPage() {
  return <ImmersiveShowroom />;
}
