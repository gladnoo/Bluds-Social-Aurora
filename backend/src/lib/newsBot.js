import { prisma } from "./prisma.js";

// Fontes públicas (API JSON do Reddit, sem precisar de chave nenhuma).
// Pode adicionar/trocar subreddits livremente aqui.
const SOURCES = [
  { subreddit: "worldnews", hashtag: "#noticias" },
  { subreddit: "popculturechat", hashtag: "#popcultura" },
  { subreddit: "technology", hashtag: "#tech" },
  { subreddit: "todayilearned", hashtag: "#curiosidades" },
];

async function fetchTopPosts(subreddit) {
  const res = await fetch(`https://www.reddit.com/r/${subreddit}/top.json?limit=8&t=day`, {
    headers: { "User-Agent": "BludsSocialBot/1.0 (noticias automaticas)" },
  });
  if (!res.ok) {
    console.error(`[newsBot] Falha ao buscar r/${subreddit}: HTTP ${res.status}`);
    return { posts: [], status: res.status };
  }
  const data = await res.json();
  return { posts: (data?.data?.children || []).map((c) => c.data), status: 200 };
}

function extractImage(post) {
  try {
    const src = post.preview?.images?.[0]?.source?.url;
    if (src) return src.replace(/&amp;/g, "&");
  } catch {
    // sem preview disponível, tenta o thumbnail abaixo
  }
  if (post.thumbnail && post.thumbnail.startsWith("http")) return post.thumbnail;
  return null;
}

// Busca notícias novas e posta na conta do bot. Evita repetir a mesma notícia
// checando se o link já apareceu num post anterior do bot.
export async function runNewsBot() {
  const botUsername = process.env.BOT_USERNAME;
  if (!botUsername) return { posted: 0, reason: "BOT_USERNAME não configurado" };

  const bot = await prisma.user.findUnique({ where: { username: botUsername } });
  if (!bot) return { posted: 0, reason: "Usuário do bot não encontrado" };

  let posted = 0;
  const debug = [];
  const shuffledSources = [...SOURCES].sort(() => Math.random() - 0.5);

  for (const source of shuffledSources) {
    if (posted >= 2) break; // no máximo 2 posts por disparo, pra não lotar o feed

    const { posts, status } = await fetchTopPosts(source.subreddit);
    let postedFromThisSource = false;

    for (const p of posts) {
      if (p.stickied || p.over_18) continue;

      const link = p.url_overridden_by_dest || `https://reddit.com${p.permalink}`;
      const already = await prisma.post.findFirst({
        where: { authorId: bot.id, content: { contains: link } },
      });
      if (already) continue;

      const title = p.title.length > 200 ? `${p.title.slice(0, 197)}...` : p.title;
      const content = `${title}\n\n${link} ${source.hashtag}`.slice(0, 280);
      const imageUrl = extractImage(p);

      await prisma.post.create({
        data: {
          content,
          images: imageUrl ? JSON.stringify([imageUrl]) : "[]",
          authorId: bot.id,
        },
      });
      posted++;
      postedFromThisSource = true;
      break; // 1 notícia por fonte nessa rodada
    }

    debug.push({ subreddit: source.subreddit, httpStatus: status, foundPosts: posts.length, posted: postedFromThisSource });
  }

  return { posted, debug };
}