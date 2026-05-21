import cron from 'node-cron';
import prisma from '../lib/prisma';
import { RssService } from './rss.service';
import { FilterService, FilterConfig } from './filter.service';
import { AiService } from '../services/ai.service';

const rss = new RssService();
const filterService = new FilterService();
const aiService = new AiService();

// Verrou anti-chevauchement
let isSyncing = false;

// Configuration globale pour le filtrage
const GLOBAL_FILTER_CONFIG: FilterConfig = {
  maxAgeDays: 7,
  keywords: [],
  excludeKeywords: ['sponsorisé', 'promotion'],
};

// Nombre de flux traités en parallèle par batch
const BATCH_SIZE = 5;

/**
 * Traite un flux RSS individuel : fetch, filtre, insert bulk, puis résumé IA.
 */
async function processFeed(feed: { id: string; title: string; url: string }) {
  console.log(`Traitement de : ${feed.title} (${feed.url})`);

  const items = await rss.fetchFeed(feed.url);

  // Filtrage des articles (par âge, mots-clés)
  const validItems = items.filter(item =>
    filterService.isValid(item, GLOBAL_FILTER_CONFIG)
  );

  if (validItems.length === 0) {
    console.log(`Aucun article valide pour ${feed.title}.`);
    return;
  }

  // Préparer les données pour un insert bulk
  const articlesData = validItems
    .filter(item => item.link) // S'assurer que le lien existe
    .map(item => ({
      feedId: feed.id,
      title: item.title,
      url: item.link,
      publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
      rawContent: item.content || item.contentSnippet || '',
    }));

  // Insertion en masse avec skipDuplicates (évite les requêtes N+1)
  const result = await prisma.article.createMany({
    data: articlesData,
    skipDuplicates: true,
  });

  console.log(`✅ ${feed.title}: ${result.count} nouveaux articles insérés.`);

  // Résumé IA pour les articles sans résumé existant
  if (result.count > 0) {
    const newArticles = await prisma.article.findMany({
      where: {
        feedId: feed.id,
        summaries: { none: {} },
      },
      take: result.count,
      orderBy: { publishDate: 'desc' },
    });

    for (const article of newArticles) {
      try {
        await aiService.summarizeArticle(
          article.id,
          article.rawContent,
          [], // Pas de filtres spécifiques pour le worker
        );
        console.log(`🧠 Résumé IA généré pour : ${article.title}`);
      } catch (aiError) {
        // Ne pas crasher le worker si l'IA échoue
        console.error(
          `⚠️ Erreur IA pour l'article "${article.title}":`,
          aiError
        );
      }
    }
  }
}

/**
 * Synchronise tous les flux RSS en parallèle par batches.
 */
async function syncFeeds() {
  if (isSyncing) {
    console.log(
      `[${new Date().toISOString()}] ⏳ Synchronisation déjà en cours, on saute ce cycle.`
    );
    return;
  }

  isSyncing = true;

  console.log(
    `[${new Date().toISOString()}] Démarrage de la synchronisation RSS...`
  );

  try {
    const feeds = await prisma.feed.findMany();

    if (feeds.length === 0) {
      console.log('Aucun flux RSS à synchroniser.');
      return;
    }

    // Traitement par batches de BATCH_SIZE flux en parallèle
    for (let i = 0; i < feeds.length; i += BATCH_SIZE) {
      const batch = feeds.slice(i, i + BATCH_SIZE);

      const results = await Promise.allSettled(
        batch.map(feed =>
          processFeed(feed).catch(err => {
            // Tolérance aux pannes : un flux en erreur ne bloque pas les autres
            console.error(
              `❌ Erreur sur le flux "${feed.title}" (${feed.url}):`,
              err
            );
          })
        )
      );

      // Log des éventuelles erreurs non-catchées
      for (const result of results) {
        if (result.status === 'rejected') {
          console.error('❌ Erreur inattendue dans un batch:', result.reason);
        }
      }
    }

    console.log(
      `[${new Date().toISOString()}] Fin de la synchronisation.`
    );
  } catch (err) {
    console.error('Erreur critique lors de la synchronisation RSS:', err);
  } finally {
    isSyncing = false;
  }
}

// Planifier l'exécution toutes les heures
console.log('Démarrage du Worker RSS (Cron: "0 * * * *")...');

// Exécution immédiate au lancement
syncFeeds();

cron.schedule('0 * * * *', () => {
  syncFeeds();
});
