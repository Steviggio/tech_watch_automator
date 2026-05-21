
import Parser from 'rss-parser';

export interface FeedItem {
  title: string;
  link: string;
  isoDate: string;
  snippet: string;
  categories?: string[];
}

export class RssService {
  private parser: Parser;

  constructor() {
    this.parser = new Parser();
  }

  async fetchFeed(url: string): Promise<FeedItem[]> {
    try {
      const feed = await this.parser.parseURL(url);
      return feed.items.map(item => ({
        title: item.title ?? 'Sans titre',
        link: item.link ?? '',
        isoDate: item.isoDate ?? new Date().toISOString(),
        snippet: item.contentSnippet?.slice(0, 500) ?? '', 
      }));
    } catch (error) {
      console.error(`Erreur lors de la récupération du flux : ${url}`, error);
      return [];
    }
  }
}