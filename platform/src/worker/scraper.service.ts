import { JSDOM } from 'jsdom';
import { Readability } from '@mozilla/readability';

export interface ScraperResult {
  type: 'rss' | 'article' | 'links';
  url?: string;
  items?: Array<{
    title: string;
    link: string;
    pubDate?: string;
    content?: string;
  }>;
}

export class ScraperService {
  /**
   * Télécharge l'URL et extrait le texte principal de l'article en ignorant les menus/pubs.
   */
  async extractArticleContent(url: string): Promise<string | null> {
    try {
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
      });
      if (!response.ok) return null;
      
      const html = await response.text();
      const doc = new JSDOM(html, { url });
      
      const reader = new Readability(doc.window.document);
      const article = reader.parse();
      
      return article?.textContent ? article.textContent : null;
    } catch (e) {
      console.error(`Erreur d'extraction Readability pour ${url}`, e);
      return null;
    }
  }

  /**
   * Appelé lorsque le flux n'est pas un XML valide.
   * Cherche soit un flux RSS caché, soit un article unique, soit une liste de liens.
   */
  async findRssOrLinks(url: string): Promise<ScraperResult> {
    try {
      const response = await fetch(url, { 
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } 
      });
      if (!response.ok) throw new Error(`Status ${response.status}`);
      
      const html = await response.text();
      const doc = new JSDOM(html, { url });
      const document = doc.window.document;

      // 1. Chercher un flux RSS caché (Auto-discovery)
      const rssLink = document.querySelector('link[type="application/rss+xml"]') || 
                      document.querySelector('link[type="application/atom+xml"]');
      if (rssLink) {
        let href = rssLink.getAttribute('href');
        if (href) {
          href = new URL(href, url).href; // Gérer les URLs relatives
          return { type: 'rss', url: href };
        }
      }

      // 2. Tenter d'extraire comme un article unique (mini-flux)
      // On clone le document car Readability modifie le DOM
      const reader = new Readability(doc.window.document.cloneNode(true) as any);
      const article = reader.parse();
      
      // Si on trouve un article long (ex: > 500 caractères), c'est une page d'article !
      if (article && article.textContent && article.textContent.length > 500) {
        // Tentative d'extraction d'une date depuis les balises meta
        let pubDate = new Date().toISOString();
        const dateMeta = document.querySelector('meta[property="article:published_time"]') ||
                         document.querySelector('meta[name="pubdate"]');
        if (dateMeta) {
          pubDate = dateMeta.getAttribute('content') || pubDate;
        }

        return {
          type: 'article',
          items: [{
            title: article.title || document.title,
            link: url,
            pubDate,
            content: article.textContent
          }]
        };
      }

      // 3. Fallback: Extraction des liens de la page (Scraping classique)
      // Utilisé pour les pages d'accueil de blogs sans flux RSS
      const items: any[] = [];
      const links = document.querySelectorAll('a');
      const seen = new Set<string>();

      links.forEach(a => {
        const href = a.getAttribute('href');
        const title = a.textContent?.trim();
        
        // Heuristique basique : Un lien avec un titre long = souvent un article
        if (href && title && title.length > 20) { 
          try {
            const absoluteUrl = new URL(href, url).href;
            
            // Ignorer les ancres et ne pas s'ajouter soi-même
            if (absoluteUrl !== url && !absoluteUrl.includes('#') && !seen.has(absoluteUrl)) {
              seen.add(absoluteUrl);
              items.push({
                title,
                link: absoluteUrl,
                pubDate: new Date().toISOString(),
                content: "" // Sera enrichi plus tard via extractArticleContent
              });
            }
          } catch(e) {}
        }
      });

      return { type: 'links', items };
    } catch (error) {
      console.error(`Erreur d'analyse HTML pour ${url}`, error);
      return { type: 'links', items: [] };
    }
  }
}
