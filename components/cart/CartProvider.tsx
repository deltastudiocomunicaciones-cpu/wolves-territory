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
  size?: string | null;
}

interface CartContextType {
  items: CartItem[];
  addItem: (
    product: Product,
    quantity?: number,
    size?: string | null
  ) => void;
  removeItem: (productId: number | string, size?: string | null) => void;
  updateQuantity: (
    productId: number | string,
    quantity: number,
    size?: string | null
  ) => void;
  clearCart: () => void;
  totalItems: number;
  subtotal: number;
}

const CartContext = createContext<CartContextType | undefined>(
  undefined
);

export function CartProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem("wolves-cart");

    if (savedCart) {
      try {
        setItems(JSON.parse(savedCart));
      } catch {
        localStorage.removeItem("wolves-cart");
      }
    }

    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;

    localStorage.setItem(
      "wolves-cart",
      JSON.stringify(items)
    );
  }, [items, loaded]);

  function addItem(
    product: Product,
    quantity = 1,
    size?: string | null
  ) {
    setItems((currentItems) => {
      const existingIndex = currentItems.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.size === size
      );

      if (existingIndex >= 0) {
        return currentItems.map((item, index) =>
          index === existingIndex
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item
        );
      }

      return [
        ...currentItems,
        {
          product,
          quantity,
          size,
        },
      ];
    });
  }

  function removeItem(
    productId: number | string,
    size?: string | null
  ) {
    setItems((currentItems) =>
      currentItems.filter(
        (item) =>
          !(
            item.product.id === productId &&
            item.size === size
          )
      )
    );
  }

  function updateQuantity(
    productId: number | string,
    quantity: number,
    size?: string | null
  ) {
    if (quantity <= 0) {
      removeItem(productId, size);
      return;
    }

    setItems((currentItems) =>
      currentItems.map((item) =>
        item.product.id === productId &&
        item.size === size
          ? {
              ...item,
              quantity,
            }
          : item
      )
    );
  }

  function clearCart() {
    setItems([]);
  }

  const totalItems = items.reduce(
    (total, item) => total + item.quantity,
    0
  );

  const subtotal = items.reduce(
    (total, item) =>
      total +
      item.product.price * item.quantity,
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
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(
      "useCart must be used inside CartProvider"
    );
  }

  return context;
}