import ProductGrid from "@/components/sections/ProductGrid";
import FeaturedCollection from "@/components/sections/FeaturedCollection";
import Navbar from "@/components/layout/Navbar";
import Hero from "@/components/sections/Hero";

export default function Home() {
  return (
    <main className="min-h-screen bg-black text-white">
      <Navbar />
      <Hero />
<FeaturedCollection />
<ProductGrid />
    </main>
  );
}