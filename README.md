# Tech Watch Automator 🚀

Une plateforme complète et auto-hébergée pour automatiser votre veille technologique. Elle agrège vos flux RSS, les filtre, et génère des résumés personnalisés grâce à l'Intelligence Artificielle (API Mistral), le tout depuis un dashboard moderne sécurisé.

## Fonctionnalités 🌟
- 🤖 **Résumés IA Personnalisés** : Utilisation de l'API Mistral (via Vercel AI SDK) pour synthétiser les articles selon vos préférences (ton, longueur, mots-clés).
- 🔄 **Worker Asynchrone** : Récupération automatique des flux via des tâches planifiées en arrière-plan (Cron) ou à la demande via l'interface.
- 🔐 **Authentification Sécurisée** : Connexion gérée par Supabase.
- 🐳 **Entièrement Dockerisé** : Facile à déployer avec NGINX, Next.js et Node.js.
- 🎨 **Interface Moderne** : Développée avec Next.js (App Router), Tailwind CSS et des composants UI avancés.
- 🗄️ **Base de Données PostgreSQL** : Structure gérée via Prisma ORM avec intégration native à Supabase.

## Architecture Globale 🏗️
Le projet est packagé dans un monorepo contenant trois conteneurs principaux orchestrés par Docker Compose :
- **Web (`tech_watch-web`)** : L'interface utilisateur en Next.js.
- **Worker (`tech_watch-worker`)** : Le script Node.js tournant en boucle pour la récupération RSS.
- **NGINX (`tech_watch-nginx`)** : Le reverse proxy exposant le port 80.

## Prérequis 🛠️
- **Docker** et **Docker Compose**
- Un compte [Supabase](https://supabase.com) (pour la base de données PostgreSQL et l'Auth)
- Un compte sur [La Plateforme Mistral](https://console.mistral.ai) (pour la clé API IA gratuite)

## Installation & Déploiement 🚀

1. **Clonez le projet**
   ```bash
   git clone <votre_repo>
   cd tech_watch
   ```

2. **Configuration des variables d'environnement**
   Copiez le fichier `platform/.env.example` en `platform/.env` et renseignez les valeurs requises :
   ```env
   # Prisma
   DATABASE_URL="postgres://..."
   DIRECT_URL="postgres://..."

   # Supabase Auth
   NEXT_PUBLIC_SUPABASE_URL="https://..."
   NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJ..."

   # IA
   MISTRAL_API_KEY="votre_cle_mistral"
   ```

3. **Lancement via Docker**
   Construisez et lancez les conteneurs (l'option `--build` est requise la première fois) :
   ```bash
   docker-compose up -d --build
   ```

4. **Accès**
   Rendez-vous sur [http://localhost](http://localhost) pour accéder à l'application.

## Utilisation 💡
1. **Création de compte** : Créez un compte via la page d'inscription.
2. **Configuration IA** : Allez dans "Paramètres IA" pour définir comment vous souhaitez que les articles soient résumés (Ton formel/décontracté, longueur maximale).
3. **Ajout de sources** : Ajoutez les URLs des flux RSS qui vous intéressent (blogs techniques, actus, etc.).
4. **Récupération** : Les articles sont scannés en arrière-plan, mais vous pouvez cliquer sur le bouton "Actualiser les Flux" pour forcer la synchronisation immédiatement.

---

