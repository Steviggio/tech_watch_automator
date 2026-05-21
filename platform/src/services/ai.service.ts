import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { generatePromptHash } from '../lib/hash';
import prisma from '../lib/prisma';

export class AiService {
  private basePrompt = `
    Tu es un assistant expert en veille technologique pour des développeurs.
    Ta mission est de lire l'article fourni et d'en extraire l'essence.
    Sois concis, précis, et va droit au but.
  `;

  /**
   * Construit le prompt dynamique en fonction des filtres de l'utilisateur
   */
  private buildDynamicPrompt(filterModifiers: string[], customRefinement?: string): string {
    let finalPrompt = this.basePrompt;

    if (filterModifiers.length > 0) {
      finalPrompt += `\n\nCONTRAINTES SPÉCIFIQUES :\n${filterModifiers.join('\n')}`;
    }

    if (customRefinement) {
      finalPrompt += `\n\nINSTRUCTION DE L'UTILISATEUR :\n${customRefinement}`;
    }

    return finalPrompt;
  }

  /**
   * Extrait des tags simples à partir du texte résumé.
   * Retourne un tableau JSON sérialisé de mots-clés.
   */
  private extractTags(text: string): string {
    // Extraire les mots significatifs (> 4 chars), dédupliquer, garder les 5 premiers
    const stopWords = new Set([
      'cette', 'entre', 'leurs', 'comme', 'après', 'avant', 'aussi',
      'autre', 'autres', 'avoir', 'dans', 'depuis', 'être', 'encore',
      'faire', 'leurs', 'même', 'notre', 'nous', 'plus', 'pour',
      'quel', 'sans', 'sont', 'sous', 'tout', 'tous', 'très',
      'votre', 'vous', 'avec', 'which', 'their', 'about', 'would',
      'there', 'these', 'could', 'other', 'where', 'those', 'should',
    ]);

    const words = text
      .toLowerCase()
      .replace(/[^a-zà-ÿ0-9\s-]/gi, ' ')
      .split(/\s+/)
      .filter(w => w.length > 4 && !stopWords.has(w));

    // Compter les occurrences
    const freq = new Map<string, number>();
    for (const w of words) {
      freq.set(w, (freq.get(w) || 0) + 1);
    }

    // Trier par fréquence et prendre les 5 premiers
    const tags = [...freq.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);

    return JSON.stringify(tags);
  }

  /**
   * Fonction principale pour résumer un article avec gestion du cache
   */
  async summarizeArticle(
    articleId: string, 
    articleContent: string, 
    filterModifiers: string[], 
    customRefinement?: string
  ) {
    const promptHash = generatePromptHash(articleId, this.basePrompt, filterModifiers, customRefinement);

    // 1. VÉRIFICATION DU CACHE EN BASE DE DONNÉES
    const cachedSummary = await prisma.aiSummary.findFirst({
      where: { promptHash }
    });

    if (cachedSummary) {
      console.log("🚀 Cache Hit! Retour du résumé existant.");
      return { content: cachedSummary.content, tags: cachedSummary.tags, cached: true };
    }

    // 2. CONSTRUCTION DU PROMPT DYNAMIQUE
    const systemPrompt = this.buildDynamicPrompt(filterModifiers, customRefinement);

    // 3. APPEL À L'API GEMINI 1.5 FLASH VIA VERCEL AI SDK
    console.log("🧠 Génération d'un nouveau résumé via l'IA...");
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: `Voici l'article à résumer :\n\n${articleContent}`,
    });

    // 4. EXTRACTION DES TAGS ET SAUVEGARDE EN CACHE
    const tags = this.extractTags(text);

    await prisma.aiSummary.create({
      data: {
        articleId,
        promptHash,
        content: text,
        tags,
      }
    });

    return { content: text, tags, cached: false };
  }
}
