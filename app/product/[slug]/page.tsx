import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductPageData } from "@/lib/product";
import Navbar from "@/components/layout/Navbar";
import ProductExperience from "@/components/product/ProductExperience";

const SITE = "https://www.wolves-territory.co";

type ProductPageProps = {
  params: Promise<{ slug: string }>;
};

function productTitle(name: string, color?: string) {
  if (!color) return name;
  return name.toLowerCase().endsWith(color.toLowerCase())
    ? name
    : `${name} — ${color}`;
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const data = getProductPageData(slug);
  if (!data) return { title: "Producto no encontrado", robots: { index: false } };

  const { product, selectedVariant } = data;
  const title = productTitle(product.name, selectedVariant?.color);
  const description = `${title}. ${product.category} de Wolves Territory, marca de moda masculina en Medellín, Colombia. Conoce sus fotografías, colores y opciones de talla.`;
  const image = selectedVariant?.image ?? product.image;
  const canonical = `/product/${slug}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      title: `${title} | Wolves Territory`,
      description,
      type: "website",
      url: canonical,
      images: [{ url: image, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const data = getProductPageData(slug);
  if (!data) notFound();

  const { product, selectedVariant } = data;
  const title = productTitle(product.name, selectedVariant?.color);

  // The payment gateway is not yet enabled for real transactions. Do not
  // publish unverified stock status, availability, ratings or purchase Offers.
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: title,
    description: product.description ?? `${title} de Wolves Territory.`,
    image: (selectedVariant?.images?.length ? selectedVariant.images : product.images?.length ? product.images : [selectedVariant?.image ?? product.image])
      .map((src) => new URL(src, SITE).toString()),
    brand: { "@type": "Brand", name: "Wolves Territory" },
    category: product.category,
    ...(selectedVariant?.skuBase || product.sku
      ? { sku: selectedVariant?.skuBase ?? product.sku }
      : {}),
    url: `${SITE}/product/${encodeURIComponent(slug)}`,
  };

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd).replace(/</g, "\\u003c") }}
      />
      <Navbar />

      <div className="fixed left-6 top-28 z-40 md:left-10 lg:left-14">
        <Link
          href="/"
          className="group inline-flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.24em] text-black/45 transition hover:text-black"
        >
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Back to Shop
        </Link>
      </div>

      <ProductExperience product={product} />
    </main>
  );
}
