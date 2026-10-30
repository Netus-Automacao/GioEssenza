import Link from "next/link";
import { getSettings, getArtGalleries } from "@/lib/server";
import { cssVars } from "@/lib/data";
export const dynamic = "force-dynamic";
export const metadata = { title: "Artes disponíveis" };

export default async function Page() {
  const [s, gals] = await Promise.all([getSettings(), getArtGalleries()]);
  const title = s.arts?.title || "Artes disponíveis";
  return (
    <main className="cat" style={cssVars(s.colors, s.fonts, s.shadow)}>
      <nav className="pbar"><Link href="/" className="nav-btn">Voltar</Link></nav>
      <section className="block arts">
        <h1 className="sec-title">{title}</h1>
        <p className="arts-lead">Escolha a galeria e veja os modelos disponíveis para personalização.</p>
        {gals.length === 0 ? <p className="empty">Em breve, novas artes por aqui.</p> : (
          <div className="art-gals">
            {gals.map((g) => (
              <Link key={g.id} href={`/artes/${g.id}`} className="art-gal">
                <div className={`art-gal-covers n${Math.min(g.covers.length, 4)}`}>
                  {g.covers.length ? g.covers.map((u, i) => <img key={i} src={u} alt="" loading="lazy" />) : <span className="ph">{g.title.charAt(0)}</span>}
                </div>
                <strong>{g.title}</strong>
                <span>{g.count} modelo(s)</span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
