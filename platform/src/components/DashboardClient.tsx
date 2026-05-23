"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Search, Filter, Sparkles, Clock, ChevronRight, ChevronDown } from "lucide-react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";

export type DashboardArticle = {
  id: string;
  title: string;
  source: string;
  publishDate: string;
  aiSummary: string;
  tags: string[];
  url: string;
};

function formatRelativeTime(dateString: string): string {
  const now = Date.now();
  const then = new Date(dateString).getTime();
  const diffMs = Math.abs(now - then);
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffMinutes < 1) return "À l'instant";
  if (diffMinutes < 60) return `Il y a ${diffMinutes}min`;
  if (diffHours < 24) return `Il y a ${diffHours}h`;
  if (diffDays === 1) return "Hier";
  return `Il y a ${diffDays} jours`;
}

function ArticleCard({ article, idx }: { article: DashboardArticle; idx: number }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + (idx * 0.05) }}
      className="group p-6 rounded-2xl border border-zinc-200 bg-white hover:border-zinc-300 hover:shadow-lg hover:shadow-zinc-100 transition-all duration-300"
    >
      {/* Meta: source, date, tags */}
      <div className="flex items-center gap-3 text-xs font-medium text-zinc-500 mb-3">
        <span className="flex items-center gap-1.5 px-2 py-1 bg-zinc-100 rounded-md text-zinc-700">
          {article.source}
        </span>
        <span className="flex items-center gap-1">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(article.publishDate)}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {article.tags.map(tag => (
            <span key={tag} className="px-2 py-0.5 bg-zinc-50 border border-zinc-100 rounded-full text-zinc-400 text-[10px] uppercase tracking-wider">
              {tag}
            </span>
          ))}
        </div>
      </div>
      
      {/* Title */}
      <h3 className="text-xl font-semibold mb-3 text-zinc-900 group-hover:text-zinc-700 transition-colors">
        {article.title}
      </h3>
      
      {/* AI Summary - Expandable Card */}
      <div className="bg-gradient-to-br from-zinc-50 to-white rounded-xl border border-zinc-100 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-zinc-800 to-zinc-300"></div>
        
        {/* Toggle header */}
        <button 
          onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center gap-2.5 px-5 py-3 text-left hover:bg-zinc-50/80 transition-colors"
        >
          <Sparkles className="w-4 h-4 text-zinc-400 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-zinc-400">Résumé IA</span>
          <ChevronDown className={`w-4 h-4 text-zinc-400 ml-auto transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`} />
        </button>

        {/* Content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="overflow-hidden"
            >
              <div className="px-5 pb-4 prose-summary">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {article.aiSummary}
                </ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Collapsed preview */}
        {!expanded && (
          <div className="px-5 pb-3">
            <p className="text-sm text-zinc-500 line-clamp-2">
              {article.aiSummary.replace(/[*#_\[\]`>-]/g, '').substring(0, 200)}...
            </p>
          </div>
        )}
      </div>

      {/* Link to original */}
      <div className="mt-4 flex justify-end">
        <a 
          href={article.url} 
          target="_blank" 
          rel="noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-zinc-400 group-hover:text-zinc-900 transition-colors"
        >
          Lire l&apos;article original
          <ChevronRight className="w-4 h-4" />
        </a>
      </div>
    </motion.article>
  );
}

export default function DashboardClient({ initialArticles, user }: { initialArticles: DashboardArticle[], user: any }) {
  const [selectedFilter, setSelectedFilter] = useState("Tous");
  const filters = ["Tous", "Frontend", "Backend", "IA", "DevOps"];
  
  // Filtrage réel par tags
  const displayedArticles = selectedFilter === "Tous"
    ? initialArticles
    : initialArticles.filter(article =>
        article.tags.some(tag => tag.toLowerCase() === selectedFilter.toLowerCase())
      );

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
                aria-label="Rechercher un article"
                className="pl-9 pr-4 py-1.5 bg-zinc-50 border border-zinc-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-zinc-900/10 transition-shadow w-64"
              />
            </div>
            {user ? (
              <>
                <Link href="/settings" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                  Paramètres
                </Link>
                <form action={logout}>
                  <button type="submit" className="text-sm font-medium text-zinc-500 hover:text-red-600 transition-colors">
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <Link href="/login" className="text-sm font-medium text-zinc-500 hover:text-zinc-900 transition-colors">
                Connexion
              </Link>
            )}
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
          <Link href="/settings" className="flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors px-4 py-2 rounded-md hover:bg-zinc-50 border border-zinc-200">
            <Filter className="w-4 h-4" />
            Ajuster le Prompt
          </Link>
        </div>

        {/* Filtres Rapides */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex flex-wrap gap-2 mb-10"
        >
          {filters.map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? "default" : "secondary"}
              size="sm"
              role="button"
              aria-pressed={selectedFilter === filter}
              onClick={() => setSelectedFilter(filter)}
              className={`rounded-full ${
                selectedFilter === filter 
                ? "bg-zinc-900 text-white shadow-md shadow-zinc-900/10" 
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              {filter}
            </Button>
          ))}
        </motion.div>

        {/* Liste des Articles (Feed) */}
        <div className="space-y-6">
          {displayedArticles.map((article, idx) => (
            <ArticleCard key={article.id} article={article} idx={idx} />
          ))}
        </div>
      </main>
    </div>
  );
}
