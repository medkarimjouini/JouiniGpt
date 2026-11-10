# JouiniGPT

JouiniGPT — projet indépendant de Jouini Mohamed Karim.

## État actuel
- Site statique responsive et interface de démonstration.
- Déploiement GitHub Pages automatisé via GitHub Actions.
- Le chat est en **mode démonstration** : il ne contacte pas encore un modèle IA.

## Déploiement
Le workflow `.github/workflows/pages.yml` valide `index.html` puis publie le site sur GitHub Pages à chaque push sur `main`.

Dans GitHub, vérifier **Settings → Pages → Build and deployment → Source: GitHub Actions** si Pages n'est pas déjà activé. Puis consulter l'onglet **Actions** pour le résultat du déploiement.

Adresse attendue après activation : https://medkarimjouini.github.io/JouiniGpt/

## Activer un vrai moteur IA
Un backend (par exemple Node.js) doit être déployé séparément. La clé API doit être stockée uniquement dans les variables secrètes de l'hébergeur (par exemple `OPENAI_API_KEY`) et jamais dans `index.html`, le dépôt Git ou l'application Android. Il faut ensuite relier l'interface à une route serveur authentifiée, avec limites de requêtes, validation des entrées et protections anti-abus.

## Sécurité
- Ne publiez jamais de mot de passe ni de clé API.
- Toute clé déjà partagée dans un chat, un dépôt ou une capture doit être considérée compromise et remplacée.
- Ne pas promettre de confidentialité ou de sécurité complète sans audit et tests dédiés.
