// historique des changements, du plus récent au plus ancien, basé sur les commits du dépôt
// numérotation : +0.01 par changement mineur, +1 (repart à .00) pour une refonte majeure
export const CHANGELOG = [
  {
    date: '2026-09-08',
    items: [
      {
        version: '2.08',
        fr: "Ajout d'un changelog consultable depuis le pied de page.",
        en: 'Added a changelog viewable from the footer.',
      },
    ],
  },
  {
    date: '2026-09-07',
    items: [
      {
        version: '2.07',
        fr: "Ajout de filtres de durée (courts et longs métrages) et d'un mode « résultats stricts » dans les paramètres de suggestion.",
        en: 'Added duration filters (short and feature films) and a "strict results" mode in the suggestion settings.',
      },
    ],
  },
  {
    date: '2026-09-04',
    items: [
      {
        version: '2.06',
        fr: 'Ajout d\'un compteur de visites (suivi côté serveur).',
        en: 'Added a visit counter (tracked server-side).',
      },
      {
        version: '2.05',
        fr: 'Amélioration de la mise en page et du style des rouleaux et des suggestions sur mobile.',
        en: 'Improved layout and styling of the reels and suggestions on mobile.',
      },
    ],
  },
  {
    date: '2026-09-02',
    items: [
      {
        version: '2.04',
        fr: 'Ajout du lien Letterboxd dans le pied de page.',
        en: 'Added a Letterboxd link in the footer.',
      },
      {
        version: '2.03',
        fr: "Le nombre de votes n'est plus assoupli en même temps que le pays ou la décennie dans les critères de suggestion.",
        en: 'The vote count filter is no longer relaxed at the same time as the country or decade in the suggestion criteria.',
      },
      {
        version: '2.02',
        fr: "Ajout du favicon et de l'icône d'écran d'accueil.",
        en: 'Added favicon and home screen icon.',
      },
      {
        version: '2.01',
        fr: 'Ajout du bouton « tout décocher » dans les filtres.',
        en: 'Added a "deselect all" button in the filters.',
      },
      {
        version: '2.00',
        fr: "Migration vers un serveur Express qui relaie les appels TMDB : la clé API n'est plus exposée côté client, et le serveur rejette les requêtes qui ne viennent pas du site.",
        en: "Migrated to an Express server that proxies TMDB calls: the API key is no longer exposed client-side, and the server rejects requests that don't come from the site.",
      },
      {
        version: '1.07',
        fr: 'Ajout du réglage du nombre de films suggérés et amélioration de la logique de suggestion.',
        en: 'Added a setting for the number of suggested movies and improved the suggestion logic.',
      },
      {
        version: '1.06',
        fr: 'Mémorisation de la préférence de son coupé et synchronisation de la langue de la page.',
        en: 'Stored the mute preference and synced the page language.',
      },
      {
        version: '1.05',
        fr: "Traduction complète de l'interface en français et en anglais, avec sélecteur de langue dans les paramètres.",
        en: 'Full French and English translation of the interface, with a language switcher in settings.',
      },
      {
        version: '1.04',
        fr: 'Ajout de paramètres pour le nombre minimum de votes et la note moyenne des films suggérés.',
        en: 'Added settings for the minimum vote count and average rating of suggested movies.',
      },
      {
        version: '1.03',
        fr: 'Ajout du pied de page avec mention de copyright, avertissement TMDB et lien vers le code source.',
        en: 'Added a footer with copyright notice, TMDB disclaimer and a link to the source code.',
      },
      {
        version: '1.02',
        fr: "Ajout d'animations : rebond des rouleaux à l'arrêt, apparition progressive des films suggérés et effets au survol des boutons.",
        en: 'Added animations: reels bounce when they land, suggested movies fade in, and buttons react on hover.',
      },
      {
        version: '1.01',
        fr: 'Ajout du verrouillage de catégories et de la possibilité d\'exclure des options du tirage.',
        en: 'Added category locking and the ability to exclude options from the draw.',
      },
    ],
  },
  {
    date: '2026-09-01',
    items: [
      {
        version: '1.00',
        fr: 'Lancement de Movie Roulette : rouleaux genre / décennie / pays et intégration TMDB.',
        en: 'Launch of Movie Roulette: genre / decade / country reels and TMDB integration.',
      },
    ],
  },
]
