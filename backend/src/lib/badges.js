// Emblemas calculados na hora a partir das estatísticas do usuário — não
// precisa de tabela nova no banco, é só matemática em cima do que já existe.
export const BADGE_DEFS = {
  "primeiro-post": { label: "Primeira postagem", description: "Publicou o primeiro post" },
  "cem-posts": { label: "Voz ativa", description: "100 posts publicados" },
  popular: { label: "Popular", description: "50 ou mais seguidores" },
  influente: { label: "Influente", description: "200 ou mais seguidores" },
  querido: { label: "Querido", description: "100 ou mais curtidas recebidas" },
  veterano: { label: "Veterano", description: "6 meses ou mais de Bluds" },
};

export function computeBadges({ postsCount, followersCount, totalLikesReceived, accountAgeDays }) {
  const badges = [];
  if (postsCount >= 1) badges.push("primeiro-post");
  if (postsCount >= 100) badges.push("cem-posts");
  if (followersCount >= 50) badges.push("popular");
  if (followersCount >= 200) badges.push("influente");
  if (totalLikesReceived >= 100) badges.push("querido");
  if (accountAgeDays >= 180) badges.push("veterano");
  return badges;
}
