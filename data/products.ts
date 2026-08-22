export interface ProductVariant {
  color: string;
  colorHex: string;
  slug: string;
  image: string;
  images: string[];
}

export interface Product {
  id: number | string;
  slug: string;
  name: string;
  category: string;
  price: number;
  image: string;
  images?: string[];
  variants?: ProductVariant[];
  collection?: string;
  featured?: boolean;
  description?: string;
}

export const products: Product[] = [
  {
  id: 1,
  slug: "origen-hoodie-black",
  name: "Origen Hoodie Black",
  category: "Hoodie",
  price: 449000,

  // Imagen principal de la card
  image: "/products/origen-hoodie-black.png",

  // Galería del hoodie
  images: [
    "/products/origen-hoodie-black.png",
    "/products/origen-hoodie-black-1.png",
    "/products/origen-hoodie-black-2.png",
    "/products/origen-hoodie-black-3.png",
    "/products/origen-hoodie-black-4.png",
  ],

  featured: true,
  collection: "Origen",

  description:
    "Heavyweight premium hoodie built for intentional men.",
},

 {
  id: 2,
  slug: "origen-tshirt-black",
  name: "Origen T-Shirt",
  category: "T-Shirt",
  price: 249000,

  // Esta es la imagen que aparece en la CARD del catálogo
  image: "/products/origen-tshirt-black.png",

  // Galería actual de la camiseta negra
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

  {
  id: 3,
  slug: "origen-polo-gray",
  name: "Origen Polo Gray",
  category: "Polo",
  price: 279000,

  // Imagen principal de la card
  image: "/products/origen-polo-gray.png",

  // Galería del polo gris
  images: [
    "/products/origen-polo-gray.png",
    "/products/origen-polo-gray-2.png",
    "/products/origen-polo-gray-3.png",
    "/products/origen-polo-gray-4.png",
    "/products/origen-polo-gray-1.png",
  ],

  variants: [
    {
      color: "Gray",
      colorHex: "#7a7a7a",
      slug: "origen-polo-gray",
      image: "/products/origen-polo-gray.png",

      images: [
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

  {
  id: 4,
  slug: "origen-short-beige",
  name: "Origen Short Beige",
  category: "Short",
  price: 299000,

  // Imagen principal de la card
  image: "/products/origen-short-beige.png",

  // Galería del short
  images: [
    "/products/origen-short-beige.png",
    "/products/origen-short-beige-1.png",
    "/products/origen-short-beige-2.png",
    "/products/origen-short-beige-3.png",
  ],

  collection: "Origen",

  description:
    "Premium athletic short for movement and comfort.",
},

  {
    id: 5, 
    slug: "origen-cap",
    name: "Origen",
    category: "Cap",
    price: 80000,
    image: "/products/caps/origen.png",
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
    image: "/products/caps/delta-black.png",
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
    image: "/products/caps/delta-white.png",
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
    image: "/products/caps/alpha-red.png",
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
    image: "/products/caps/alpha-black.png",
    collection: "Classic",
    description:
      "Classic premium black cap with Flexfit 110P base.",
  },

 
  {
    id: 11,
    slug: "wt-trail-black-white",
    name: "WT Trail Black / White",
    category: "Cap",
    price: 139900,
    image: "/products/caps/trail-black-white.png",
    collection: "Trucker",
    description:
      "Black and white trucker cap with Flexfit 110MT base.",
  },

  {
    id: 12,
    slug: "wt-trail-heather-white",
    name: "WT Trail Heather / White",
    category: "Cap",
    price: 139900,
    image: "/products/caps/trail-heather-white.png",
    collection: "Trucker",
    description:
      "Heather and white trucker cap with Flexfit 110MT base.",
  },

  {
    id: 13,
    slug: "origen-llavero",
    name: "Origen Llavero",
    category: "Accessory",
    price: 22000,
    image: "/products/origen-keychain.png",
    collection: "Origen",
  },
];