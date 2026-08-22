import Link from "next/link";
import { notFound } from "next/navigation";

import { getProductBySlug } from "@/lib/product";

import Navbar from "@/components/layout/Navbar";
import ProductExperience from "@/components/product/ProductExperience";

type ProductPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function ProductPage({
  params,
}: ProductPageProps) {
  const { slug } = await params;

  const product = getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
   <main className="min-h-screen bg-[#f2f0eb] text-black">
  <Navbar />

  <div className="fixed left-6 top-28 z-40 md:left-10 lg:left-14">
    <Link
      href="/"
      className="group inline-flex items-center gap-3 text-[9px] font-medium uppercase tracking-[0.24em] text-black/45 transition hover:text-black"
    >
      <span className="transition-transform duration-300 group-hover:-translate-x-1">
        ←
      </span>

      Back to Shop
    </Link>
  </div>

  <ProductExperience product={product} />
</main>
  );
}