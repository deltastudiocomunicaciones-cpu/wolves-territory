"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";

const looks = [
  {
    id: "01",
    title: "THE ORIGIN",
    subtitle: "La identidad no se negocia.",
    image: "/products/origen-hoodie-black-1.webp",
    label: "HOODIE / BLACK",
  },
  {
    id: "02",
    title: "THE ESSENTIAL",
    subtitle: "Elegancia sin pedir permiso.",
    image: "/products/origen-polo-gray-1.webp",
    label: "POLO / GREY",
  },
  {
    id: "03",
    title: "THE ATTITUDE",
    subtitle: "El territorio es tuyo.",
    image: "/products/origen-tshirt-black.webp",
    label: "T-SHIRT / BLACK",
  },
];

export default function ThePack() {
  const [active, setActive] = useState(1);

  const previous = () =>
    setActive((current) => (current + looks.length - 1) % looks.length);

  const next = () =>
    setActive((current) => (current + 1) % looks.length);

  return (
    <section id="the-pack" aria-label="THE PACK — Pasarela interactiva ORIGEN" className="overflow-hidden bg-[#eae7e1] text-[#171717]">

      <section className="relative mx-auto max-w-[1600px] px-4 pb-16 pt-5 md:px-12">
        <div className="relative z-10 text-center">
          <p className="text-[10px] tracking-[0.4em] md:text-xs">
            WOLVES TERRITORY PRESENTS
          </p>
          <h1 className="mt-3 text-6xl font-black tracking-[-0.075em] md:text-8xl">
            THE PACK
          </h1>
          <p className="mt-3 text-xs tracking-[0.25em]">
            SELECT YOUR IDENTITY
          </p>
        </div>

        <div
          className="relative mx-auto mt-5 h-[380px] max-w-[1200px] md:mt-0 md:h-[650px]"
          aria-label="Pasarela interactiva de la colección ORIGEN"
        >
          <div className="pointer-events-none absolute inset-x-[8%] bottom-8 h-20 rounded-[50%] bg-black/10 blur-3xl" />

          {looks.map((look, index) => {
            const offset = ((index - active + looks.length + 1) % looks.length) - 1;
            const selected = index === active;

            return (
              <motion.button
                key={look.id}
                type="button"
                onClick={() => setActive(index)}
                aria-pressed={selected}
                aria-label={`Seleccionar ${look.title}`}
                initial={false}
                animate={{
                  x: `${offset * 77}%`,
                  y: selected ? 0 : 66,
                  scale: selected ? 1 : 0.79,
                  opacity: selected ? 1 : 0.68,
                }}
                transition={{
                  type: "spring",
                  stiffness: 110,
                  damping: 23,
                  mass: 1.1,
                }}
                style={{
                  zIndex: selected ? 10 : 5 - Math.abs(offset),
                  left: "50%",
                  marginLeft: "-22%",
                }}
                className="absolute bottom-5 h-[340px] w-[44%] overflow-hidden rounded-sm bg-[#dedbd6] shadow-[0_18px_55px_rgba(0,0,0,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black md:h-[570px] md:w-[34%] md:!ml-[-17%]"
              >
                <Image
                  src={look.image}
                  alt={`${look.title} — ${look.label}`}
                  fill
                  sizes="(max-width: 768px) 44vw, 34vw"
                  className="object-contain object-center"
                  priority={selected}
                />

                <div className="pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent px-3 pb-5 pt-24 text-left text-white md:px-7">
                  <span className="text-[9px] tracking-[0.22em] md:text-[10px]">
                    {look.id} / {look.label}
                  </span>
                  {selected && (
                    <motion.h2
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-lg font-black md:text-3xl"
                    >
                      {look.title}
                    </motion.h2>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        <div className="relative z-20 mx-auto mt-1 flex max-w-xl items-center justify-between gap-4">
          <button
            type="button"
            onClick={previous}
            aria-label="Look anterior"
            className="border border-black/30 px-5 py-3 transition hover:bg-black hover:text-white"
          >
            {"←"}
          </button>

          <div className="text-center" aria-live="polite">
            <p className="text-[10px] tracking-[0.3em]">
              {looks[active].id} / 03
            </p>
            <h3 className="mt-2 text-lg font-bold">
              {looks[active].title}
            </h3>
            <p className="mt-1 text-sm text-black/60">
              {looks[active].subtitle}
            </p>
          </div>

          <button
            type="button"
            onClick={next}
            aria-label="Siguiente look"
            className="border border-black/30 px-5 py-3 transition hover:bg-black hover:text-white"
          >
            {"→"}
          </button>
        </div>

        <p className="mt-12 text-center text-[10px] uppercase tracking-[0.3em] text-black/50">
          An editorial experience by Wolves Territory
        </p>
      </section>
    </section>
  );
}








