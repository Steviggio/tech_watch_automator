import { generateText } from 'ai';
import { google } from '@ai-sdk/google';
import { generatePromptHash } from '../lib/hash';
// En vrai, il faudrait importer le client Prisma ici pour vérifier le cache
// import prisma from '@/lib/prisma';

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
    /* 
    const cachedSummary = await prisma.aiSummary.findFirst({
      where: { promptHash }
    });

    if (cachedSummary) {
      console.log("🚀 Cache Hit! Retour du résumé existant.");
      return { content: cachedSummary.content, tags: cachedSummary.tags, cached: true };
    }
    */

    // 2. CONSTRUCTION DU PROMPT DYNAMIQUE
    const systemPrompt = this.buildDynamicPrompt(filterModifiers, customRefinement);

    // 3. APPEL À L'API GEMINI 1.5 FLASH VIA VERCEL AI SDK
    console.log("🧠 Génération d'un nouveau résumé via l'IA...");
    const { text } = await generateText({
      model: google('gemini-1.5-flash'),
      system: systemPrompt,
      prompt: `Voici l'article à résumer :\n\n${articleContent}`,
    });

    // En vrai, on sauvegarderait ici le résultat dans la BDD avec son promptHash
    /*
    await prisma.aiSummary.create({
      data: {
        articleId,
        promptHash,
        content: text,
        tags: "[]" // A générer avec un object-generation (ex: generateObject)
      }
    });
    */

    return { content: text, tags: [], cached: false };
  }
}
