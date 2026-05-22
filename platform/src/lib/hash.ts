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
export function generateSettingsHash(
  filterModifiers: string[],
  customRefinement?: string
): string {
  const payload = JSON.stringify({
    filterModifiers: filterModifiers.sort(),
    customRefinement: customRefinement?.trim().toLowerCase() || ""
  });

  // Génération du hash SHA-256
  return crypto.createHash('sha256').update(payload).digest('hex');
}
