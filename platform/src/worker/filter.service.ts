import { FeedItem } from "./rss.service";

export interface FilterConfig {
  maxAgeDays: number;
  keywords: string[];
  excludeKeywords: string[];
}

export class FilterService {
  isValid(item: FeedItem, config: FilterConfig): boolean {
    // 1. Filtrage par date
    if (item.pubDate) {
      const pubDate = new Date(item.pubDate);
      const now = new Date();
      const diffTime = Math.abs(now.getTime() - pubDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays > config.maxAgeDays) {
        return false;
      }
    }

    const content = `${item.title} ${item.contentSnippet || ""} ${item.content || ""}`.toLowerCase();

    // 2. Exclusion de mots clés
    for (const exclude of config.excludeKeywords) {
      if (content.includes(exclude.toLowerCase())) {
        return false;
      }
    }

    // 3. Inclusion de mots clés (si vide, on accepte tout par défaut, sinon il faut matcher au moins un)
    if (config.keywords.length > 0) {
      let hasKeyword = false;
      for (const keyword of config.keywords) {
        if (content.includes(keyword.toLowerCase())) {
          hasKeyword = true;
          break;
        }
      }
      if (!hasKeyword) return false;
    }

    return true;
  }
}
