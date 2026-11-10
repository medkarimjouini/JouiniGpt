# JouiniGPT

Assistant IA multimodal de Jouini Mohamed Karim.

## Architecture
- Frontend statique publié sur GitHub Pages.
- API Node.js/Express dans `server/`, déployable avec Render via `render.yaml`.
- OpenAI Responses API pour le texte, les images, les fichiers et la recherche Web.
- La clé `OPENAI_API_KEY` est une variable secrète du service backend : ne jamais la mettre dans le dépôt ou le navigateur.

## Déploiement du backend
1. Ouvrir Render et choisir **New → Blueprint**.
2. Connecter le dépôt `medkarimjouini/JouiniGpt` et laisser Render lire `render.yaml`.
3. Lorsqu'il demande `OPENAI_API_KEY`, saisir la clé créée dans le tableau de bord OpenAI (ne pas la partager dans un chat ou un commit).
4. Déployer le service `jouinigpt-api`. L'URL attendue est `https://jouinigpt-api.onrender.com`.
5. Vérifier `/api/health`. Le champ `aiConfigured` doit être `true`.

Le frontend appelle cette URL. Si Render attribue une URL différente, modifier `API_BASE` dans `index.html` pour utiliser l'URL réelle, puis pousser le commit.

## Fonctionnalités et limites
- Images PNG, JPEG, WEBP, GIF.
- Documents PDF, TXT, MD, JSON, DOC/DOCX, RTF, ODT, PPT/PPTX, CSV, XLS/XLSX.
- Jusqu'à 10 fichiers par requête, 20 Mo par fichier, 40 Mo cumulés dans cette version du serveur. Ces limites protègent la mémoire du service et ne sont pas des limites OpenAI.
- Historique court côté navigateur transmis avec la requête, sans base de données de comptes.
- Recherche Web OpenAI activée par défaut.
- Limitation anti-abus : 30 requêtes par IP sur 15 minutes. Pas d'authentification utilisateur dans cette première version : ne pas publier largement avant d'ajouter comptes, quotas par compte et protection anti-abus renforcée.
- Les coûts, limites de contexte, disponibilité du modèle et politiques OpenAI s'appliquent. Le plan gratuit Render peut mettre le service en veille.

## Sécurité
- N'ajoute jamais de clé API, mot de passe ou secret dans GitHub.
- Toute clé précédemment partagée dans un chat ou un dépôt doit être révoquée et remplacée.
- `store:false` est demandé à l'API Responses ; cela ne constitue pas une promesse de rétention zéro pour tous les services.
