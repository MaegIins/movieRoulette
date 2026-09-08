// historique des changements, du plus récent au plus ancien, basé sur les commits du dépôt
// numérotation : +0.01 par changement mineur, +1 réservé aux refontes majeures (aucune pour l'instant)
export const CHANGELOG = [
  {
    date: '2026-09-08',
    items: [
      {
        version: '1.11',
        fr: "Ajout d'un changelog consultable depuis le pied de page.",
        en: 'Added a changelog viewable from the footer.',
      },
    ],
  },
  {
    date: '2026-09-07',
    items: [
      {
        version: '1.10',
        fr: "Ajout de filtres de durée (courts et longs métrages) et d'un mode « résultats stricts » dans les paramètres de suggestion.",
        en: 'Added duration filters (short and feature films) and a "strict results" mode in the suggestion settings.',
      },
    ],
  },
  {
    date: '2026-09-04',
    items: [
      {
        version: '1.09',
        fr: "Ajout du favicon et de l'icône d'écran d'accueil, amélioration du filtrage par votes dans les suggestions.",
        en: 'Added favicon and home screen icon, improved vote filtering in suggestions.',
      },
      {
        version: '1.08',
        fr: "Amélioration de la mise en page et du style des rouleaux et des suggestions sur mobile.",
        en: 'Improved layout and styling of the reels and suggestions on mobile.',
      },
    ],
  },
  {
    date: '2026-09-02',
    items: [
      {
        version: '1.07',
        fr: 'Ajout du réglage du nombre de films suggérés et amélioration de la logique de suggestion.',
        en: 'Added a setting for the number of suggested movies and improved the suggestion logic.',
      },
      {
        version: '1.06',
        fr: 'Ajout du choix de langue et mémorisation de la préférence de son coupé.',
        en: 'Added language selection and stored the mute preference.',
      },
      {
        version: '1.05',
        fr: "Traduction complète de l'interface en français et en anglais.",
        en: 'Full French and English translation of the interface.',
      },
      {
        version: '1.04',
        fr: 'Ajout de paramètres pour le nombre minimum de votes et la note moyenne des films suggérés.',
        en: 'Added settings for the minimum vote count and average rating of suggested movies.',
      },
      {
        version: '1.03',
        fr: 'Ajout du pied de page avec mention de copyright et avertissement TMDB.',
        en: 'Added a footer with copyright notice and TMDB disclaimer.',
      },
      {
        version: '1.02',
        fr: "Ajout d'animations sur l'atterrissage des rouleaux et l'affichage du sous-genre.",
        en: 'Added landing animations for the reels and the subgenre display.',
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
