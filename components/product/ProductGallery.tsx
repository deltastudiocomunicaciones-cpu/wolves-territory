"use client";

import { useEffect, useState } from "react";
import { Product } from "@/data/products";

export default function ProductGallery({
  product,
}: {
  product: Product;
}) {
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : [product.image];

     useEffect(() => {
  setActiveImage(
    product.images?.[0] ?? product.image
  );
}, [product.image, product.images]); 

  const [activeImage, setActiveImage] = useState(
    gallery[0]
  );

  // Si cambia el producto, vuelve a su primera imagen
  useEffect(() => {
    setActiveImage(gallery[0]);
  }, [product.slug]);

  return (
    <section className="relative bg-[#e9e6df]">
      <div className="sticky top-24 flex min-h-[calc(100vh-6rem)] items-center px-6 py-10 md:px-10 lg:px-14">
        <div className="relative mx-auto w-full max-w-[900px]">

          {/* BRAND */}
          <div className="mb-6 flex items-center justify-between">
            <p className="text-[9px] uppercase tracking-[0.32em] text-black/35">
              Wolves Territory
            </p>

            <p className="hidden text-[9px] uppercase tracking-[0.28em] text-black/30 md:block">
              {product.collection ?? product.category}
            </p>
          </div>

          {/* DESKTOP GALLERY */}
          <div className="relative hidden md:block">

            {/* THUMBNAILS */}
            {gallery.length > 1 && (
              <div className="absolute left-0 top-1/2 z-20 flex -translate-y-1/2 flex-col gap-3">
                {gallery.map((image, index) => {
                  const isActive =
                    activeImage === image;

                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImage(image)
                      }
                      aria-label={`Vista ${index + 1} de ${product.name}`}
                      className={`relative h-[88px] w-[68px] overflow-hidden bg-[#dedbd4] transition-all duration-300 ${
                        isActive
                          ? "ring-1 ring-black"
                          : "opacity-55 hover:opacity-100"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />

                      {isActive && (
                        <span className="absolute bottom-0 left-0 h-[2px] w-full bg-black" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* MAIN IMAGE */}
            <div className="flex min-h-[680px] items-center justify-center px-20 lg:min-h-[760px] lg:px-24">
              <img
                key={activeImage}
                src={activeImage}
                alt={product.name}
                className="max-h-[76vh] max-w-full object-contain transition-all duration-500 ease-out hover:scale-[1.015]"
              />
            </div>

            {/* COUNTER */}
            {gallery.length > 1 && (
              <div className="absolute bottom-0 right-0 text-[8px] uppercase tracking-[0.24em] text-black/35">
                {String(
                  gallery.indexOf(activeImage) + 1
                ).padStart(2, "0")}
                {" / "}
                {String(gallery.length).padStart(
                  2,
                  "0"
                )}
              </div>
            )}
          </div>

          {/* MOBILE GALLERY */}
          <div className="md:hidden">

            {/* MAIN IMAGE */}
            <div className="flex min-h-[480px] items-center justify-center">
              <img
                key={activeImage}
                src={activeImage}
                alt={product.name}
                className="max-h-[60vh] w-full object-contain"
              />
            </div>

            {/* MOBILE THUMBNAILS */}
            {gallery.length > 1 && (
              <div className="mt-5 flex gap-2 overflow-x-auto pb-2">
                {gallery.map((image, index) => {
                  const isActive =
                    activeImage === image;

                  return (
                    <button
                      key={`${image}-${index}`}
                      type="button"
                      onClick={() =>
                        setActiveImage(image)
                      }
                      className={`h-[82px] w-[64px] shrink-0 overflow-hidden bg-[#dedbd4] ${
                        isActive
                          ? "ring-1 ring-black"
                          : "opacity-60"
                      }`}
                    >
                      <img
                        src={image}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}