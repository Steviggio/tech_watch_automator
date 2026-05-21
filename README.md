# Tech Watch Automator 🚀

Ce projet permet d'automatiser votre veille technologique sans utiliser de plateformes tierces payantes comme Make ou Zapier. Il utilise GitHub Actions pour lancer un script TypeScript à intervalle régulier (Cron Job), qui récupère divers flux RSS et les insère dans une base de données Notion.

## Fonctionnalités
- 🆓 **100% Gratuit** : Hébergé sur GitHub Actions.
- 🔄 **Synchronisation automatique** : S'exécute toutes les 6 heures (configurable).
- 🧠 **Gestion des doublons** : Vérifie l'URL de l'article dans Notion avant insertion.
- 🛠️ **TypeScript & ESM** : Code maintenable, typé et moderne (`module: nodenext`).

## Architecture
- `src/config/sources.ts` : Liste des flux RSS à surveiller.
- `src/services/rss.service.ts` : Parseur de flux RSS vers JSON.
- `src/services/notion.service.ts` : Interaction avec l'API Notion.
- `.github/workflows/cron-sync.yml` : Workflow d'automatisation GitHub Actions.

## Prérequis
- Un compte [Notion](https://notion.so) et un compte [GitHub](https://github.com).
- Node.js version 20+.

## Installation
1. Clonez ce dépôt.
2. Installez les dépendances :
   ```bash
   npm install
   ```

## Configuration (Côté Notion)
1. Créez une base de données Notion (format Table) avec les colonnes : `Name` (Title), `URL` (URL), `Category` (Select), `Date` (Date), `Status` (Status).
2. Rendez-vous sur [Notion Developers](https://www.notion.so/my-integrations) pour créer une "Nouvelle intégration".
3. Récupérez le **Internal Integration Secret** (ce sera votre `NOTION_TOKEN`).
4. Invitez l'intégration dans votre base de données Notion via le menu `...` > *Connect to* de la page de la base de données.
5. Copiez l'ID de votre base de données depuis l'URL (suite de 32 caractères). Ce sera votre `NOTION_DATABASE_ID`.

## Configuration (Côté GitHub)
1. Allez dans les paramètres de votre dépôt GitHub > **Secrets and variables** > **Actions**.
2. Créez les secrets suivants :
   - `NOTION_TOKEN`
   - `NOTION_DATABASE_ID`

## Utilisation en local
Créez un fichier `.env` à la racine avec vos variables :
```env
NOTION_TOKEN=secret_...
NOTION_DATABASE_ID=1a2b3c...
```
Lancez la vérification des types :
```bash
npm run typecheck
```
Lancez le script :
```bash
npm start
```
Ou en mode développement (rechargement automatique) :
```bash
npm run dev
```
