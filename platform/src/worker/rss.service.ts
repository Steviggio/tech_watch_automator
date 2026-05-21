import Parser from "rss-parser";

export interface FeedItem {
  title: string;
  link: string;
  pubDate?: string;
  contentSnippet?: string;
  content?: string;
  categories?: string[];
}

export class RssService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser({
      timeout: 10_000, // Timeout de 10 secondes pour éviter les blocages
      customFields: {
        item: [
          ["content:encoded", "contentEncoded"],
          ["category", "categories"],
        ],
      },
    });
  }

  async fetchFeed(url: string): Promise<FeedItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      return feed.items.map((item: any) => ({
        title: item.title || "Sans titre",
        link: item.link || "",
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        content: item.contentEncoded || item.content,
        categories: Array.isArray(item.categories) ? item.categories : [],
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération du flux RSS: ${url}`, error);
      return [];
    }
  }
}
