import { prisma } from "./prisma.js";

// Tradução automática (inglês -> português), pro conteúdo do Hacker News que
// vem em inglês. Serviço gratuito, sem chave — se falhar, mantém o texto original.
async function translateToPortuguese(text) {
  try {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=en|pt-BR`
    );
    if (!res.ok) return text;
    const data = await res.json();
    return data?.responseData?.translatedText || text;
  } catch {
    return text;
  }
}

// Tenta pegar a imagem de capa (og:image) da página de destino de um link.
// Melhor esforço só — se falhar ou demorar demais, o post sai sem imagem mesmo.
async function fetchOgImage(url) {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 4000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BludsSocialBot/1.0)" },
    });
    clearTimeout(timeout);
    if (!res.ok) return null;

    const html = await res.text();
    const match =
      html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i) ||
      html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

// Hacker News: 100% público, sem chave, sem bloqueio de servidor.
async function fetchHackerNews() {
  try {
    const idsRes = await fetch("https://hacker-news.firebaseio.com/v0/topstories.json");
    if (!idsRes.ok) return { items: [], status: idsRes.status };
    const ids = (await idsRes.json()).slice(0, 20);

    const raw = await Promise.all(
      ids.map((id) =>
        fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)
          .then((r) => r.json())
          .catch(() => null)
      )
    );

    const items = raw
      // Só títulos com um mínimo de substância — evita coisa tipo "Elevators" sem contexto
      .filter((p) => p && p.title && p.title.length >= 20 && p.url)
      .map((p) => ({
        title: p.title,
        link: p.url,
        image: null, // buscado sob demanda, só pro item que for de fato postado
        hashtag: "#tech",
        needsOgImage: true,
        needsTranslation: true,
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
          needsOgImage: false,
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
      const translatedTitle = item.needsTranslation ? await translateToPortuguese(title) : title;
      // Formato compacto: título, link e hashtag em linhas seguidas, sem espaço em branco extra
      const content = `${translatedTitle}\n${item.link}\n${item.hashtag}`.slice(0, 280);
      const imageUrl = item.needsOgImage ? await fetchOgImage(item.link) : item.image;

      await prisma.post.create({
        data: {
          content,
          images: imageUrl ? JSON.stringify([imageUrl]) : "[]",
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