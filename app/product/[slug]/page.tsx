import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getProductBySlug } from "@/lib/product";
import Navbar from "@/components/layout/Navbar";
import ProductExperience from "@/components/product/ProductExperience";

type ProductPageProps = { params: Promise<{ slug: string }> };
const origin = "https://www.wolves-territory.co";

function productIdentity(slug: string) {
  const product = getProductBySlug(slug);
  if (!product) return null;
  const variant = product.variants?.find((item) => item.slug === slug) ??
    product.variants?.[0];
  const canonicalSlug = variant?.slug ?? product.slug;
  const image = variant?.image ?? product.image;
  const name = variant
    ? `${product.name.replace(/ (Black|Ivory|Gray|White|Red|Beige)$/i, "")} ${variant.color}`
    : product.name;
  return { product, variant, canonicalSlug, name, image };
}

export async function generateMetadata({ params }: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const item = productIdentity(slug);
  if (!item) return { title: "Producto no encontrado", robots: { index: false } };
  const url = `${origin}/product/${item.canonicalSlug}`;
  const description = `${item.name}: ${item.product.category.toLowerCase()} de Wolves Territory, marca de moda masculina en Medellín, Colombia. Conoce sus fotografías, colores y precio en COP.`;
  return {
    title: `${item.name} | Moda masculina en Colombia`,
    description,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      title: `${item.name} | Wolves Territory`,
      description,
      url,
      images: [{ url: item.image, alt: item.name }],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;
  const item = productIdentity(slug);
  if (!item) notFound();

  const url = `${origin}/product/${item.canonicalSlug}`;
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.name,
    image: [`${origin}${item.image}`],
    description: item.product.description || `${item.name} de Wolves Territory.`,
    sku: item.variant?.skuBase ?? item.product.sku,
    brand: { "@type": "Brand", name: "Wolves Territory" },
    category: item.product.category,
    offers: {
      "@type": "Offer",
      url,
      price: item.product.price,
      priceCurrency: "COP",
      seller: { "@type": "Organization", name: "Wolves Territory" },
    },
  };
  return (
    <main className="min-h-screen bg-[#f2f0eb] text-black">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }}
      />
      <Navbar />
      <div className="fixed left-6 top-28 z-40 md:left-10 lg:left-14">
        <Link href="/" className="group inline-flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.24em] text-black/45 transition hover:text-black">
          <span className="transition-transform duration-300 group-hover:-translate-x-1">←</span>
          Volver a la tienda
        </Link>
      </div>
      <ProductExperience product={item.product} initialSlug={slug} />
    </main>
  );
}
