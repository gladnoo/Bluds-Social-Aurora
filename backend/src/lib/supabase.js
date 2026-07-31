import { createClient } from "@supabase/supabase-js";

// Cliente com a Service Role Key: só usado no backend, nunca no frontend.
// Ela ignora as políticas de RLS do bucket, então o upload sempre funciona
// independente de como o bucket estiver configurado.
export const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

const BUCKET = process.env.SUPABASE_STORAGE_BUCKET || "uploads";

// Sobe um arquivo (buffer, vindo do multer com memoryStorage) pro Supabase Storage
// e devolve a URL pública dele.
export async function uploadToStorage(buffer, mimetype, path) {
  const { error } = await supabase.storage.from(BUCKET).upload(path, buffer, {
    contentType: mimetype,
    upsert: true,
  });
  if (error) throw new Error(`Falha no upload da imagem: ${error.message}`);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
