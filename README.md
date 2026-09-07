# Movie Roulette

Une roulette pour décider quoi regarder. On tire un genre, une décennie et un pays, en option un sous-genre plus précis, puis l'app va chercher trois films correspondants sur TMDB.

## Fonctionnement

- **Genre / Année / Pays** : trois rouleaux tirés en même temps. Décennies récentes et grands pays producteurs sont un peu favorisés, mais tout reste possible.
- **Sous-genre** : une fois le genre connu, un deuxième tirage propose une variante plus précise (ex. Horreur → Found footage).
- **Proposer 3 films** : interroge TMDB avec ces critères. Si la combinaison est trop rare, la recherche s'élargit automatiquement (votes, pays, durée, puis décennie) et le prévient dans la modale — sauf en mode "Résultats stricts" (voir Paramètres), qui affiche moins de films (voire aucun) plutôt que d'assouplir les critères.
- **Autres films** : redemande 3 films en excluant ceux déjà montrés, pour ne pas se répéter.
- Chaque film proposé pointe vers sa fiche TMDB et Letterboxd.
- **Paramètres** : langue de l'interface et des résultats TMDB (Français / English), durée des films (court et/ou long métrage, seuil officiel CNC à 60 min, cochables ensemble ou séparément), popularité et note minimales (basculables en maximales via l'icône ↻, pour chercher au contraire des films confidentiels ou mal notés), nombre de films suggérés, et un mode "Résultats stricts" qui désactive l'élargissement automatique. Tous ces réglages ainsi que la langue et le son coupé sont mémorisés d'une visite à l'autre.

## Setup

```bash
npm install
```

L'app appelle TMDB directement depuis le navigateur, il faut donc une clé API gratuite :

1. Crée un compte sur [themoviedb.org](https://www.themoviedb.org/) puis génère une clé API (v3 auth) dans *Paramètres → API*.
2. Copie `.env.example` en `.env` et colle la clé :
   ```
   VITE_TMDB_API_KEY=ta_clé_ici
   ```

Sans clé, tout le reste de l'app fonctionne (les rouleaux, le tirage), seul le bouton "Proposer 3 films" affichera une erreur explicite.

## Commandes

```bash
npm run dev       # serveur de dev
npm run build     # build de prod dans dist/
npm run preview   # preview du build
```

## Structure

```
src/
  App.vue           composant unique : rouleaux, animation, modale
  tmdb.js           appels TMDB (discover, keyword, détail film) + repli progressif des critères
  i18n.js           locale (fr/en), dictionnaire de traductions, langue TMDB associée
  data/
    genres.js       19 genres + leurs sous-genres, avec id/mot-clé TMDB associés et libellés fr/en
    countries.js     pays + code ISO + poids de tirage + libellés fr/en
    decades.js       décennies + poids de tirage + libellés fr/en
```

## Stack

Vue 3, Vite, Tailwind CSS v4. Pas de backend — tout tourne côté client, TMDB est appelé directement depuis le navigateur.
