import DashboardClient from "@/components/DashboardClient";
import prisma from "@/lib/prisma";
import { generateSettingsHash } from "@/lib/hash";

import { createClient } from "@/lib/supabase/server";

export const revalidate = 60;

// Server Component pour la récupération des données
export default async function Page() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let dbUser = null;
  let settingsHash = "";
  
  if (user) {
    dbUser = await prisma.user.findUnique({ where: { id: user.id } });
    if (dbUser) {
      const prefs = dbUser.aiPreferences || [];
      const custom = dbUser.customPromptRefinement || "";
      settingsHash = dbUser.settingsHash || generateSettingsHash(prefs, custom);
    }
  }

  // Récupérer les articles avec leur feed et leurs résumés IA correspondants
  const articlesData = await prisma.article.findMany({
    orderBy: { publishDate: 'desc' },
    include: {
      feed: true,
      summaries: {
        where: settingsHash ? { settingsHash } : undefined
      },
    },
    take: 10
  });

  // Mapper les données Prisma vers notre type Front-end
  const articlesForFront = articlesData.map(article => {

    // Si l'IA n'a pas encore résumé, on affiche un texte par défaut
    const summary = article.summaries.length > 0 
      ? article.summaries[0] 
      : { content: "Résumé en cours de génération...", tags: "[]" };
      
    let tags = [];
    try {
      tags = JSON.parse(summary.tags);
    } catch {
      tags = [];
    }

    return {
      id: article.id,
      title: article.title,
      source: article.feed.title,
      publishDate: article.publishDate.toISOString(),
      aiSummary: summary.content,
      tags: tags,
      url: article.url
    };
  });

  return <DashboardClient initialArticles={articlesForFront} user={user} />;
}
