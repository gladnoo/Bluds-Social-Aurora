// Resolve a URL de uma imagem vinda da API. URLs do Supabase Storage já vêm
// completas (https://...); URLs antigas (salvas localmente, antes da migração
// pro Storage) vinham relativas e precisavam do prefixo da API.
export function resolveImageUrl(url) {
  if (!url) return null;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const apiOrigin = import.meta.env.VITE_API_URL || "http://localhost:3333";
  return `${apiOrigin}${url}`;
}
