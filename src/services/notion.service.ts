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

  async addToInbox(item: FeedItem, category: string): Promise<void> {
    await this.notion.pages.create({
      parent: { database_id: NOTION_CONFIG.databaseId },
      properties: {
        Name: { title: [{ text: { content: item.title } }] },
        URL: { url: item.link },
        Category: { select: { name: category } },
        Date: { date: { start: item.isoDate } },
        Status: { status: { name: "À lire" } },
      },
    });
  }
}
