import Link from "next/link";
import { notFound } from "next/navigation";
import { getSettings, getArtGallery, ART_PAGE } from "@/lib/server";
import { cssVars, waLink } from "@/lib/data";
import ArtGallery from "@/components/ArtGallery";
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }) {
  const g = await getArtGallery(params.id);
  return { title: g ? g.title : "Artes disponíveis" };
}

export default async function Page({ params }) {
  const [s, g] = await Promise.all([getSettings(), getArtGallery(params.id)]);
  if (!g) notFound();
  const wa = s.whatsapp ? waLink(s.whatsapp, `Olá! Vi a galeria “${g.title}” no catálogo e escolhi um modelo. 😊`) : null;
  return (
    <main className="cat" style={cssVars(s.colors, s.fonts, s.shadow)}>
      <nav className="pbar"><Link href="/artes" className="nav-btn">Voltar</Link></nav>
      <section className="block arts">
        <h1 className="sec-title">{g.title}</h1>
        {g.description && <p className="arts-lead">{g.description}</p>}
        {g.note && <p className="art-note">{g.note}</p>}
        <ArtGallery galleryId={g.id} initial={g.items} total={g.total} pageSize={ART_PAGE} mark={s.arts?.watermark || s.name || ""} />
        {wa && <p className="center" style={{ marginTop: "2rem" }}><a className="btn" href={wa} target="_blank" rel="noreferrer">Escolhi meu modelo — falar no WhatsApp</a></p>}
      </section>
    </main>
  );
}
