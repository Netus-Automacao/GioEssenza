import "./globals.css";
import { getSettings } from "@/lib/server";
import { DEFAULT_SETTINGS, fontsHref, fontFaceCss } from "@/lib/data";

export async function generateMetadata() {
  try {
    const s = await getSettings();
    return { title: `${s.name} — ${s.slogan}`, description: s.description, icons: s.logo ? { icon: s.logo } : undefined, openGraph: { title: s.name, description: s.description, images: s.logo ? [s.logo] : [] } };
  } catch { return { title: "Gio Essenza" }; }
}

export default async function RootLayout({ children }) {
  let f = DEFAULT_SETTINGS.fonts;
  try { f = (await getSettings()).fonts; } catch {}
  return (
    <html lang="pt-BR">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="stylesheet" href={fontsHref([f.title, f.body, "Figtree", "Marcellus"])} />
        {fontFaceCss(f) && <style dangerouslySetInnerHTML={{ __html: fontFaceCss(f) }} />}
      </head>
      <body>{children}</body>
    </html>
  );
}
