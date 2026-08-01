import { prisma } from "./prisma.js";

// Hacker News: 100% público, sem chave, sem bloqueio de servidor.
async function fetchHackerNews() {
  try {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!idsRes.ok) return { items: [], status: idsRes.status };
    const ids = (await idsRes.json()).slice(0, 15);

    const raw = await Promise.all(
      ids.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    const items = raw
      .filter((p) => p && p.title)
      .map((p) => ({
        title: p.title,
        link: p.url || `https://news.ycombinator.com/item?id=${p.id}`,
        image: null,
        hashtag: "#tech",
      }));

    return { items, status: 200 };
  } catch {
    return { items: [], status: 0 };
  }
}

// TMDB: filmes/séries/famosos em alta — ótimo pra "mundo pop".
// Precisa de uma chave grátis (TMDB_API_KEY). Se não configurar, essa fonte é ignorada.
async function fetchTmdbTrending() {
  const key = process.env.TMDB_API_KEY;
  if (!key) return { items: [], status: 0, skipped: true };

  try {
    const res = await fetch(`https://api.themoviedb.org/3/trending/all/day?api_key=${key}&language=pt-BR`);
    if (!res.ok) return { items: [], status: res.status };
    const data = await res.json();

    const items = (data.results || [])
      .filter((p) => p.title || p.name)
      .map((p) => {
        const kind = p.media_type === "tv" ? "tv" : p.media_type === "person" ? "person" : "movie";
        const image = p.poster_path || p.profile_path;
        return {
          title: p.title || p.name,
          link: `https://www.themoviedb.org/${kind}/${p.id}`,
          image: image ? `https://image.tmdb.org/t/p/w500${image}` : null,
          hashtag: "#popcultura",
        };
      });

    return { items, status: 200 };
  } catch {
    return { items: [], status: 0 };
  }
}

// Busca notícias/conteúdo novo e posta na conta do bot. Evita repetir o mesmo
// link checando se ele já apareceu num post anterior do bot.
export async function runNewsBot() {
  const botUsername = process.env.BOT_USERNAME;
  if (!botUsername) return { posted: 0, reason: "BOT_USERNAME não configurado" };

  const bot = await prisma.user.findUnique({ where: { username: botUsername } });
  if (!bot) return { posted: 0, reason: "Usuário do bot não encontrado" };

  const sources = [
    { name: "hackernews", fetcher: fetchHackerNews },
    { name: "tmdb", fetcher: fetchTmdbTrending },
  ].sort(() => Math.random() - 0.5);

  let posted = 0;
  const debug = [];

  for (const source of sources) {
    if (posted >= 2) break; // no máximo 2 posts por disparo, pra não lotar o feed

    const { items, status, skipped } = await source.fetcher();
    let postedFromThisSource = false;

    for (const item of items) {
      const already = await prisma.post.findFirst({
        where: { authorId: bot.id, content: { contains: item.link } },
      });
      if (already) continue;

      const title = item.title.length > 200 ? `${item.title.slice(0, 197)}...` : item.title;
      const content = `${title}\n\n${item.link} ${item.hashtag}`.slice(0, 280);

      await prisma.post.create({
        data: {
          content,
          images: item.image ? JSON.stringify([item.image]) : "[]",
          authorId: bot.id,
        },
      });
      posted++;
      postedFromThisSource = true;
      break; // 1 item por fonte nessa rodada
    }

    debug.push({ source: source.name, httpStatus: status, skipped: !!skipped, foundItems: items.length, posted: postedFromThisSource });
  }

  return { posted, debug };
}