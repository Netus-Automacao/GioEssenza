"use client";
import { useEffect, useState } from "react";
const KEY = "gio-essenza-carrinho-v1";

export function readCart() { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } }
export function writeCart(items) {
  try { localStorage.setItem(KEY, JSON.stringify(items)); } catch {}
  window.dispatchEvent(new Event("gio-cart"));
}
export function useCart() {
  const [items, setItems] = useState(null);
  useEffect(() => {
    const f = () => setItems(readCart());
    f();
    window.addEventListener("gio-cart", f); window.addEventListener("storage", f);
    return () => { window.removeEventListener("gio-cart", f); window.removeEventListener("storage", f); };
  }, []);
  return items;
}
/* itens com as mesmas escolhas somam quantidade; escolhas diferentes ficam separadas */
export function addToCart(item) {
  const c = readCart();
  const i = c.findIndex((x) => x.key === item.key);
  if (i >= 0) c[i] = { ...c[i], qty: item.max == null ? c[i].qty + item.qty : Math.min(item.max, c[i].qty + item.qty), max: item.max };
  else c.push(item);
  writeCart(c);
}
export const setQty = (key, qty) => writeCart(readCart().map((x) => (x.key === key ? { ...x, qty: Math.max(1, x.max == null ? qty : Math.min(x.max, qty)) } : x)));
export const removeItem = (key) => writeCart(readCart().filter((x) => x.key !== key));
export const clearCart = () => writeCart([]);
