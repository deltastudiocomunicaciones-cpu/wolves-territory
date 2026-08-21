export interface Product {
  id: number | string;
  slug?: string;
  name: string;
  category: string;
  price: number;
  image: string;
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
    price: 410000,
    image: "/products/origen-hoodie-black.jpg",
    featured: true,
    description:
      "Heavyweight premium hoodie built for intentional men.",
    collection: "Origen",
  },

  {
    id: 2,
    slug: "origen-tshirt-black",
    name: "Origen T-Shirt Black",
    category: "T-Shirt",
    price: 220000,
    image: "/products/origen-tshirt-black.png",
    featured: true,
    description:
      "Premium oversized t-shirt with Wolves Territory identity.",
    collection: "Origen",
  },

  {
    id: 3,
    slug: "origen-polo-gray",
    name: "Origen Polo Gray",
    category: "Polo",
    price: 230000,
    image: "/products/origen-polo-gray.png",
    featured: true,
    description:
      "Minimalist premium polo inspired by discipline and territory.",
    collection: "Origen",
  },

  {
    id: 4,
    slug: "origen-short-beige",
    name: "Origen Short Beige",
    category: "Short",
    price: 300000,
    image: "/products/origen-short-beige.jpeg",
    description:
      "Premium athletic short for movement and comfort.",
    collection: "Origen",
  },

  {
    id: "cap-origen",
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
    id: "cap-delta-black",
    slug: "wt-delta-black",
    name: "WT Delta Black",
    category: "Cap",
    price: 219900,
    image: "/products/caps/delta-black.png",
    collection: "Performance",
    description:
      "Performance cap with Flexfit 180AP base and premium construction.",
  },

  {
    id: "cap-delta-white",
    slug: "wt-delta-white",
    name: "WT Delta White",
    category: "Cap",
    price: 219900,
    image: "/products/caps/delta-white.png",
    collection: "Performance",
    description:
      "White performance cap with Flexfit 180AP base.",
  },

  {
    id: "cap-alpha-black",
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
    id: "cap-alpha-red",
    slug: "wt-alpha-red",
    name: "WT Alpha Red",
    category: "Cap",
    price: 169900,
    image: "/products/caps/alpha-red.png",
    collection: "Classic",
    description:
      "Classic premium red cap with Flexfit 110P base.",
  },

  {
    id: "cap-trail-black-white",
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
    id: "cap-trail-heather-white",
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
    id: 12,
    slug: "origen-llavero",
    name: "Origen Llavero",
    category: "Accessory",
    price: 22000,
    image: "/products/origen-keychain.jpg",
    collection: "Origen",
  },
];