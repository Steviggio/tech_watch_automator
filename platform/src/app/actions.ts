"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { z } from "zod";

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
    await prisma.feed.upsert({
      where: { url: urlResult.data },
      update: {},
      create: {
        url: urlResult.data,
        title,
      },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de l'ajout du flux." };
  }
}

export async function deleteFeed(id: string) {
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

export async function updateUserPrompt(userId: string, formData: FormData) {
  if (!userId || typeof userId !== "string") {
    return { error: "ID utilisateur invalide." };
  }

  const rawPrompt = formData.get("prompt")?.toString() ?? "";

  // Validation du prompt
  const promptResult = promptSchema.safeParse(rawPrompt);
  if (!promptResult.success) {
    return {
      error: promptResult.error.issues[0]?.message ?? "Prompt invalide",
    };
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { customPromptRefinement: promptResult.data },
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la mise à jour du prompt." };
  }
}
