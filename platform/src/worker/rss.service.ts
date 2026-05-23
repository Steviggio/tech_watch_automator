import Parser from "rss-parser";
import { ScraperService } from "./scraper.service";

const BROWSER_UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

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
  private scraper: ScraperService;

  constructor() {
    this.parser = new Parser({
      customFields: {
        item: [
          ["content:encoded", "contentEncoded"],
          ["category", "categories"],
        ],
      },
    });
    this.scraper = new ScraperService();
  }

  /**
   * Télécharge le contenu d'une URL avec un User-Agent navigateur
   * puis tente de parser le XML via parseString.
   */
  private async fetchAndParseRss(url: string): Promise<FeedItem[]> {
    const response = await fetch(url, {
      headers: { 'User-Agent': BROWSER_UA },
      signal: AbortSignal.timeout(15000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status} for ${url}`);
    
    const xml = await response.text();
    const feed = await this.parser.parseString(xml);
    
    return feed.items.map((item: any) => ({
      title: item.title || "Sans titre",
      link: item.link || "",
      pubDate: item.pubDate || item.isoDate,
      contentSnippet: item.contentSnippet,
      content: item.contentEncoded || item.content,
      categories: Array.isArray(item.categories) ? item.categories : [],
    }));
  }

  /**
   * @param url     L'URL du flux ou de la page à analyser
   * @param depth   Garde anti-boucle : on ne suit qu'un seul niveau de redirection RSS
   */
  async fetchFeed(url: string, depth = 0): Promise<FeedItem[]> {
    let items: FeedItem[] = [];

    try {
      // 1. Télécharger le XML nous-mêmes et parser localement
      items = await this.fetchAndParseRss(url);
    } catch (error) {
      // Garde anti-boucle : on ne tente le scraping qu'au premier niveau
      if (depth > 0) {
        console.error(`[RssService] Échec du parsing RSS après redirection, abandon: ${url}`, (error as Error).message);
        return [];
      }

      console.log(`[RssService] L'URL n'est pas un flux RSS valide, tentative de scraping HTML: ${url}`);
      const scraperResult = await this.scraper.findRssOrLinks(url);
      
      if (scraperResult.type === 'rss' && scraperResult.url) {
        console.log(`[RssService] Flux RSS alternatif trouvé: ${scraperResult.url}`);
        return this.fetchFeed(scraperResult.url, depth + 1);
      } else if (scraperResult.items) {
        items = scraperResult.items;
      }
    }

    // 3. Pour tous les items, extraire le vrai contenu complet via Readability
    console.log(`[RssService] Extraction du contenu complet pour ${items.length} article(s)...`);
    const topItems = items.slice(0, 15);
    
    for (const item of topItems) {
      if (item.link) {
        try {
          const fullContent = await this.scraper.extractArticleContent(item.link);
          if (fullContent && fullContent.trim().length > 0) {
            item.content = fullContent;
          }
        } catch (e) {
          console.error(`Erreur d'extraction de contenu pour ${item.link}`);
        }
      }
    }

    return topItems;
  }
}

