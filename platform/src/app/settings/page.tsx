import prisma from "@/lib/prisma";
import { addFeed, deleteFeed, updateUserPrompt } from "../actions";
import { Sparkles, Trash2, Plus, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ForceRefreshButton } from "@/components/ForceRefreshButton";

const AI_PREFERENCES = [
  { id: "bullet_points", label: "Résumé en liste à puces" },
  { id: "no_jargon", label: "Vulgarisé (sans jargon technique)" },
  { id: "technical", label: "Très technique et précis" }
];

export const revalidate = 60;

export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  let user = null;
  if (authUser) {
    user = await prisma.user.findUnique({ where: { id: authUser.id } });
  }
  const feeds = await prisma.feed.findMany();

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Header Minimaliste */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-zinc-400 hover:text-zinc-900 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold tracking-tight text-lg">Paramètres</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Section: Comportement IA */}
        <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-zinc-900 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight">Comportement de l'IA</h2>
              <p className="text-sm text-zinc-500">Personnalisez la façon dont vos résumés sont générés.</p>
            </div>
          </div>

          <form action={async (formData) => {
            "use server";
            await updateUserPrompt(formData);
          }} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-3">Préférences rapides</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {AI_PREFERENCES.map(pref => (
                  <label key={pref.id} className="flex items-center gap-2 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-full cursor-pointer hover:bg-zinc-100 transition-colors has-[:checked]:bg-zinc-900 has-[:checked]:text-white has-[:checked]:border-zinc-900">
                    <input 
                      type="checkbox" 
                      name="preferences" 
                      value={pref.id} 
                      defaultChecked={user?.aiPreferences?.includes(pref.id)} 
                      className="hidden" 
                    />
                    <span className="text-sm font-medium">{pref.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label htmlFor="custom-prompt" className="block text-sm font-medium text-zinc-700 mb-2">Instructions sur-mesure (Optionnel)</label>
              <textarea 
                id="custom-prompt"
                name="prompt"
                defaultValue={user?.customPromptRefinement || ""}
                placeholder="Ex: Sois sarcastique, concentre-toi uniquement sur les frameworks JS..."
                className="w-full h-32 p-4 bg-zinc-50 border border-zinc-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow resize-none"
              />
            </div>
            
            <button type="submit" className="px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
              Sauvegarder les préférences
            </button>
          </form>

          <ForceRefreshButton lastRefresh={user?.lastForcedRefresh || null} />
        </section>

        {/* Section: Flux RSS */}
        <section className="bg-white p-8 rounded-2xl border border-zinc-200 shadow-sm">
          <h2 className="text-xl font-bold tracking-tight mb-2">Sources d'Information (RSS)</h2>
          <p className="text-sm text-zinc-500 mb-6">Gérez les blogs et sites que l'IA doit surveiller pour vous.</p>

          <form action={async (formData) => {
            "use server";
            await addFeed(formData);
          }} className="flex gap-3 mb-8">
            <input 
              id="feed-url"
              type="url" 
              name="url" 
              required
              aria-label="URL du flux RSS"
              placeholder="https://example.com/feed.xml" 
              className="flex-1 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow"
            />
            <input 
              id="feed-title"
              type="text" 
              name="title" 
              aria-label="Nom du blog"
              placeholder="Nom du blog (Optionnel)" 
              className="w-48 px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow hidden sm:block"
            />
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-zinc-900 text-white rounded-lg text-sm font-medium hover:bg-zinc-800 transition-colors">
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </form>

          <div className="space-y-3">
            {feeds.length === 0 ? (
              <p className="text-sm text-zinc-500 text-center py-6">Aucun flux RSS configuré.</p>
            ) : (
              feeds.map(feed => (
                <div key={feed.id} className="flex items-center justify-between p-4 rounded-xl border border-zinc-100 bg-zinc-50/50 hover:bg-zinc-50 transition-colors">
                  <div>
                    <h3 className="font-medium text-zinc-900">{feed.title}</h3>
                    <a href={feed.url} target="_blank" rel="noreferrer" className="text-xs text-zinc-500 hover:underline">
                      {feed.url}
                    </a>
                  </div>
                  <form action={async () => {
                    "use server";
                    await deleteFeed(feed.id);
                  }}>
                    <button type="submit" className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
