import prisma from "@/lib/prisma";
import { addFeed, deleteFeed, updateUserPrompt } from "../actions";
import { Sparkles, Trash2, Plus, ArrowLeft, Rss } from "lucide-react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ForceRefreshButton } from "@/components/ForceRefreshButton";

const AI_PREFERENCES = [
  { id: "bullet_points", label: "Résumé en liste à puces" },
  { id: "no_jargon", label: "Vulgarisé (sans jargon technique)" },
  { id: "technical", label: "Très technique et précis" }
];



export default async function SettingsPage() {
  const supabase = await createClient();
  const { data: { user: authUser } } = await supabase.auth.getUser();
  
  let user = null;
  if (authUser) {
    user = await prisma.user.findUnique({ where: { id: authUser.id } });
  }
  const feeds = await prisma.feed.findMany();

  return (
    <div className="min-h-screen bg-gradient-to-b from-earth-50 via-white to-forest-50/30 text-earth-900 font-sans selection:bg-forest-200/50">
      {/* Header */}
      <header
        className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-earth-200/60"
        style={{
          boxShadow: '0 1px 8px oklch(0.52 0.07 60 / 0.06)',
        }}
      >
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="text-earth-400 hover:text-forest-700 transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="font-semibold tracking-tight text-lg text-earth-900">Paramètres</h1>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-12 space-y-12">
        {/* Section: Comportement IA */}
        <section
          className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-earth-200/60 overflow-hidden"
          style={{
            boxShadow: '0 2px 16px oklch(0.52 0.07 60 / 0.06), 0 1px 4px oklch(0.52 0.07 60 / 0.04)',
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-400 via-forest-600 to-earth-400" />

          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 bg-gradient-to-br from-forest-700 to-forest-900 rounded-xl flex items-center justify-center shadow-md shadow-forest-900/20">
              <Sparkles className="w-5 h-5 text-forest-100" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-earth-900">Comportement de l'IA</h2>
              <p className="text-sm text-earth-500">Personnalisez la façon dont vos résumés sont générés.</p>
            </div>
          </div>

          <form action={async (formData) => {
            "use server";
            await updateUserPrompt(formData);
          }} className="space-y-6">
            
            <div>
              <label className="block text-sm font-medium text-earth-700 mb-3">Préférences rapides</label>
              <div className="flex flex-wrap gap-2 mb-4">
                {AI_PREFERENCES.map(pref => (
                  <label key={pref.id} className="flex items-center gap-2 px-4 py-2 bg-earth-50 border border-earth-200/60 rounded-full cursor-pointer hover:bg-forest-50 hover:border-forest-200 transition-colors has-[:checked]:bg-gradient-to-r has-[:checked]:from-forest-700 has-[:checked]:to-forest-800 has-[:checked]:text-white has-[:checked]:border-forest-700 has-[:checked]:shadow-md has-[:checked]:shadow-forest-900/15">
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
              <label htmlFor="custom-prompt" className="block text-sm font-medium text-earth-700 mb-2">Instructions sur-mesure (Optionnel)</label>
              <textarea 
                id="custom-prompt"
                name="prompt"
                defaultValue={user?.customPromptRefinement || ""}
                placeholder="Ex: Sois sarcastique, concentre-toi uniquement sur les frameworks JS..."
                className="w-full h-32 p-4 bg-earth-50/60 border border-earth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-400 transition-all resize-none placeholder:text-earth-400"
              />
            </div>
            
            <button type="submit" className="px-6 py-2.5 bg-gradient-to-r from-forest-700 to-forest-800 text-white rounded-xl text-sm font-medium hover:from-forest-800 hover:to-forest-900 transition-all shadow-md shadow-forest-900/15">
              Sauvegarder les préférences
            </button>
          </form>

          <ForceRefreshButton lastRefresh={user?.lastForcedRefresh || null} />
        </section>

        {/* Section: Flux RSS */}
        <section
          className="relative bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-earth-200/60 overflow-hidden"
          style={{
            boxShadow: '0 2px 16px oklch(0.52 0.07 60 / 0.06), 0 1px 4px oklch(0.52 0.07 60 / 0.04)',
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-earth-300 via-earth-400 to-forest-400" />

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-earth-600 to-earth-800 rounded-xl flex items-center justify-center shadow-md shadow-earth-900/20">
              <Rss className="w-5 h-5 text-earth-100" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-earth-900">Sources d'Information (RSS)</h2>
          </div>
          <p className="text-sm text-earth-500 mb-6 ml-13">Gérez les blogs et sites que l'IA doit surveiller pour vous.</p>

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
              className="flex-1 px-4 py-2.5 bg-earth-50/60 border border-earth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-400 transition-all placeholder:text-earth-400"
            />
            <input 
              id="feed-title"
              type="text" 
              name="title" 
              aria-label="Nom du blog"
              placeholder="Nom du blog (Optionnel)" 
              className="w-48 px-4 py-2.5 bg-earth-50/60 border border-earth-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-400 transition-all hidden sm:block placeholder:text-earth-400"
            />
            <button type="submit" className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-forest-700 to-forest-800 text-white rounded-xl text-sm font-medium hover:from-forest-800 hover:to-forest-900 transition-all shadow-md shadow-forest-900/15">
              <Plus className="w-4 h-4" />
              Ajouter
            </button>
          </form>

          <div className="space-y-3">
            {feeds.length === 0 ? (
              <p className="text-sm text-earth-500 text-center py-6">Aucun flux RSS configuré.</p>
            ) : (
              feeds.map(feed => (
                <div key={feed.id} className="flex items-center justify-between p-4 rounded-xl border border-earth-200/60 bg-earth-50/50 hover:bg-forest-50/30 hover:border-forest-200/40 transition-all shadow-sm">
                  <div>
                    <h3 className="font-medium text-earth-900">{feed.title}</h3>
                    <a href={feed.url} target="_blank" rel="noreferrer" className="text-xs text-earth-500 hover:text-forest-600 hover:underline transition-colors">
                      {feed.url}
                    </a>
                  </div>
                  <form action={async () => {
                    "use server";
                    await deleteFeed(feed.id);
                  }}>
                    <button type="submit" className="p-2 text-earth-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </form>
                </div>
              ))
            )}
          </div>
        </section>
      </main>

      {/* Subtle footer gradient */}
      <div className="h-24 bg-gradient-to-t from-earth-100/50 to-transparent" />
    </div>
  );
}
