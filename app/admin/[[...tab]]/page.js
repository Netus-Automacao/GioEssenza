import Admin from "@/components/admin/Admin";
export const metadata = { title: "Painel — Gio Essenza", robots: { index: false } };
export default function Page({ params }) { return <Admin initialTab={params.tab?.[0] || "dashboard"} />; }
