import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { products } from "@/data/products";
import { getProductBySlug, getProductDisplayName } from "@/lib/product";
import Navbar from "@/components/layout/Navbar";
import ProductExperience from "@/components/product/ProductExperience";

type ProductPageProps = { params: Promise<{ slug: string }> };
const baseUrl = "https://www.wolves-territory.co";

export function generateStaticParams() {
  return Array.from(new Set(products.flatMap((product) =>
    [product.slug, ...(product.variants?.map((variant) => variant.slug) ?? [])]
  ))).map((slug) => ({ slug }));
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Producto no encontrado", robots: { index: false } };

  const variant = product.variants?.find((item) => item.slug === slug);
  const name = getProductDisplayName(product, variant);
  const description = `${name}. ${product.category} de Wolves Territory, marca de streetwear masculino de Medellín, Colombia. Explora fotos y variantes de la colección.`;
  const canonical = `${baseUrl}/product/${encodeURIComponent(slug)}`;
  const image = variant?.image ?? product.image;

  return {
    title: name,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: "es_CO",
      siteName: "Wolves Territory",
      title: name,
      description,
      url: canonical,
      images: [{ url: image, alt: name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const variant = product.variants?.find((item) => item.slug === slug);
  const productName = getProductDisplayName(product, variant);
  // Product attributes are taken from the catalog. Do not publish Offer,
  // availability or shipping promises until live checkout/stock is verified.
  const structuredProduct = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: productName,
    description: product.description ?? `Producto de Wolves Territory · ${product.category}`,
    image: [new URL(variant?.image ?? product.image, baseUrl).toString()],
    url: `${baseUrl}/product/${encodeURIComponent(slug)}`,
    brand: { "@type": "Brand", name: "Wolves Territory" },
    category: product.category,
    ...(variant?.skuBase || product.sku
      ? { sku: variant?.skuBase ?? product.sku }
      : {}),
  };
  const structuredJson = JSON.stringify(structuredProduct).replace(/</g, "\\u003c");

  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: structuredJson }} />
      <Navbar />
      <div className="fixed left-6 top-28 z-40 md:left-10 lg:left-14">
        <Link href="/" className="group inline-flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.24em] text-black/45 transition hover:text-black">
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Back to Shop
        </Link>
      </div>
      <ProductExperience product={product} />
    </main>
  );
}
