"use client";

import { useActionState } from "react";
import { login, signup } from "./actions";
import { Button } from "@/components/ui/button";

export default function LoginPage() {
  const [loginState, loginAction, isLoginPending] = useActionState(login, null);
  const [signupState, signupAction, isSignupPending] = useActionState(signup, null);

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-50 px-4">
      <div className="w-full max-w-md bg-white p-8 rounded-2xl shadow-sm border border-zinc-100">
        <div className="text-center mb-8">
          <div className="w-12 h-12 bg-zinc-900 rounded-xl mx-auto flex items-center justify-center mb-4">
            <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Bienvenue sur Tech Watch</h1>
          <p className="text-sm text-zinc-500 mt-2">Connectez-vous ou créez un compte pour gérer votre veille technologique.</p>
        </div>

        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-zinc-700 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="votre@email.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-zinc-700 mb-1">
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              className="w-full px-4 py-2 bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent transition-all"
              placeholder="••••••••"
            />
          </div>

          {(loginState?.error || signupState?.error) && (
            <div className="p-3 text-sm text-red-600 bg-red-50 rounded-lg border border-red-100">
              {loginState?.error || signupState?.error}
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button 
              type="submit"
              formAction={loginAction} 
              disabled={isLoginPending || isSignupPending}
              className="w-full justify-center"
            >
              {isLoginPending ? "Connexion..." : "Se connecter"}
            </Button>
            
            <Button 
              type="submit"
              formAction={signupAction} 
              disabled={isLoginPending || isSignupPending}
              variant="outline"
              className="w-full justify-center"
            >
              {isSignupPending ? "Création..." : "Créer un compte"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
