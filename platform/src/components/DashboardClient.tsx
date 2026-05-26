"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Search,
  Filter,
  Sparkles,
  Clock,
  ChevronRight,
  ChevronDown,
  Leaf,
} from "lucide-react";
import Link from "next/link";
import dynamic from "next/dynamic";
import remarkGfm from "remark-gfm";
import { Button } from "@/components/ui/button";
import { logout } from "@/app/login/actions";
import { useSearchParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

const ReactMarkdown = dynamic(() => import("react-markdown"), { ssr: false });

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

function ArticleCard({
  article,
  idx,
}: {
  article: DashboardArticle;
  idx: number;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 + idx * 0.05 }}
      className="group relative p-6 rounded-2xl border border-earth-200 bg-white/80 backdrop-blur-sm hover:border-forest-300/50 hover:shadow-xl hover:shadow-forest-900/5 transition-all duration-300"
      style={{
        boxShadow: '0 1px 3px oklch(0.52 0.07 60 / 0.06), 0 4px 12px oklch(0.52 0.07 60 / 0.03)',
      }}
    >
      {/* Subtle top accent line */}
      <div className="absolute top-0 left-6 right-6 h-px bg-gradient-to-r from-transparent via-forest-300/40 to-transparent" />

      {/* Meta: source, date, tags */}
      <div className="flex items-center gap-3 text-xs font-medium text-earth-500 mb-3">
        <span className="flex items-center gap-1.5 px-2.5 py-1 bg-forest-50 border border-forest-200/60 rounded-lg text-forest-700 shadow-sm shadow-forest-900/5">
          {article.source}
        </span>
        <span className="flex items-center gap-1 text-earth-400">
          <Clock className="w-3 h-3" />
          {formatRelativeTime(article.publishDate)}
        </span>
        <div className="flex items-center gap-2 ml-auto">
          {article.tags.map((tag) => (
            <span
              key={tag}
              className="px-2.5 py-0.5 bg-earth-50 border border-earth-200/60 rounded-full text-earth-500 text-[10px] uppercase tracking-wider shadow-sm"
            >
              {tag}
            </span>
          ))}
        </div>
      </div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-3 text-earth-900 group-hover:text-forest-700 transition-colors">
        {article.title}
      </h3>

      {/* AI Summary - Expandable Card */}
      <div className="bg-gradient-to-br from-forest-50/80 via-earth-50/50 to-white rounded-xl border border-forest-200/40 relative overflow-hidden shadow-inner shadow-forest-900/3">
        <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-forest-600 via-forest-400 to-earth-300 rounded-l-xl"></div>

        {/* Toggle header */}
        <button
          onClick={() => setExpanded(!expanded)}
          aria-expanded={expanded}
          aria-controls={`summary-content-${article.id}`}
          className="w-full flex items-center gap-2.5 px-5 py-3 text-left hover:bg-forest-50/60 transition-colors cursor-pointer"
        >
          <Sparkles className="w-4 h-4 text-forest-500 shrink-0" />
          <span className="text-xs font-semibold uppercase tracking-wider text-forest-600">
            Résumé IA
          </span>
          <ChevronDown
            className={`w-4 h-4 text-forest-400 ml-auto transition-transform duration-200 ${expanded ? "rotate-180" : ""}`}
          />
        </button>

        {/* Content */}
        <AnimatePresence initial={false}>
          {expanded && (
            <motion.div
              id={`summary-content-${article.id}`}
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
          <button
            type="button"
            onClick={() => setExpanded(true)}
            className="w-full text-left px-5 pb-3 cursor-pointer group/preview focus:outline-none focus:ring-2 focus:ring-forest-400 rounded-b-xl"
          >
            <p className="text-sm text-earth-500 line-clamp-2 group-hover/preview:text-earth-700 transition-colors">
              {article.aiSummary.replace(/[*#_\[\]`>-]/g, "").substring(0, 200)}
              ...
            </p>
          </button>
        )}
      </div>

      {/* Link to original */}
      <div className="mt-4 flex justify-end">
        <a
          href={article.url}
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-1 text-sm font-medium text-earth-400 group-hover:text-forest-700 transition-colors"
        >
          Lire l&apos;article original
          <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      </div>
    </motion.article>
  );
}

export default function DashboardClient({
  initialArticles,
  isLoggedIn,
}: {
  initialArticles: DashboardArticle[];
  isLoggedIn: boolean;
}) {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const selectedFilter = searchParams.get("tag") || "Tous";
  const filters = ["Tous", "Frontend", "Backend", "IA", "DevOps"];

  const handleFilter = (filter: string) => {
    const params = new URLSearchParams(searchParams);
    if (filter === "Tous") {
      params.delete("tag");
    } else {
      params.set("tag", filter);
    }
    router.push(`/?${params.toString()}`);
  };

  // Filtrage réel par tags
  const displayedArticles =
    selectedFilter === "Tous"
      ? initialArticles
      : initialArticles.filter((article) =>
          article.tags.some(
            (tag) => tag.toLowerCase() === selectedFilter.toLowerCase(),
          ),
        );

  return (
    <div className="min-h-screen bg-gradient-to-b from-earth-50 via-white to-forest-50/30 text-earth-900 font-sans selection:bg-forest-200/50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-xl border-b border-earth-200/60"
        style={{
          boxShadow: '0 1px 8px oklch(0.52 0.07 60 / 0.06)',
        }}
      >
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-gradient-to-br from-forest-700 to-forest-900 rounded-lg flex items-center justify-center shadow-md shadow-forest-900/20">
              <Leaf className="w-4 h-4 text-forest-100" />
            </div>
            <h1 className="font-semibold tracking-tight text-lg text-earth-900">
              TechWatch <span className="text-forest-600">AI</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-earth-400" />
              <input
                type="text"
                placeholder="Rechercher un article..."
                aria-label="Rechercher un article"
                className="pl-9 pr-4 py-1.5 bg-earth-50/80 border border-earth-200 rounded-full text-sm focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-300 transition-all w-64 placeholder:text-earth-400"
              />
            </div>
            {isLoggedIn ? (
              <>
                <Link
                  href="/settings"
                  className="text-sm font-medium text-earth-500 hover:text-forest-700 transition-colors"
                >
                  Paramètres
                </Link>
                <form action={logout}>
                  <button
                    type="submit"
                    className="text-sm font-medium text-earth-500 hover:text-red-600 transition-colors"
                  >
                    Déconnexion
                  </button>
                </form>
              </>
            ) : (
              <Link
                href="/login"
                className="text-sm font-medium text-earth-500 hover:text-forest-700 transition-colors"
              >
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
              className="text-3xl font-bold tracking-tight text-earth-900 mb-2"
            >
              Votre veille, <span className="text-forest-600">résumée.</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-earth-500"
            >
              L'IA a lu et analysé {displayedArticles.length} articles pour vous
              aujourd'hui.
            </motion.p>
          </div>
          <Link
            href="/settings"
            className="flex items-center gap-2 text-sm font-medium text-earth-600 hover:text-forest-700 transition-colors px-4 py-2 rounded-lg hover:bg-forest-50 border border-earth-200 shadow-sm"
          >
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
              onClick={() => handleFilter(filter)}
              className={cn(
                "rounded-full transition-all",
                selectedFilter === filter
                  ? "bg-gradient-to-r from-forest-700 to-forest-800 text-white shadow-md shadow-forest-900/15 border-forest-700"
                  : "bg-earth-100 text-earth-600 hover:bg-earth-200 border-earth-200/60"
              )}
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

      {/* Subtle footer gradient */}
      <div className="h-32 bg-gradient-to-t from-earth-100/50 to-transparent" />
    </div>
  );
}
