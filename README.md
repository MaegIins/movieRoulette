# Movie Roulette

Une roulette pour décider quoi regarder. On tire un genre, une décennie et un pays, en option un sous-genre plus précis, puis l'app va chercher trois films correspondants sur TMDB.

## Fonctionnement

- **Genre / Année / Pays** : trois rouleaux tirés en même temps. Décennies récentes et grands pays producteurs sont un peu favorisés, mais tout reste possible.
- **Sous-genre** : une fois le genre connu, un deuxième tirage propose une variante plus précise (ex. Horreur → Found footage).
- **Proposer 3 films** : interroge TMDB avec ces critères. Si la combinaison est trop rare, la recherche s'élargit automatiquement (pays, puis décennie) et le prévient dans la modale.
- **Autres films** : redemande 3 films en excluant ceux déjà montrés, pour ne pas se répéter.
- Chaque film proposé pointe vers sa fiche TMDB et Letterboxd.
- **Paramètres** : langue de l'interface et des résultats TMDB (Français / English), popularité et note minimales (basculables en maximales via l'icône ↻, pour chercher au contraire des films confidentiels ou mal notés). Langue, son coupé, popularité et note sont mémorisés d'une visite à l'autre.
- **`/visites`** : compteur de visites (une par chargement de page), persisté côté serveur dans `server/data/`.

## Setup

```bash
npm install
```

Le front ne parle jamais directement à TMDB : un petit serveur (`server/`) proxie les appels et porte seul la clé API, qui n'est donc jamais exposée au navigateur.

1. Crée un compte sur [themoviedb.org](https://www.themoviedb.org/) puis génère une clé API (v3 auth) dans *Paramètres → API*.
2. Copie `.env.example` en `.env` et colle la clé :
   ```
   TMDB_API_KEY=ta_clé_ici
   ```
3. Une fois déployé, renseigne aussi `ALLOWED_ORIGIN` avec l'URL exacte du site (ex. `https://movie-roulette.exemple.com`, sans slash final) : `/api/tmdb` refuse toute requête dont l'origine ne correspond pas, ce qui bloque les appels directs (`curl`, etc.) qui n'envoient pas ce header. Sans cette variable, seuls les ports de dev locaux sont autorisés.

Sans clé, tout le reste de l'app fonctionne (les rouleaux, le tirage), seul le bouton "Proposer N films" affichera une erreur explicite.

## Commandes

En développement, deux process tournent en parallèle (le proxy Vite fait le lien entre les deux) :

```bash
npm run server    # API : proxie TMDB sur http://localhost:3001 (redémarre au changement de fichier)
npm run dev       # front : serveur de dev Vite sur http://localhost:5173
```

Déploiement (ex. sur un VPS) :

```bash
npm run build     # build de prod dans dist/
npm start         # un seul process Node : sert dist/ ET l'API, sur $PORT (3001 par défaut)
```

Place ce process derrière un reverse proxy (nginx, Caddy…) si tu veux du TLS, un nom de domaine, etc.

## Structure

```
server/
  index.js          serveur Express : proxie TMDB (clé API injectée ici) + sert dist/ en prod
  visites.html       page statique du compteur de visites (/visites)
  data/               compteur de visites persisté (non versionné)
src/
  App.vue           composant unique : rouleaux, animation, modale
  tmdb.js           appelle l'API du serveur (jamais TMDB directement) + repli progressif des critères
  i18n.js           locale (fr/en), dictionnaire de traductions, langue TMDB associée
  data/
    genres.js       19 genres + leurs sous-genres, avec id/mot-clé TMDB associés et libellés fr/en
    countries.js     pays + code ISO + poids de tirage + libellés fr/en
    decades.js       décennies + poids de tirage + libellés fr/en
```

## Stack

Vue 3, Vite, Tailwind CSS v4 côté front ; Express côté serveur (proxy TMDB + fichiers statiques en prod).
