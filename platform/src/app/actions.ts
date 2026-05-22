"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { generateSettingsHash } from "@/lib/hash";
import { AiService } from "@/services/ai.service";
import { RssService } from "@/worker/rss.service";
import { FilterService } from "@/worker/filter.service";

// ─── Schémas de validation Zod ───────────────────────────────────────────────

const feedUrlSchema = z
  .string()
  .min(1, "L'URL est requise")
  .url("L'URL n'est pas valide")
  .refine(
    (url) => {
      try {
        const parsed = new URL(url);
        // N'accepter que http:// ou https://
        if (!["http:", "https:"].includes(parsed.protocol)) {
          return false;
        }
        // Protection SSRF : bloquer les adresses privées et localhost
        const hostname = parsed.hostname.toLowerCase();
        const privatePatterns = [
          /^localhost$/,
          /^127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
          /^10\.\d{1,3}\.\d{1,3}\.\d{1,3}$/,
          /^172\.(1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}$/,
          /^192\.168\.\d{1,3}\.\d{1,3}$/,
          /^0\.0\.0\.0$/,
          /^\[?::1\]?$/,
          /^\[?fe80:/i,
          /^\[?fd[0-9a-f]{2}:/i,
          /^169\.254\.\d{1,3}\.\d{1,3}$/,
        ];
        return !privatePatterns.some((pattern) => pattern.test(hostname));
      } catch {
        return false;
      }
    },
    { message: "URL non autorisée (adresse privée ou protocole invalide)" }
  );

const feedTitleSchema = z.string().max(200).default("Nouveau Flux");

const promptSchema = z
  .string()
  .max(2000, "Le prompt ne doit pas dépasser 2000 caractères")
  .default("");

// ─── Server Actions ──────────────────────────────────────────────────────────

export async function addFeed(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  const rawUrl = formData.get("url")?.toString() ?? "";
  const rawTitle = formData.get("title")?.toString() ?? "";

  // Validation de l'URL
  const urlResult = feedUrlSchema.safeParse(rawUrl);
  if (!urlResult.success) {
    return { error: urlResult.error.issues[0]?.message ?? "URL invalide" };
  }

  // Validation du titre
  const titleResult = feedTitleSchema.safeParse(rawTitle || undefined);
  const title = titleResult.success ? titleResult.data : "Nouveau Flux";

  try {
    const feed = await prisma.feed.upsert({
      where: { url: urlResult.data },
      update: {},
      create: {
        url: urlResult.data,
        title,
      },
    });

    // S'abonner automatiquement au flux ajouté
    await prisma.subscription.upsert({
      where: {
        userId_feedId: {
          userId: user.id,
          feedId: feed.id,
        },
      },
      update: {},
      create: {
        userId: user.id,
        feedId: feed.id,
      },
    });

    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de l'ajout du flux." };
  }
}

export async function deleteFeed(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  if (!id || typeof id !== "string") {
    return { error: "ID invalide." };
  }

  try {
    await prisma.feed.delete({
      where: { id },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la suppression." };
  }
}

export async function updateUserPrompt(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  const rawPrompt = formData.get("prompt")?.toString() ?? "";
  const preferences = formData.getAll("preferences") as string[];

  // Validation du prompt
  const promptResult = promptSchema.safeParse(rawPrompt);
  if (!promptResult.success) {
    return {
      error: promptResult.error.issues[0]?.message ?? "Prompt invalide",
    };
  }

  const settingsHash = generateSettingsHash(preferences, promptResult.data);

  try {
    await prisma.user.upsert({
      where: { id: user.id },
      update: { 
        customPromptRefinement: promptResult.data,
        aiPreferences: preferences,
        settingsHash
      },
      create: { 
        id: user.id, 
        email: user.email || "", 
        customPromptRefinement: promptResult.data,
        aiPreferences: preferences,
        settingsHash
      }
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la mise à jour du prompt." };
  }
}

export async function forceRefreshSummaries() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Utilisateur non authentifié." };
  }

  const dbUser = await prisma.user.findUnique({
    where: { id: user.id },
    include: { subscriptions: { include: { feed: true } } }
  });

  if (!dbUser) return { error: "Utilisateur non trouvé." };

  const now = new Date();
  
  // Limite de 6h désactivée temporairement pour les tests
  /*
  if (dbUser.lastForcedRefresh) {
    const hoursSinceLastRefresh = (now.getTime() - dbUser.lastForcedRefresh.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRefresh < 6) {
      return { error: `Veuillez patienter encore ${Math.ceil(6 - hoursSinceLastRefresh)} heure(s) avant de forcer un nouveau rafraîchissement.` };
    }
  }
  */

  // Mettre à jour le timestamp immédiatement pour éviter les abus
  await prisma.user.update({
    where: { id: user.id },
    data: { lastForcedRefresh: now }
  });

  // Déclencher une génération asynchrone en arrière-plan sans bloquer la réponse
  (async () => {
    try {
      const rssService = new RssService();
      const filterService = new FilterService();
      const aiService = new AiService();

      const filterConfig = { maxAgeDays: 365, keywords: [], excludeKeywords: ['sponsorisé', 'promotion'] };

      // 1. Fetch & Insert new articles for all user's subscriptions
      for (const sub of dbUser.subscriptions) {
        if (sub.feed?.url) {
          try {
            const items = await rssService.fetchFeed(sub.feed.url);
            const validItems = items.filter(item => filterService.isValid(item, filterConfig));
            
            if (validItems.length > 0) {
              const articlesData = validItems
                .filter(item => item.link)
                .map(item => ({
                  feedId: sub.feed.id,
                  title: item.title,
                  url: item.link,
                  publishDate: item.pubDate ? new Date(item.pubDate) : new Date(),
                  rawContent: item.content || item.contentSnippet || '',
                }));

              await prisma.article.createMany({
                data: articlesData,
                skipDuplicates: true,
              });
              console.log(`[Background] Articles insérés pour ${sub.feed.url}`);
            }
          } catch (e) {
            console.error(`[Background] Erreur fetch feed ${sub.feed.url}:`, e);
          }
        }
      }

      // 2. Fetch recent articles from DB and summarize
      const recentArticles = await prisma.article.findMany({
        where: { feedId: { in: dbUser.subscriptions.map(s => s.feedId) } },
        take: 20,
        orderBy: { publishDate: 'desc' },
        include: { summaries: true }
      });

      const prefs = dbUser.aiPreferences || [];
      const custom = dbUser.customPromptRefinement || '';
      const hash = dbUser.settingsHash || generateSettingsHash(prefs, custom);

      for (const article of recentArticles) {
        const hasSummary = article.summaries.some(s => s.settingsHash === hash);
        if (!hasSummary) {
          try {
            await aiService.summarizeArticle(article.id, article.rawContent, prefs, custom);
            console.log(`[Background] Résumé forcé généré pour : ${article.title}`);
          } catch (e) {
            console.error(`[Background] Erreur pour l'article ${article.title}:`, e);
          }
        }
      }
    } catch (err) {
      console.error("[Background] Erreur globale lors du rafraîchissement forcé:", err);
    }
  })();

  revalidatePath("/");
  return { success: true, message: "La génération de vos nouveaux résumés a commencé en arrière-plan ! Actualisez la page d'accueil d'ici quelques minutes." };
}
