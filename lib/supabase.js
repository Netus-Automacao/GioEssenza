import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

export async function uploadImage(file) {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error("Use imagens JPG, PNG ou WebP.");
  if (file.size > 8 * 1024 * 1024) throw new Error("A imagem precisa ter até 8 MB.");
  const ext = file.name.split(".").pop().toLowerCase();
  const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, { cacheControl: "31536000" });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}

export async function uploadFont(file) {
  const ext = file.name.split(".").pop().toLowerCase();
  const types = { woff2: "font/woff2", woff: "font/woff", ttf: "font/ttf", otf: "font/otf" };
  if (!types[ext]) throw new Error("Use um arquivo de fonte .woff2, .woff, .ttf ou .otf.");
  if (file.size > 5 * 1024 * 1024) throw new Error("O arquivo da fonte precisa ter até 5 MB.");
  const path = `fontes/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, { cacheControl: "31536000", contentType: types[ext] });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}

export async function uploadVideo(file) {
  if (!/^video\/(mp4|quicktime|webm)$/.test(file.type)) throw new Error("Use vídeos MP4, MOV ou WebM.");
  if (file.size > 50 * 1024 * 1024) throw new Error("O vídeo precisa ter até 50 MB. Grave mais curto ou reduza a qualidade.");
  const ext = (file.name.split(".").pop() || "mp4").toLowerCase();
  const path = `videos/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  const { error } = await supabase.storage.from("images").upload(path, file, { cacheControl: "31536000", contentType: file.type });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}

// Artes disponíveis: originais preservados (até 25 MB), mockups e miniaturas gerados no painel
export async function uploadArtFile(fileOrBlob, folder, ext) {
  if (fileOrBlob.size > 25 * 1024 * 1024) throw new Error("Cada arte precisa ter até 25 MB.");
  const e = ext || (fileOrBlob.name?.split(".").pop() || "jpg").toLowerCase();
  const path = `artes/${folder}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${e}`;
  const { error } = await supabase.storage.from("images").upload(path, fileOrBlob, { cacheControl: "31536000", contentType: fileOrBlob.type || undefined });
  if (error) throw error;
  return supabase.storage.from("images").getPublicUrl(path).data.publicUrl;
}
export async function removeStored(urls) {
  const paths = urls.filter(Boolean).map((u) => u.split("/object/public/images/")[1]).filter(Boolean);
  if (paths.length) await supabase.storage.from("images").remove(paths).catch(() => {});
}
