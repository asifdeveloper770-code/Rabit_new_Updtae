import { useCallback, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  qty: number;
};

const KEY = "jr_cart_v1";

function readCart(): CartItem[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .filter(
        (item): item is CartItem =>
          item &&
          typeof item.id === "string" &&
          item.id.length > 0 &&
          typeof item.qty === "number" &&
          Number.isFinite(item.qty) &&
          item.qty > 0
      )
      .map((item) => ({
        id: String(item.id),
        qty: Math.max(1, Math.floor(item.qty)),
      }));
  } catch (error) {
    console.error("Failed to read cart:", error);
    return [];
  }
}

function saveCart(items: CartItem[]) {
  if (typeof window === "undefined") {
    return;
  }

  const cleanItems = items
    .filter((item) => item.id && item.qty > 0)
    .map((item) => ({
      id: String(item.id),
      qty: Math.floor(item.qty),
    }));

  localStorage.setItem(KEY, JSON.stringify(cleanItems));

  // Same-tab synchronization
  window.dispatchEvent(
    new CustomEvent("jr:cart", {
      detail: cleanItems,
    })
  );
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const syncCart = () => {
      setItems(readCart());
    };

    // Initial load
    syncCart();

    // Same browser tab
    window.addEventListener("jr:cart", syncCart);

    // Other browser tabs
    window.addEventListener("storage", syncCart);

    return () => {
      window.removeEventListener("jr:cart", syncCart);
      window.removeEventListener("storage", syncCart);
    };
  }, []);

  const add = useCallback((id: string, qty = 1) => {
    if (!id || qty <= 0) {
      return;
    }

    const productId = String(id);
    const current = readCart();

    const existing = current.find(
      (item) => String(item.id) === productId
    );

    const next = existing
      ? current.map((item) =>
          String(item.id) === productId
            ? {
                ...item,
                qty: item.qty + qty,
              }
            : item
        )
      : [
          ...current,
          {
            id: productId,
            qty,
          },
        ];

    saveCart(next);

    // Immediately update this hook instance
    setItems(next);
  }, []);

  const remove = useCallback((id: string) => {
    const productId = String(id);

    const next = readCart().filter(
      (item) => String(item.id) !== productId
    );

    saveCart(next);
    setItems(next);
  }, []);

  const setQty = useCallback((id: string, qty: number) => {
    const productId = String(id);

    if (qty <= 0) {
      const next = readCart().filter(
        (item) => String(item.id) !== productId
      );

      saveCart(next);
      setItems(next);
      return;
    }

    const next = readCart().map((item) =>
      String(item.id) === productId
        ? {
            ...item,
            qty: Math.floor(qty),
          }
        : item
    );

    saveCart(next);
    setItems(next);
  }, []);

  const clear = useCallback(() => {
    saveCart([]);
    setItems([]);
  }, []);

  const count = items.reduce(
    (total, item) => total + item.qty,
    0
  );

  return {
    items,
    add,
    remove,
    setQty,
    clear,
    count,
  };
}