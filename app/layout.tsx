import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { CartProvider } from "@/components/cart/CartProvider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.wolves-territory.co"),

  title: {
    default: "Wolves Territory",
    template: "%s | Wolves Territory",
  },

  description:
    "Wolves Territory, marca de ropa masculina y streetwear de Medellín, Colombia. Explora la colección ORIGEN: hoodies, polos, camisetas, bermudas y gorras.",

  openGraph: {
    type: "website",
    locale: "es_CO",
    url: "https://www.wolves-territory.co",
    siteName: "Wolves Territory",

    title: "Wolves Territory",
    description:
      "Ropa masculina y streetwear desde Medellín, Colombia. Conoce la colección ORIGEN de Wolves Territory.",

    images: [
      {
        url: "https://www.wolves-territory.co/og/wolves-territory-og-v2.png",
        width: 1200,
        height: 630,
        alt: "Wolves Territory",
      },
    ],
  },

  twitter: {
    card: "summary_large_image",

    title: "Wolves Territory",

    description:
      "Identidad, disciplina y territorio.",

    images: [
      "https://www.wolves-territory.co/og/wolves-territory-og-v2.png",
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <CartProvider>
          {children}
        </CartProvider>
      </body>
    </html>
  );
}