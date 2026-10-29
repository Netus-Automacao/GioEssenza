import { Marcellus, Figtree } from "next/font/google";
import "./globals.css";
import { getSettings } from "@/lib/server";

const display = Marcellus({ subsets: ["latin"], weight: "400", variable: "--f-display" });
const body = Figtree({ subsets: ["latin"], variable: "--f-body" });

export async function generateMetadata() {
  try {
    const s = await getSettings();
    return { title: `${s.name} — ${s.slogan}`, description: s.description, icons: s.logo ? { icon: s.logo } : undefined, openGraph: { title: s.name, description: s.description, images: s.logo ? [s.logo] : [] } };
  } catch { return { title: "Gio Essenza" }; }
}

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR" className={`${display.variable} ${body.variable}`}>
      <head><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" /></head>
      <body>{children}</body>
    </html>
  );
}
