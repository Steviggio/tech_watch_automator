"use client";

import { useActionState } from "react";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";
import { Leaf } from "lucide-react";

export default function LoginPage() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, null);
  const [signupState, signupAction, isSignupPending] = useActionState(signup, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-earth-50 via-white to-forest-50/40 px-4">
      {/* Decorative background elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-forest-200/20 rounded-full blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-earth-200/20 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative">
        <div
          className="bg-white/80 backdrop-blur-sm p-8 rounded-2xl border border-earth-200/60 relative overflow-hidden"
          style={{
            boxShadow: '0 4px 24px oklch(0.52 0.07 60 / 0.08), 0 1px 4px oklch(0.52 0.07 60 / 0.06)',
          }}
        >
          {/* Top accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-forest-400 via-forest-600 to-earth-400" />

          <div className="text-center mb-8">
            <div
              className="w-14 h-14 bg-gradient-to-br from-forest-700 to-forest-900 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-forest-900/20"
            >
              <Leaf className="w-7 h-7 text-forest-100" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-earth-900">Bienvenue sur Tech Watch</h1>
            <p className="text-sm text-earth-500 mt-2">Connectez-vous ou créez un compte pour gérer votre veille technologique.</p>
          </div>

          <form className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-earth-700 mb-1">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                className="w-full px-4 py-2.5 bg-earth-50/60 border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-400 transition-all placeholder:text-earth-400"
                placeholder="votre@email.com"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-earth-700 mb-1">
                Mot de passe
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="w-full px-4 py-2.5 bg-earth-50/60 border border-earth-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-forest-500/20 focus:border-forest-400 transition-all placeholder:text-earth-400"
                placeholder="••••••••"
              />
            </div>

            {(loginState?.error || signupState?.error) && (
              <div className="p-3 text-sm text-red-700 bg-red-50 rounded-xl border border-red-200/60">
                {loginState?.error || signupState?.error}
              </div>
            )}

            <div className="flex flex-col gap-3 pt-2">
              <Button 
                type="submit"
                formAction={loginAction} 
                disabled={isLoginPending || isSignupPending}
                className="w-full justify-center bg-gradient-to-r from-forest-700 to-forest-800 hover:from-forest-800 hover:to-forest-900 text-white shadow-md shadow-forest-900/15 py-2.5 rounded-xl"
              >
                {isLoginPending ? "Connexion..." : "Se connecter"}
              </Button>
              
              <Button 
                type="submit"
                formAction={signupAction} 
                disabled={isLoginPending || isSignupPending}
                variant="outline"
                className="w-full justify-center border-earth-200 text-earth-700 hover:bg-forest-50 hover:text-forest-700 hover:border-forest-200 py-2.5 rounded-xl"
              >
                {isSignupPending ? "Création..." : "Créer un compte"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
