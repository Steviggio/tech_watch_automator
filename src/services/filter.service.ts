import type { FeedItem } from "./rss.service.js";
import { type RssSource, SYNC_CONFIG } from "../config/sources.js";

export class FilterService {
  /**
   * Vérifie si un article respecte toutes les conditions de filtrage.
   */
  isValid(item: FeedItem, source: RssSource): boolean {
    const publishDate = new Date(item.isoDate);
    const ageInDays = (Date.now() - publishDate.getTime()) / (1000 * 60 * 60 * 24);

    // 1. Filtrage par date
    if (ageInDays > SYNC_CONFIG.maxAgeDays) {
      return false;
    }

    const contentToSearch = `${item.title} ${item.snippet}`.toLowerCase();

    // 2. Filtrage d'exclusion
    if (source.excludeKeywords && source.excludeKeywords.length > 0) {
      const hasExcluded = source.excludeKeywords.some((kw) =>
        contentToSearch.includes(kw.toLowerCase())
      );
      if (hasExcluded) return false;
    }

    // 3. Filtrage d'inclusion
    if (source.includeKeywords && source.includeKeywords.length > 0) {
      const hasIncluded = source.includeKeywords.some((kw) =>
        contentToSearch.includes(kw.toLowerCase())
      );
      if (!hasIncluded) return false;
    }

    return true;
  }

  /**
   * Extrait les catégories à appliquer à l'article en se basant sur le categoryMapping.
   * La catégorie par défaut de la source est toujours incluse.
   */
  extractCategories(item: FeedItem, source: RssSource): string[] {
    const categories = new Set<string>();
    
    // Ajout de la catégorie par défaut
    categories.add(source.category);

    // Ajout dynamique
    if (source.categoryMapping) {
      const contentToSearch = `${item.title} ${item.snippet}`.toLowerCase();
      
      for (const [keyword, category] of Object.entries(source.categoryMapping)) {
        if (contentToSearch.includes(keyword.toLowerCase())) {
          categories.add(category);
        }
      }
    }

    return Array.from(categories);
  }
}
