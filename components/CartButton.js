"use client";
import Link from "next/link";
import { useCart } from "@/lib/cart";
export default function CartButton() {
  const items = useCart();
  const n = (items || []).reduce((a, x) => a + x.qty, 0);
  return (
    <Link href="/carrinho" className="nav-btn" aria-label={`Carrinho, ${n} itens`}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden="true"><path d="M5 7h14l-1.2 11.2a2 2 0 0 1-2 1.8H8.2a2 2 0 0 1-2-1.8L5 7Z"/><path d="M9 7V6a3 3 0 0 1 6 0v1"/></svg>
      Carrinho{n > 0 && <b>{n}</b>}
    </Link>
  );
}
