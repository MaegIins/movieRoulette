import { ref, watch } from 'vue'

const STORAGE_KEY = 'movieRoulette.locale'

function detectInitialLocale() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'fr' || stored === 'en') return stored
  } catch {
    // localStorage indisponible (navigation privée, etc.)
  }
  return 'fr'
}

export const locale = ref(detectInitialLocale())

function applyDocumentLang(value) {
  try {
    document.documentElement.lang = value
  } catch {
    // pas d'environnement navigateur (SSR, tests, etc.)
  }
}

applyDocumentLang(locale.value)

watch(locale, (value) => {
  try {
    localStorage.setItem(STORAGE_KEY, value)
  } catch {
    // ignore
  }
  applyDocumentLang(value)
})

// code langue TMDB correspondant, utilisé pour la recherche et les libellés renvoyés par l'API
export const TMDB_LANGUAGE = { fr: 'fr-FR', en: 'en-US' }

const MESSAGES = {
  fr: {
    'sound.on': 'Son actif',
    'sound.off': 'Son coupé',
    'sound.titleEnable': 'Activer le son',
    'sound.titleDisable': 'Couper le son',
    'settings.button': 'Paramètres',
    close: 'Fermer',
    tagline: 'Trouve quoi regarder',
    'category.genre': 'Genre',
    'category.year': 'Année',
    'category.country': 'Pays',
    'filter.hint': 'Cliquer pour filtrer',
    'lock.locked': 'Verrouillé',
    'lock.lock': 'Verrouiller',
    rolling: 'En cours…',
    roll: 'Lancer',
    'subgenre.reroll': 'Relancer le sous-genre',
    'subgenre.roll': 'Sous-genre',
    'subgenre.label': 'Sous-genre',
    'suggest.loading': 'Recherche…',
    'suggest.button': 'Proposer {count} films',
    'modal.title': 'Suggestions',
    'suggest.noResults': 'Aucun film trouvé pour cette combinaison.',
    'suggest.error': 'Erreur lors de la recherche.',
    'suggest.relaxedIntro': 'Pour trouver des résultats, la recherche a été élargie sur : {list}.',
    'relaxed.subgenre': 'le sous-genre',
    'relaxed.country': 'le pays',
    'relaxed.year': 'la décennie',
    'suggest.other': 'Autres films',
    'filter.title': 'Filtrer : {label}',
    'filter.selected': '{count} / {total} sélectionnés',
    'filter.checkAll': 'Tout cocher',
    'settings.title': 'Paramètres',
    'settings.minPopularity': 'Popularité minimum',
    'settings.maxPopularity': 'Popularité maximum',
    'settings.votes': '{count} votes',
    'settings.minPopularityDesc': 'Nombre minimum de votes reçus sur TMDB. Plus haut = films plus connus.',
    'settings.maxPopularityDesc': 'Nombre maximum de votes reçus sur TMDB. Plus bas = films plus confidentiels.',
    'settings.minRating': 'Note minimum',
    'settings.maxRating': 'Note maximum',
    'settings.none': 'aucune',
    'settings.minRatingDesc': 'Note moyenne minimum sur TMDB, sur 10.',
    'settings.maxRatingDesc': 'Note moyenne maximum sur TMDB, sur 10.',
    'settings.toggleMax': 'Basculer en maximum',
    'settings.toggleMin': 'Basculer en minimum',
    'settings.movieCount': 'Nombre de films proposés',
    'settings.movies': '{count} films',
    'settings.movieCountDesc': 'Nombre de films suggérés à chaque recherche.',
    'settings.reset': 'Réinitialiser',
    'settings.language': 'Langue',
    'settings.languageDesc': "Langue de l'interface et des résultats TMDB.",
    'lang.fr': 'Français',
    'lang.en': 'Anglais',
    'footer.disclaimer': "Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.",
    'footer.source': 'Code source',
    'tmdb.missingKey': 'Clé TMDB manquante : crée un fichier .env avec VITE_TMDB_API_KEY (voir .env.example)',
    'tmdb.error': 'Erreur TMDB ({status})',
  },
  en: {
    'sound.on': 'Sound on',
    'sound.off': 'Sound off',
    'sound.titleEnable': 'Enable sound',
    'sound.titleDisable': 'Mute sound',
    'settings.button': 'Settings',
    close: 'Close',
    tagline: 'Find something to watch',
    'category.genre': 'Genre',
    'category.year': 'Decade',
    'category.country': 'Country',
    'filter.hint': 'Click to filter',
    'lock.locked': 'Locked',
    'lock.lock': 'Lock',
    rolling: 'Rolling…',
    roll: 'Roll',
    'subgenre.reroll': 'Reroll subgenre',
    'subgenre.roll': 'Subgenre',
    'subgenre.label': 'Subgenre',
    'suggest.loading': 'Searching…',
    'suggest.button': 'Suggest {count} movies',
    'modal.title': 'Suggestions',
    'suggest.noResults': 'No movie found for this combination.',
    'suggest.error': 'Error while searching.',
    'suggest.relaxedIntro': 'To find results, the search was broadened on: {list}.',
    'relaxed.subgenre': 'the subgenre',
    'relaxed.country': 'the country',
    'relaxed.year': 'the decade',
    'suggest.other': 'More movies',
    'filter.title': 'Filter: {label}',
    'filter.selected': '{count} / {total} selected',
    'filter.checkAll': 'Select all',
    'settings.title': 'Settings',
    'settings.minPopularity': 'Minimum popularity',
    'settings.maxPopularity': 'Maximum popularity',
    'settings.votes': '{count} votes',
    'settings.minPopularityDesc': 'Minimum number of votes received on TMDB. Higher = more well-known movies.',
    'settings.maxPopularityDesc': 'Maximum number of votes received on TMDB. Lower = more obscure movies.',
    'settings.minRating': 'Minimum rating',
    'settings.maxRating': 'Maximum rating',
    'settings.none': 'none',
    'settings.minRatingDesc': 'Minimum average rating on TMDB, out of 10.',
    'settings.maxRatingDesc': 'Maximum average rating on TMDB, out of 10.',
    'settings.toggleMax': 'Switch to maximum',
    'settings.toggleMin': 'Switch to minimum',
    'settings.movieCount': 'Number of suggested movies',
    'settings.movies': '{count} movies',
    'settings.movieCountDesc': 'Number of movies suggested per search.',
    'settings.reset': 'Reset',
    'settings.language': 'Language',
    'settings.languageDesc': 'Interface and TMDB results language.',
    'lang.fr': 'French',
    'lang.en': 'English',
    'footer.disclaimer': 'This product uses the TMDB API but is not endorsed or certified by TMDB.',
    'footer.source': 'Source code',
    'tmdb.missingKey': 'Missing TMDB key: create a .env file with VITE_TMDB_API_KEY (see .env.example)',
    'tmdb.error': 'TMDB error ({status})',
  },
}

export function t(key, vars) {
  const dict = MESSAGES[locale.value] || MESSAGES.fr
  let str = dict[key] ?? MESSAGES.fr[key] ?? key
  if (vars) {
    for (const [k, v] of Object.entries(vars)) {
      str = str.replaceAll(`{${k}}`, v)
    }
  }
  return str
}

export function joinList(items) {
  if (items.length <= 1) return items.join('')
  const and = locale.value === 'en' ? 'and' : 'et'
  return `${items.slice(0, -1).join(', ')} ${and} ${items[items.length - 1]}`
}
