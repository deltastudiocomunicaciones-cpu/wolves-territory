import { Product } from "@/data/products";

export default function ProductGallery({
  product,
}: {
  product: Product;
}) {
  return (
    <section className="relative bg-[#e9e6df]">
      <div className="sticky top-24 flex min-h-[calc(100vh-6rem)] items-center justify-center overflow-hidden px-6 py-10 md:px-10 lg:px-14">
        <div className="relative w-full max-w-[820px]">
          <div className="absolute left-0 top-0 z-10">
            <p className="text-[9px] uppercase tracking-[0.32em] text-black/35">
              Wolves Territory
            </p>
          </div>

          <img
            src={product.image}
            alt={product.name}
            className="mx-auto max-h-[78vh] w-full object-contain transition-transform duration-700 ease-out hover:scale-[1.015]"
          />

          <div className="absolute bottom-0 right-0 hidden md:block">
            <p className="text-[9px] uppercase tracking-[0.28em] text-black/30">
              {product.collection ?? product.category}
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}