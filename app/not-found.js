import Link from "next/link";
export default function NotFound() {
  return <main className="cat"><div className="closed-page"><h1>Página não encontrada</h1><p>Este produto não está mais disponível.</p><Link className="btn" href="/">Ver o catálogo</Link></div></main>;
}
