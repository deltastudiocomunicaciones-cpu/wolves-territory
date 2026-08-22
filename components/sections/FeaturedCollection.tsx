export default function FeaturedCollection() {
  return (
    <section
      id="coleccion"
      className="bg-black px-6 py-32 md:px-12"
    >
      <div className="mb-20 text-center">
        <p className="text-xs tracking-[0.4em] text-[#c9a96e]">
          CURRENT DROP
        </p>

        <h2 className="mt-4 text-4xl font-black uppercase md:text-6xl">
          ORIGEN COLLECTION
        </h2>
      </div>

      <div className="grid gap-8 md:grid-cols-2">

        <article className="group relative overflow-hidden rounded-3xl">
          <img
            src="/images/polo-origen.jpg"
            alt="Polo Origen"
            className="h-[650px] w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute bottom-10 left-10">
            <p className="text-xs tracking-[0.3em] text-[#c9a96e]">
              ESSENTIAL
            </p>

            <h3 className="mt-3 text-4xl font-black">
              POLO ORIGEN
            </h3>
          </div>
        </article>

        <article className="group relative overflow-hidden rounded-3xl">
          <img
            src="/images/gorra-origen.jpeg"
            alt="Gorra Origen"
            className="h-[650px] w-full object-cover transition duration-700 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

          <div className="absolute bottom-10 left-10">
            <p className="text-xs tracking-[0.3em] text-[#c9a96e]">
              ACCESSORY
            </p>

            <h3 className="mt-3 text-4xl font-black">
              CAP ORIGEN
            </h3>
          </div>
        </article>

      </div>
    </section>
  );
}