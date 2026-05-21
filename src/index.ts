import "dotenv/config";
import { RssService } from "./services/rss.service.js";
import { NotionService } from "./services/notion.service.js";
import { RSS_SOURCES } from "./config/sources.js";

async function bootstrap() {
  const rss = new RssService();
  const notion = new NotionService();

  console.log("--- Démarrage de la synchronisation ---");

  for (const source of RSS_SOURCES) {
    console.log(`Traitement de : ${source.name}`);
    const items = await rss.fetchFeed(source.url);

    for (const item of items) {
      // On évite les doublons en vérifiant l'URL unique
      const exists = await notion.itemExists(item.link);

      if (!exists) {
        await notion.addToInbox(item, source.category);
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
