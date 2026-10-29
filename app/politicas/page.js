import Link from "next/link";
import { getSettings } from "@/lib/server";
import { cssVars } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Políticas da loja" };

export default async function Page() {
  const s = await getSettings();
  return (
    <main className="cat" style={cssVars(s.colors, s.fonts)}>
      <nav className="pbar"><Link href="/" className="nav-btn">Voltar</Link></nav>
      <section className="block policies">
        <h1 className="sec-title">{s.policies.title || "Políticas da loja"}</h1>
        {s.policies.text ? s.policies.text.split("\n").map((l, i) => (l.trim() ? <p key={i}>{l}</p> : <br key={i} />)) : <p>Em breve.</p>}
      </section>
    </main>
  );
}
