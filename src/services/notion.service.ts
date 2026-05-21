import { Client } from "@notionhq/client";
import { NOTION_CONFIG } from "../config/sources.js";
import type { FeedItem } from "./rss.service.js";

export class NotionService {
  private notion: Client;

  constructor() {
    this.notion = new Client({ auth: NOTION_CONFIG.token });
  }

  async itemExists(link: string): Promise<boolean> {
    const response = await this.notion.databases.query({
      database_id: NOTION_CONFIG.databaseId,
      filter: {
        property: "URL",
        url: { equals: link },
      },
    });
    return response.results.length > 0;
  }

  async addToInbox(item: FeedItem): Promise<void> {
    const categories = item.categories || [];
    await this.notion.pages.create({
      parent: { database_id: NOTION_CONFIG.databaseId },
      properties: {
        Nom: { title: [{ text: { content: item.title } }] },
        URL: { url: item.link },
        Catégories: { multi_select: categories.map((c) => ({ name: c })) },
        Date: { date: { start: item.isoDate } },
        Statut: { status: { name: "A lire" } },
      },
    });
  }

  async cleanOldArticles(maxAgeDays: number): Promise<void> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - maxAgeDays);

    let hasMore = true;
    let nextCursor: string | undefined = undefined;

    console.log(
      `🧹 Recherche et archivage des articles antérieurs au ${cutoffDate.toISOString().split("T")[0]}...`,
    );

    let archivedCount = 0;

    while (hasMore) {
      const queryParams: any = {
        database_id: NOTION_CONFIG.databaseId,
        filter: {
          property: "Date",
          date: {
            before: cutoffDate.toISOString(),
          },
        },
      };
      if (nextCursor) {
        queryParams.start_cursor = nextCursor;
      }

      const response = await this.notion.databases.query(queryParams);

      for (const page of response.results) {
        await this.notion.pages.update({
          page_id: page.id,
          properties: {
            Statut: { status: { name: "Archivé" } },
          },
        });
        archivedCount++;
      }

      hasMore = response.has_more;
      nextCursor = response.next_cursor ?? undefined;
    }
    console.log(`✅ Nettoyage terminé. ${archivedCount} articles archivés.`);
  }
}
