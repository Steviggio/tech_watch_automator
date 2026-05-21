import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import { RssService } from './rss.service';
import { FilterService, FilterConfig } from './filter.service';

const prisma = new PrismaClient();
const rss = new RssService();
const filterService = new FilterService();

// Configuration globale pour le filtrage
const GLOBAL_FILTER_CONFIG: FilterConfig = {
  maxAgeDays: 7, // On ignore les articles plus vieux que 7 jours
  keywords: [], // Mots-clés requis (vide = on prend tout)
  excludeKeywords: ['sponsorisé', 'promotion'], // Mots à exclure
};

async function syncFeeds() {
  console.log(`[${new Date().toISOString()}] Démarrage de la synchronisation RSS...`);
  
  try {
    // Récupérer tous les flux enregistrés en base de données
    const feeds = await prisma.feed.findMany();
    
    if (feeds.length === 0) {
      console.log('Aucun flux RSS à synchroniser.');
      return;
    }

    for (const feed of feeds) {
      console.log(`Traitement de : ${feed.title} (${feed.url})`);
      const items = await rss.fetchFeed(feed.url);

      // Filtrage des articles (par âge, mots-clés)
      const validItems = items.filter(item => filterService.isValid(item, GLOBAL_FILTER_CONFIG));

      let addedCount = 0;
      for (const item of validItems) {
        // L'URL sert d'identifiant unique
        const existingArticle = await prisma.article.findUnique({
          where: { url: item.link }
        });

        if (!existingArticle) {
          await prisma.article.create({
            data: {
              feedId: feed.id,
              title: item.title,
              url: item.link,
              publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
              rawContent: item.content || item.contentSnippet || "",
            }
          });
          addedCount++;
          console.log(`✅ Ajouté : ${item.title}`);
        }
      }
      console.log(`Terminé pour ${feed.title}: ${addedCount} nouveaux articles.`);
    }

    console.log(`[${new Date().toISOString()}] Fin de la synchronisation.`);
  } catch (err) {
    console.error('Erreur lors de la synchronisation RSS:', err);
  }
}

// Planifier l'exécution toutes les heures
console.log('Démarrage du Worker RSS (Cron: "0 * * * *")...');
// Exécution immédiate au lancement
syncFeeds();

cron.schedule('0 * * * *', () => {
  syncFeeds();
});
