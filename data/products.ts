export interface ProductVariant {
  color: string;
  colorHex: string;
  slug: string;
  image: string;
  images: string[];

  skuBase?: string;
}

export interface Product {
  id: number | string;
  slug: string;
  name: string;
  category: string;
  price: number;

  image: string;
  images?: string[];

  // SKU directo para productos sin talla
  sku?: string;

  variants?: ProductVariant[];

  collection?: string;
  featured?: boolean;
  description?: string;
}

export const products: Product[] = [
  // =========================================================
  // HOODIE
  // =========================================================
  {
    id: 1,
    slug: "origen-hoodie-black",
    name: "Origen Hoodie Black",
    category: "Hoodie",
    price: 449000,

    image: "/products/origen-hoodie-black.webp",

    images: [
      "/products/origen-hoodie-black.webp",
      "/products/origen-hoodie-black-1.webp",
      "/products/origen-hoodie-black-2.webp",
      "/products/origen-hoodie-black-3.webp",
      "/products/origen-hoodie-black-4.webp",
    ],

    variants: [
      {
        color: "Black",
        colorHex: "#111111",
        slug: "origen-hoodie-black",
        skuBase: "WT-HOOD-BLK",

        image: "/products/origen-hoodie-black.webp",

        images: [
          "/products/origen-hoodie-black.webp",
          "/products/origen-hoodie-black-1.webp",
          "/products/origen-hoodie-black-2.webp",
          "/products/origen-hoodie-black-3.webp",
          "/products/origen-hoodie-black-4.webp",
        ],
      },
    ],

    featured: true,
    collection: "Origen",

    description:
      "Heavyweight premium hoodie built for intentional men.",
  },

  // =========================================================
  // T-SHIRT
  // =========================================================
  {
    id: 2,
    slug: "origen-tshirt-black",
    name: "Origen T-Shirt",
    category: "T-Shirt",
    price: 249000,

    image: "/products/origen-tshirt-black.webp",

    images: [
      "/products/origen-tshirt-black.webp",
      "/products/origen-tshirt-black-2.webp",
      "/products/origen-tshirt-black-3.webp",
      "/products/origen-tshirt-black-4.webp",
    ],

    variants: [
      {
        color: "Black",
        colorHex: "#111111",
        slug: "origen-tshirt-black",
        skuBase: "WT-TSH-BLK",

        image: "/products/origen-tshirt-black.webp",

        images: [
          "/products/origen-tshirt-black.webp",
          "/products/origen-tshirt-black-2.webp",
          "/products/origen-tshirt-black-3.webp",
          "/products/origen-tshirt-black-4.webp",
          "/products/origen-tshirt-black-1.webp",
        ],
      },

      {
        color: "White",
        colorHex: "#f5f5f2",
        slug: "origen-tshirt-white",
        skuBase: "WT-TSH-WHT",

        image: "/products/origen-tshirt-white.webp",

        images: [
          "/products/origen-tshirt-white.webp",
          "/products/origen-tshirt-white-2.webp",
          "/products/origen-tshirt-white-3.webp",
          "/products/origen-tshirt-white-4.webp",
          "/products/origen-tshirt-white-1.webp",
        ],
      },

      {
        color: "Red",
        colorHex: "#d71920",
        slug: "origen-tshirt-red",
        skuBase: "WT-TSH-RED",

        image: "/products/origen-tshirt-red.webp",

        images: [
          "/products/origen-tshirt-red.webp",
          "/products/origen-tshirt-red-2.webp",
          "/products/origen-tshirt-red-3.webp",
          "/products/origen-tshirt-red-4.webp",
          "/products/origen-tshirt-red-1.webp",
        ],
      },
    ],

    featured: true,
    collection: "Origen",

    description:
      "Premium oversized t-shirt with Wolves Territory identity.",
  },

  // =========================================================
  // POLO
  // =========================================================
  {
    id: 3,
    slug: "origen-polo-gray",
    name: "Origen Polo Gray",
    category: "Polo",
    price: 279000,

    image: "/products/origen-polo-gray.webp",

    images: [
      "/products/origen-polo-gray.webp",
      "/products/origen-polo-gray-1.webp",
      "/products/origen-polo-gray-2.webp",
      "/products/origen-polo-gray-3.webp",
      "/products/origen-polo-gray-4.webp",
    ],

    variants: [
      {
        color: "Gray",
        colorHex: "#7a7a7a",
        slug: "origen-polo-gray",
        skuBase: "WT-POLO-GRY",

        image: "/products/origen-polo-gray.webp",

        images: [
          "/products/origen-polo-gray.webp",
          "/products/origen-polo-gray-1.webp",
          "/products/origen-polo-gray-2.webp",
          "/products/origen-polo-gray-3.webp",
          "/products/origen-polo-gray-4.webp",
        ],
      },
    ],

    featured: true,
    collection: "Origen",

    description:
      "Minimalist premium polo inspired by discipline and territory.",
  },

  // =========================================================
  // SHORT
  // =========================================================
  {
    id: 4,
    slug: "origen-short-beige",
    name: "Origen Short Beige",
    category: "Short",
    price: 299000,

    image: "/products/origen-short-beige.webp",

    images: [
      "/products/origen-short-beige.webp",
      "/products/origen-short-beige-1.webp",
      "/products/origen-short-beige-2.webp",
      "/products/origen-short-beige-3.webp",
    ],

    variants: [
      {
        color: "Beige",
        colorHex: "#d8c3a5",
        slug: "origen-short-beige",
        skuBase: "WT-SHORT-BGE",

        image: "/products/origen-short-beige.webp",

        images: [
          "/products/origen-short-beige.webp",
          "/products/origen-short-beige-1.webp",
          "/products/origen-short-beige-2.webp",
          "/products/origen-short-beige-3.webp",
        ],
      },
    ],

    collection: "Origen",

    description:
      "Premium athletic short for movement and comfort.",
  },

  // =========================================================
  // CAPS
  // =========================================================
  {
    id: 5,
    slug: "origen-cap",
    name: "Origen",
    category: "Cap",
    price: 80000,
    sku: "WT-CAP-ORIGEN",

    image: "/products/caps/origen.webp",

    images: [
      "/products/caps/origen.webp",
      "/products/caps/origen-side.webp",
      "/products/caps/origen-back.webp",
    ],

    collection: "Origen",

    description:
      "First season Wolves Territory cap.",
  },

  {
    id: 6,
    slug: "origen-cap-black",
    name: "WT Delta Black",
    category: "Cap",
    price: 219900,
    sku: "WT-CAP-DELTA-BLK",

    image: "/products/caps/delta-black.webp",

    images: [
      "/products/caps/delta-black.webp",
      "/products/caps/delta-black-side.webp",
      "/products/caps/delta-black-back.webp",
    ],

    collection: "Performance",

    description:
      "Performance cap with Flexfit 180AP base and premium construction.",
  },

  {
    id: 7,
    slug: "origen-cap-white",
    name: "WT Delta White",
    category: "Cap",
    price: 219900,
    sku: "WT-CAP-DELTA-WHT",
    image: "/products/caps/delta-white.webp",

    images: [
      "/products/caps/delta-white.webp",
      "/products/caps/delta-white-side.webp",
      "/products/caps/delta-white-back.webp",
    ],

    collection: "Performance",

    description:
      "White performance cap with Flexfit 180AP base.",
  },

  {
    id: 8,
    slug: "origen-cap-red",
    name: "WT Alpha Red",
    category: "Cap",
    price: 169900,
    sku: "WT-CAP-ALPHA-RED",

    image: "/products/caps/alpha-red.webp",

    images: [
      "/products/caps/alpha-red.webp",
      "/products/caps/alpha-red-side.webp",
      "/products/caps/alpha-red-back.webp",
    ],

    collection: "Performance",

    description:
      "Red performance cap with Flexfit 180AP base.",
  },

  {
    id: 9,
    slug: "wt-alpha-black",
    name: "WT Alpha Black",
    category: "Cap",
    price: 169900,
    sku: "WT-CAP-ALPHA-BLK",

    image: "/products/caps/alpha-black.webp",

     images: [
      "/products/caps/alpha-black.webp",
      "/products/caps/alpha-black-side.webp",
      "/products/caps/alpha-black-back.webp",
    ],

    collection: "Classic",

    description:
      "Classic premium black cap with Flexfit 110P base.",
  },

  {
    id: 10,
    slug: "wt-trail-black-white",
    name: "WT Trail Black / White",
    category: "Cap",
    price: 139900,
    sku: "WT-CAP-TRAIL-BLK-WHT",

    image: "/products/caps/trail-black-white.webp",

    images: [
      "/products/caps/trail-black-white.webp",
      "/products/caps/trail-black-white-side.webp",
      "/products/caps/trail-black-white-back.webp",
    ],

    collection: "Trucker",

    description:
      "Black and white trucker cap with Flexfit 110MT base.",
  },

  {
    id: 11,
    slug: "wt-trail-heather-white",
    name: "WT Trail Heather / White",
    category: "Cap",
    price: 139900,
    sku: "WT-CAP-TRAIL-HEATHER-WHT",

    image: "/products/caps/trail-heather-white.webp",

    images: [
      "/products/caps/trail-heather-white.webp",
      "/products/caps/trail-heather-white-side.webp",
      "/products/caps/trail-heather-white-back.webp",
    ],

    collection: "Trucker",

    description:
      "Heather and white trucker cap with Flexfit 110MT base.",
  },

  {
    id: 14,
    slug: "wt-night-wolf",
    name: "WT Night Wolf",
    category: "Cap",
    price: 219800,
    sku: "WT-CAP-NIGHT-WOLF-BLK",

    image: "/products/caps/night-wolf.webp",

    images: [
      "/products/caps/night-wolf.webp",
      "/products/caps/night-wolf-side.webp",
      "/products/caps/night-wolf-back.webp",
    ],

    collection: "Performance",

    description:
      "Premium black Wolves Territory cap with signature wolf detailing.",
  },

  {
    id: 15,
    slug: "wt-alpha-white",
    name: "WT Alpha White",
    category: "Cap",
    price: 169900,
    sku: "WT-CAP-ALPHA-WHT",

    image: "/products/caps/alpha-white.webp",

    images: [
      "/products/caps/alpha-white.webp",
      "/products/caps/alpha-white-side.webp",
      "/products/caps/alpha-white-back.webp",
    ],

    collection: "Classic",

    description:
      "Premium white Wolves Territory cap with black embroidered detailing.",
  },

  // =========================================================
  // ACCESSORY
  // =========================================================
  {
    id: 13,
    slug: "origen-llavero",
    name: "Origen Llavero",
    category: "Accessory",
    price: 22000,
    sku: "WT-ACC-KEYCHAIN",

    image: "/products/origen-keychain.webp",

    collection: "Origen",
  },
];