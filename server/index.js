import express from 'express'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

try {
  process.loadEnvFile()
} catch {
  // pas de .env (ex: variables déjà injectées par l'environnement de prod)
}

const TMDB_API_KEY = process.env.TMDB_API_KEY
const PORT = process.env.PORT || 3001
const TMDB_BASE = 'https://api.themoviedb.org/3'

if (!TMDB_API_KEY) {
  console.warn('[server] TMDB_API_KEY manquante : les appels TMDB échoueront. Copie .env.example en .env et renseigne la clé.')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')

const app = express()

// proxie TMDB en n'exposant jamais la clé API au client : elle est injectée ici, côté serveur
async function proxyTmdb(res, pathname, extraParams) {
  if (!TMDB_API_KEY) {
    res.status(500).json({ status_message: 'TMDB_API_KEY manquante côté serveur : copie .env.example en .env et renseigne la clé.' })
    return
  }
  const url = new URL(`${TMDB_BASE}${pathname}`)
  url.searchParams.set('api_key', TMDB_API_KEY)
  Object.entries(extraParams).forEach(([key, value]) => {
    if (value !== undefined) url.searchParams.set(key, String(value))
  })
  try {
    const tmdbRes = await fetch(url)
    const body = await tmdbRes.json().catch(() => ({}))
    res.status(tmdbRes.status).json(body)
  } catch {
    res.status(502).json({ status_message: 'Impossible de joindre TMDB.' })
  }
}

app.get('/api/tmdb/discover', (req, res) => {
  const { language, page, ...filters } = req.query
  proxyTmdb(res, '/discover/movie', {
    ...filters,
    language,
    page,
    include_adult: 'false',
    sort_by: 'popularity.desc',
  })
})

app.get('/api/tmdb/keyword', (req, res) => {
  proxyTmdb(res, '/search/keyword', { query: req.query.query })
})

app.get('/api/tmdb/movie/:id', (req, res) => {
  proxyTmdb(res, `/movie/${encodeURIComponent(req.params.id)}`, { language: req.query.language })
})

// sert le build du front (npm run build) pour un déploiement en un seul process
app.use(express.static(distDir))

app.listen(PORT, () => {
  console.log(`[server] écoute sur http://localhost:${PORT}`)
})
