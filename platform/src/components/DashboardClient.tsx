"use client";

import { motion } from "framer-motion";
import { useState } from "react";
import { Search, Filter, Sparkles, Clock, ChevronRight } from "lucide-react";

export type DashboardArticle = {
  id: string;
  title: string;
  source: string;
  time: string;
  aiSummary: string;
  tags: string[];
  url: string;
};

export default function DashboardClient({ initialArticles }: { initialArticles: DashboardArticle[] }) {
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const filters = ["Tous", "Frontend", "Backend", "IA", "DevOps"];
  
  // Dans un vrai projet, le filter se ferait via une Server Action ou useSWR
  const displayedArticles = initialArticles;

  return (
    <div className="min-h-screen bg-white text-zinc-900 font-sans selection:bg-zinc-200">
      {/* Header Minimaliste */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-semibold tracking-tight text-lg">TechWatch AI</h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" />
              <input 
                type="text" 
                placeholder="Rechercher un article..." 
                className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow w-64"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-12">
        {/* Titre et Paramètres */}
        <div className="flex items-end justify-between mb-12">
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-3xl font-bold tracking-tight text-zinc-900 mb-2"
            >
              Votre veille, <span className="text-zinc-500">résumée.</span>
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-zinc-500"
            >
              L'IA a lu et analysé {displayedArticles.length} articles pour vous aujourd'hui.
            </motion.p>
          </div>
          <button className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2 rounded-md hover:bg-zinc-50 border border-zinc-200">
            <Filter className="w-4 h-4" />
            Ajuster le Prompt
          </button>
        </div>

        {/* Filtres Rapides */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {filters.map((filter) => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                selectedFilter === filter 
                ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" 
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {filter}
            </button>
          ))}
        </motion.div>

        {/* Liste des Articles (Feed) */}
        <div className="space-y-6">
          {displayedArticles.map((article, idx) => (
            <motion.article 
              key={article.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + (idx * 0.1) }}
              className="group p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 transition-all duration-300 cursor-pointer"
            >
              <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-3">
                <span className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-md text-zinc-700">
                  {article.source}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {article.time}
                </span>
                <div className="flex items-center gap-2 ml-auto">
                  {article.tags.map(tag => (
                    <span key={tag} className="text-zinc-400">#{tag}</span>
                  ))}
                </div>
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-zinc-900 group-hover:text-zinc-700 transition-colors">
                {article.title}
              </h3>
              
              <div className="flex items-start gap-3 bg-zinc-50/50 p-4 rounded-xl border border-zinc-100 relative overflow-hidden">
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-800 to-zinc-400"></div>
                <Sparkles className="w-4 h-4 text-zinc-400 shrink-0 mt-0.5" />
                <p className="text-sm leading-relaxed text-zinc-600 whitespace-pre-wrap">
                  {article.aiSummary}
                </p>
              </div>

              <div className="mt-4 flex justify-end">
                <a 
                  href={article.url} 
                  target="_blank" 
                  rel="noreferrer"
                  className="flex items-center gap-1 text-sm font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors"
                >
                  Lire l'article original
                  <ChevronRight className="w-4 h-4" />
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </main>
    </div>
  );
}
