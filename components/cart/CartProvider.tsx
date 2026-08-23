"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { Product } from "@/data/products";

export interface CartItem {
  product: Product;

  quantity: number;

  color?: string | null;
  size?: string | null;
  sku?: string | null;
}

interface CartContextType {
  items: CartItem[];

  addItem: (
    product: Product,
    quantity?: number,
    size?: string | null,
    color?: string | null,
    sku?: string | null
  ) => void;

  removeItem: (
    productId: number | string,
    size?: string | null,
    color?: string | null,
    sku?: string | null
  ) => void;

  updateQuantity: (
    productId: number | string,
    quantity: number,
    size?: string | null,
    color?: string | null,
    sku?: string | null
  ) => void;

  clearCart: () => void;

  totalItems: number;
  subtotal: number;
}

const CartContext =
  createContext<CartContextType | undefined>(
    undefined
  );

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>(
    []
  );

  const [loaded, setLoaded] =
    useState(false);

  /*
   * CARGAR CARRITO
   */
  useEffect(() => {
    const savedCart =
      localStorage.getItem("wolves-cart");

    if (savedCart) {
      try {
        setItems(
          JSON.parse(savedCart)
        );
      } catch {
        localStorage.removeItem(
          "wolves-cart"
        );
      }
    }

    setLoaded(true);
  }, []);

  /*
   * GUARDAR CARRITO
   */
  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "wolves-cart",
      JSON.stringify(items)
    );
  }, [items, loaded]);

  /*
   * ADD ITEM
   */
  function addItem(
    product: Product,
    quantity = 1,
    size?: string | null,
    color?: string | null,
    sku?: string | null
  ) {
    setItems((currentItems) => {
      const existingIndex =
        currentItems.findIndex(
          (item) =>
            item.product.id ===
              product.id &&
            item.size === size &&
            item.color === color &&
            item.sku === sku
        );

      /*
       * MISMO SKU:
       * aumentamos cantidad.
       */
      if (existingIndex >= 0) {
        return currentItems.map(
          (item, index) =>
            index === existingIndex
              ? {
                  ...item,
                  quantity:
                    item.quantity +
                    quantity,
                }
              : item
        );
      }

      /*
       * NUEVA VARIANTE
       */
      return [
        ...currentItems,
        {
          product,
          quantity,
          size: size ?? null,
          color: color ?? null,
          sku: sku ?? null,
        },
      ];
    });
  }

  /*
   * REMOVE ITEM
   */
  function removeItem(
    productId: number | string,
    size?: string | null,
    color?: string | null,
    sku?: string | null
  ) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.product.id ===
              productId &&
            item.size === size &&
            item.color === color &&
            item.sku === sku
          )
      )
    );
  }

  /*
   * UPDATE QUANTITY
   */
  function updateQuantity(
    productId: number | string,
    quantity: number,
    size?: string | null,
    color?: string | null,
    sku?: string | null
  ) {
    if (quantity <= 0) {
      removeItem(
        productId,
        size,
        color,
        sku
      );

      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id ===
          productId &&
        item.size === size &&
        item.color === color &&
        item.sku === sku
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  /*
   * CLEAR CART
   */
  function clearCart() {
    setItems([]);
  }

  /*
   * TOTAL ITEMS
   */
  const totalItems = items.reduce(
    (total, item) =>
      total + item.quantity,
    0
  );

  /*
   * SUBTOTAL
   */
  const subtotal = items.reduce(
    (total, item) =>
      total +
      item.product.price *
        item.quantity,
    0
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        subtotal,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context =
    useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}