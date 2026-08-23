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

    image: "/products/origen-hoodie-black.png",

    images: [
      "/products/origen-hoodie-black.png",
      "/products/origen-hoodie-black-1.png",
      "/products/origen-hoodie-black-2.png",
      "/products/origen-hoodie-black-3.png",
      "/products/origen-hoodie-black-4.png",
    ],

    variants: [
      {
        color: "Black",
        colorHex: "#111111",
        slug: "origen-hoodie-black",
        skuBase: "WT-HOOD-BLK",

        image: "/products/origen-hoodie-black.png",

        images: [
          "/products/origen-hoodie-black.png",
          "/products/origen-hoodie-black-1.png",
          "/products/origen-hoodie-black-2.png",
          "/products/origen-hoodie-black-3.png",
          "/products/origen-hoodie-black-4.png",
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

    image: "/products/origen-tshirt-black.png",

    images: [
      "/products/origen-tshirt-black.png",
      "/products/origen-tshirt-black-2.png",
      "/products/origen-tshirt-black-3.png",
      "/products/origen-tshirt-black-4.png",
    ],

    variants: [
      {
        color: "Black",
        colorHex: "#111111",
        slug: "origen-tshirt-black",
        skuBase: "WT-TSH-BLK",

        image: "/products/origen-tshirt-black.png",

        images: [
          "/products/origen-tshirt-black.png",
          "/products/origen-tshirt-black-2.png",
          "/products/origen-tshirt-black-3.png",
          "/products/origen-tshirt-black-4.png",
          "/products/origen-tshirt-black-1.png",
        ],
      },

      {
        color: "White",
        colorHex: "#f5f5f2",
        slug: "origen-tshirt-white",
        skuBase: "WT-TSH-WHT",

        image: "/products/origen-tshirt-white.png",

        images: [
          "/products/origen-tshirt-white.png",
          "/products/origen-tshirt-white-2.png",
          "/products/origen-tshirt-white-3.png",
          "/products/origen-tshirt-white-4.png",
          "/products/origen-tshirt-white-1.png",
        ],
      },

      {
        color: "Red",
        colorHex: "#d71920",
        slug: "origen-tshirt-red",
        skuBase: "WT-TSH-RED",

        image: "/products/origen-tshirt-red.png",

        images: [
          "/products/origen-tshirt-red.png",
          "/products/origen-tshirt-red-2.png",
          "/products/origen-tshirt-red-3.png",
          "/products/origen-tshirt-red-4.png",
          "/products/origen-tshirt-red-1.png",
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

    image: "/products/origen-polo-gray.png",

    images: [
      "/products/origen-polo-gray.png",
      "/products/origen-polo-gray-1.png",
      "/products/origen-polo-gray-2.png",
      "/products/origen-polo-gray-3.png",
      "/products/origen-polo-gray-4.png",
    ],

    variants: [
      {
        color: "Gray",
        colorHex: "#7a7a7a",
        slug: "origen-polo-gray",
        skuBase: "WT-POLO-GRY",

        image: "/products/origen-polo-gray.png",

        images: [
          "/products/origen-polo-gray.png",
          "/products/origen-polo-gray-1.png",
          "/products/origen-polo-gray-2.png",
          "/products/origen-polo-gray-3.png",
          "/products/origen-polo-gray-4.png",
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

    image: "/products/origen-short-beige.png",

    images: [
      "/products/origen-short-beige.png",
      "/products/origen-short-beige-1.png",
      "/products/origen-short-beige-2.png",
      "/products/origen-short-beige-3.png",
    ],

    variants: [
      {
        color: "Beige",
        colorHex: "#d8c3a5",
        slug: "origen-short-beige",
        skuBase: "WT-SHORT-BGE",

        image: "/products/origen-short-beige.png",

        images: [
          "/products/origen-short-beige.png",
          "/products/origen-short-beige-1.png",
          "/products/origen-short-beige-2.png",
          "/products/origen-short-beige-3.png",
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

    image: "/products/caps/origen.png",

    images: [
      "/products/caps/origen.png",
      "/products/caps/origen-side.png",
      "/products/caps/origen-back.png",
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

    image: "/products/caps/delta-black.png",

    images: [
      "/products/caps/delta-black.png",
      "/products/caps/delta-black-side.png",
      "/products/caps/delta-black-back.png",
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
    image: "/products/caps/delta-white.png",

    images: [
      "/products/caps/delta-white.png",
      "/products/caps/delta-white-side.png",
      "/products/caps/delta-white-back.png",
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

    image: "/products/caps/alpha-red.png",

    images: [
      "/products/caps/alpha-red.png",
      "/products/caps/alpha-red-side.png",
      "/products/caps/alpha-red-back.png",
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

    image: "/products/caps/alpha-black.png",

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

    image: "/products/caps/trail-black-white.png",

    images: [
      "/products/caps/trail-black-white.png",
      "/products/caps/trail-black-white-side.png",
      "/products/caps/trail-black-white-back.png",
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

    image: "/products/caps/trail-heather-white.png",

    images: [
      "/products/caps/trail-heather-white.png",
      "/products/caps/trail-heather-white-side.png",
      "/products/caps/trail-heather-white-back.png",
    ],

    collection: "Trucker",

    description:
      "Heather and white trucker cap with Flexfit 110MT base.",
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

    image: "/products/origen-keychain.png",

    collection: "Origen",
  },
];