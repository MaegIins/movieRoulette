import { GENRES } from './data/genres.js'
import { t, TMDB_LANGUAGE } from './i18n.js'

const TMDB_BASE = 'https://api.themoviedb.org/3'

const SUBGENRE_KEYWORDS = Object.fromEntries(
  GENRES.flatMap((g) => g.subgenres.map((s) => [s.id, s.tmdbKeyword])),
)

async function findKeywordId(term) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  const url = new URL(`${TMDB_BASE}/search/keyword`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('query', term)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.results?.[0]?.id ?? null
}

function decadeRange(startYear) {
  const start = Number(startYear)
  const end = Math.min(start + 9, new Date().getFullYear())
  return { gte: `${start}-01-01`, lte: `${end}-12-31` }
}

function pickRandom(arr, n) {
  const pool = [...arr]
  const picked = []
  while (pool.length && picked.length < n) {
    const i = Math.floor(Math.random() * pool.length)
    picked.push(pool.splice(i, 1)[0])
  }
  return picked
}

async function discover(params, language) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  const url = new URL(`${TMDB_BASE}/discover/movie`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', language)
  url.searchParams.set('include_adult', 'false')
  url.searchParams.set('sort_by', 'popularity.desc')
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url)
  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    throw new Error(body.status_message || t('tmdb.error', { status: res.status }))
  }
  return res.json()
}

// discover/movie ne renvoie pas le pays de façon fiable, il faut la fiche détaillée
async function fetchProductionCountry(id, language) {
  const apiKey = import.meta.env.VITE_TMDB_API_KEY
  const url = new URL(`${TMDB_BASE}/movie/${id}`)
  url.searchParams.set('api_key', apiKey)
  url.searchParams.set('language', language)
  const res = await fetch(url)
  if (!res.ok) return null
  const data = await res.json()
  return data.production_countries?.[0]?.name ?? null
}

export async function suggestMovies({
  genreId,
  decadeId,
  countryCode,
  subgenreId,
  excludeIds = new Set(),
  minVoteCount = 50,
  minVoteAverage = 0,
  voteCountMode = 'min',
  voteAverageMode = 'min',
  locale = 'fr',
}) {
  if (!import.meta.env.VITE_TMDB_API_KEY) {
    throw new Error(t('tmdb.missingKey'))
  }

  const language = TMDB_LANGUAGE[locale] || TMDB_LANGUAGE.fr
  const { gte, lte } = decadeRange(decadeId)
  const voteCountKey = voteCountMode === 'max' ? 'vote_count.lte' : 'vote_count.gte'
  const voteAverageKey = voteAverageMode === 'max' ? 'vote_average.lte' : 'vote_average.gte'
  const base = { with_genres: genreId, 'primary_release_date.gte': gte, 'primary_release_date.lte': lte }
  if (minVoteAverage > 0) base[voteAverageKey] = minVoteAverage

  let keywordId = null
  const keywordTerm = subgenreId ? SUBGENRE_KEYWORDS[subgenreId] : null
  if (keywordTerm) {
    keywordId = await findKeywordId(keywordTerm).catch(() => null)
  }

  // chaque palier liste les critères sacrifiés ("relaxed"), du plus strict au plus large
  const subgenreRelaxed = subgenreId ? ['subgenre'] : []
  const tiers = []
  if (keywordId) {
    tiers.push({ params: { ...base, with_origin_country: countryCode, with_keywords: keywordId, [voteCountKey]: minVoteCount }, relaxed: [] })
    tiers.push({ params: { ...base, with_origin_country: countryCode, with_keywords: keywordId }, relaxed: [] })
    tiers.push({ params: { ...base, with_keywords: keywordId }, relaxed: ['country'] })
  }
  tiers.push({ params: { ...base, with_origin_country: countryCode, [voteCountKey]: minVoteCount }, relaxed: subgenreRelaxed })
  tiers.push({ params: { ...base, with_origin_country: countryCode }, relaxed: subgenreRelaxed })
  tiers.push({ params: base, relaxed: [...subgenreRelaxed, 'country'] })
  tiers.push({ params: { with_genres: genreId }, relaxed: [...subgenreRelaxed, 'country', 'year'] })

  for (const tier of tiers) {
    const cleanParams = Object.fromEntries(Object.entries(tier.params).filter(([, v]) => v !== undefined))
    const page = 1 + Math.floor(Math.random() * 3)
    let data = await discover({ ...cleanParams, page: String(page) }, language)
    let pool = data.results || []
    if (pool.length < 5 && page !== 1) {
      data = await discover({ ...cleanParams, page: '1' }, language)
      pool = [...pool, ...(data.results || [])]
    }
    pool = [...new Map(pool.map((m) => [m.id, m])).values()]
    if (pool.length >= 1) {
      const unseen = pool.filter((m) => !excludeIds.has(m.id))
      const results = unseen.length ? unseen : pool // tout a déjà été vu : on accepte les répétitions plutôt que rien
      const movies = pickRandom(results, Math.min(3, results.length)).map((m) => ({
        id: m.id,
        title: m.title,
        year: m.release_date ? m.release_date.slice(0, 4) : '?',
        posterUrl: m.poster_path ? `https://image.tmdb.org/t/p/w342${m.poster_path}` : null,
        tmdbUrl: `https://www.themoviedb.org/movie/${m.id}`,
        letterboxdUrl: `https://letterboxd.com/tmdb/${m.id}/`,
        country: null,
      }))

      if (tier.relaxed.includes('country')) {
        await Promise.all(
          movies.map(async (m) => {
            m.country = await fetchProductionCountry(m.id, language).catch(() => null)
          }),
        )
      }

      return { movies, relaxed: tier.relaxed }
    }
  }

  return { movies: [], relaxed: [] }
}
