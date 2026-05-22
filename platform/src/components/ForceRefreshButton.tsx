"use client";

import { useActionState } from "react";
import { forceRefreshSummaries } from "@/app/actions";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function ForceRefreshButton({ lastRefresh }: { lastRefresh: Date | null }) {
  const [state, action, isPending] = useActionState(forceRefreshSummaries, null);

  // Vérifier côté client si on est bloqué par la limite des 6h
  let isRateLimited = false;
  let remainingHours = 0;
  // Désactivé temporairement pour les tests
  /*
  if (lastRefresh) {
    const hoursSince = (new Date().getTime() - new Date(lastRefresh).getTime()) / (1000 * 60 * 60);
    if (hoursSince < 6) {
      isRateLimited = true;
      remainingHours = Math.ceil(6 - hoursSince);
    }
  }
  */

  return (
    <form className="mt-6 pt-6 border-t border-zinc-100" action={action}>
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-medium text-zinc-900">Rafraîchir les anciens articles</h3>
            <p className="text-xs text-zinc-500">Applique vos nouvelles préférences aux résumés existants.</p>
          </div>
          <Button 
            type="submit" 
            variant="outline" 
            disabled={isPending || isRateLimited}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isPending ? "animate-spin" : ""}`} />
            {isPending ? "Génération en cours..." : "Forcer la mise à jour"}
          </Button>
        </div>
        
        {isRateLimited && !state?.error && !state?.success && (
          <p className="text-xs text-amber-600">
            Mise à jour disponible dans {remainingHours} heure(s).
          </p>
        )}

        {state?.error && (
          <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg border border-red-100">
            {state.error}
          </p>
        )}

        {state?.success && (
          <p className="text-xs text-green-600 bg-green-50 p-2 rounded-lg border border-green-100">
            {state.message}
          </p>
        )}
      </div>
    </form>
  );
}
