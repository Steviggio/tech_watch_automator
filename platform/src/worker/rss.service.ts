import Parser from "rss-parser";
import { ScraperService } from "./scraper.service";

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
      timeout: 10_000, // Timeout de 10 secondes pour éviter les blocages
      customFields: {
        item: [
          ["content:encoded", "contentEncoded"],
          ["category", "categories"],
        ],
      },
    });
    this.scraper = new ScraperService();
  }

  async fetchFeed(url: string): Promise<FeedItem[]> {
    let items: FeedItem[] = [];

    try {
      // 1. Tenter de parser comme un flux RSS standard
      const feed = await this.parser.parseURL(url);
      items = feed.items.map((item: any) => ({
        title: item.title || "Sans titre",
        link: item.link || "",
        pubDate: item.pubDate,
        contentSnippet: item.contentSnippet,
        content: item.contentEncoded || item.content,
        categories: Array.isArray(item.categories) ? item.categories : [],
      }));
    } catch (error) {
      console.log(`[RssService] L'URL n'est pas un flux RSS valide, tentative de scraping HTML: ${url}`);
      // 2. Si ça échoue, on essaye le scraping HTML
      const scraperResult = await this.scraper.findRssOrLinks(url);
      
      if (scraperResult.type === 'rss' && scraperResult.url) {
        console.log(`[RssService] Flux RSS alternatif trouvé: ${scraperResult.url}`);
        return this.fetchFeed(scraperResult.url); // Récursion sur la vraie URL RSS
      } else if (scraperResult.items) {
        items = scraperResult.items;
      }
    }

    // 3. Pour tous les items (qu'ils viennent du RSS ou du scraping), 
    // on extrait le vrai contenu complet de la page web via Readability
    console.log(`[RssService] Extraction du contenu complet pour ${items.length} article(s)...`);
    // On limite aux 15 premiers pour ne pas saturer si la page a 100 liens
    const topItems = items.slice(0, 15);
    
    for (const item of topItems) {
      if (item.link) {
        try {
          const fullContent = await this.scraper.extractArticleContent(item.link);
          if (fullContent && fullContent.trim().length > 0) {
            item.content = fullContent; // On remplace le snippet RSS par le texte intégral !
          }
        } catch (e) {
          console.error(`Erreur d'extraction de contenu pour ${item.link}`);
        }
      }
    }

    return topItems;
  }
}
