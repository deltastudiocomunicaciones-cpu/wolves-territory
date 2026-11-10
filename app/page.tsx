import type { Metadata } from "next";

const storefrontUrl = "https://www.wolves-territory.co";
const brandDescription =
  "Wolves Territory es una marca de ropa masculina y streetwear de Medellín, Colombia. Descubre la colección ORIGEN: hoodies, camisetas, polos, bermudas y gorras.";

export const metadata: Metadata = {
  title: "Ropa masculina y streetwear en Colombia | Wolves Territory",
  description: brandDescription,
  alternates: { canonical: storefrontUrl },
  openGraph: {
    type: "website",
    locale: "es_CO",
    url: storefrontUrl,
    siteName: "Wolves Territory",
    title: "Wolves Territory | Streetwear desde Medellín, Colombia",
    description: brandDescription,
  },
};

const storefrontIdentity = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${storefrontUrl}/#website`,
      name: "Wolves Territory",
      url: storefrontUrl,
      inLanguage: "es-CO",
      description: brandDescription,
      about: { "@id": `${storefrontUrl}/#brand` },
    },
    {
      "@type": "Brand",
      "@id": `${storefrontUrl}/#brand`,
      name: "Wolves Territory",
      url: storefrontUrl,
      logo: `${storefrontUrl}/images/wolves-logo-black.png`,
      description: brandDescription,
    },
  ],
};
const storefrontIdentityJson = JSON.stringify(storefrontIdentity).replace(/</g, "\\u003c");


import Footer from "@/components/layout/Footer";
import ReferralCapture from "@/components/partners/ReferralCapture";
import { Suspense } from "react";

import ProductGrid from "@/components/sections/ProductGrid";
import FeaturedCollection from "@/components/sections/FeaturedCollection";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";
import ThePack from "@/components/sections/ThePack";

export default function Home() {
  return (
    <>
      <main className="min-h-screen bg-black text-white">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: storefrontIdentityJson }} />
        <Navbar />

        <Hero />

        <ThePack />

        <FeaturedCollection />

        <Suspense
          fallback={
            <section className="min-h-screen bg-[#f2f0eb]" />
          }
        >
          <ProductGrid />
          <ReferralCapture />
        </Suspense>
      </main>

      <Footer />
    </>
  );
}
