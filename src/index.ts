import "dotenv/config";
import { RssService } from "./services/rss.service.js";
import { NotionService } from "./services/notion.service.js";
import { FilterService } from "./services/filter.service.js";
import { RSS_SOURCES, SYNC_CONFIG } from "./config/sources.js";

async function bootstrap() {
  const rss = new RssService();
  const notion = new NotionService();
  const filterService = new FilterService();

  console.log("--- Démarrage de la synchronisation ---");

  // 1. Nettoyage des anciens articles
  await notion.cleanOldArticles(SYNC_CONFIG.maxAgeDays);

  // 2. Récupération et ajout des nouveaux articles
  for (const source of RSS_SOURCES) {
    console.log(`Traitement de : ${source.name}`);
    const items = await rss.fetchFeed(source.url);

    // Filtrage des articles (par âge, mots-clés, etc.)
    const validItems = items.filter(item => filterService.isValid(item, source));

    for (const item of validItems) {
      // Déduction dynamique des catégories
      item.categories = filterService.extractCategories(item, source);

      // On évite les doublons en vérifiant l'URL unique
      const exists = await notion.itemExists(item.link);

      if (!exists) {
        await notion.addToInbox(item);
        console.log(`✅ Ajouté : ${item.title}`);
      }
    }
  }

  console.log("--- Fin de la synchronisation ---");
}

bootstrap().catch((err) => {
  console.error("Erreur critique dans le bootstrap:", err);
  process.exit(1);
});
