"use server";

import prisma from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function addFeed(formData: FormData) {
  const url = formData.get("url")?.toString();
  const title = formData.get("title")?.toString() || "Nouveau Flux";
  
  if (!url) return { error: "L'URL est requise" };

  try {
    await prisma.feed.upsert({
      where: { url },
      update: {},
      create: {
        url,
        title,
      }
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de l'ajout du flux." };
  }
}

export async function deleteFeed(id: string) {
  try {
    await prisma.feed.delete({
      where: { id }
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la suppression." };
  }
}

export async function updateUserPrompt(userId: string, formData: FormData) {
  const customPrompt = formData.get("prompt")?.toString() || "";
  
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { customPromptRefinement: customPrompt }
    });
    revalidatePath("/settings");
    return { success: true };
  } catch (error) {
    return { error: "Erreur lors de la mise à jour du prompt." };
  }
}
