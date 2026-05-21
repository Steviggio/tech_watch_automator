import crypto from 'crypto';

/**
 * Génère une empreinte unique (hash) pour un prompt d'intelligence artificielle.
 * Permet de mettre en cache les résumés et de les réutiliser si deux utilisateurs
 * génèrent exactement la même requête (même article, même filtre, même prompt custom).
 * 
 * @param articleId L'identifiant unique de l'article à résumer
 * @param basePrompt Le prompt système de base
 * @param filterModifiers Les modifications apportées par les filtres (ex: "Focus technique")
 * @param customRefinement Texte libre de l'utilisateur
 * @returns Le hash SHA-256 unique
 */
export function generatePromptHash(
  articleId: string,
  basePrompt: string,
  filterModifiers: string[],
  customRefinement?: string
): string {
  // Concaténation de tous les éléments qui influencent le résultat de l'IA
  const payload = JSON.stringify({
    articleId,
    basePrompt,
    filterModifiers: filterModifiers.sort(), // Trier pour éviter des hashs différents si l'ordre change
    customRefinement: customRefinement?.trim().toLowerCase() || ""
  });

  // Génération du hash SHA-256
  return crypto.createHash('sha256').update(payload).digest('hex');
}
