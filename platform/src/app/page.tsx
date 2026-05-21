import DashboardClient from "@/components/DashboardClient";
import prisma from "@/lib/prisma";

export const revalidate = 60;

// Server Component pour la récupération des données
export default async function Page() {
  // Récupérer les articles avec leur feed et leurs résumés IA
  const articlesData = await prisma.article.findMany({
    orderBy: { publishDate: 'desc' },
    include: {
      feed: true,
      summaries: true, // On prend les résumés générés
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

  return <DashboardClient initialArticles={articlesForFront} />;
}
