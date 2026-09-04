import express from 'express'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'

try {
  process.loadEnvFile()
} catch {
  // pas de .env (ex: variables déjà injectées par l'environnement de prod)
}

const TMDB_API_KEY = process.env.TMDB_API_KEY
const PORT = process.env.PORT || 3001
const TMDB_BASE = 'https://api.themoviedb.org/3'

// origines autorisées à appeler l'API : le site déployé (ALLOWED_ORIGIN) + les ports de dev habituels
const ALLOWED_ORIGINS = new Set(
  [process.env.ALLOWED_ORIGIN, 'http://localhost:5173', 'http://127.0.0.1:5173'].filter(Boolean),
)

if (!TMDB_API_KEY) {
  console.warn('[server] TMDB_API_KEY manquante : les appels TMDB échoueront. Copie .env.example en .env et renseigne la clé.')
}
if (!process.env.ALLOWED_ORIGIN) {
  console.warn('[server] ALLOWED_ORIGIN non défini : seules les origines de dev (localhost:5173) pourront appeler /api/tmdb en dehors du site lui-même une fois déployé.')
}

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const distDir = path.join(__dirname, '..', 'dist')
const visitsFile = path.join(__dirname, 'data', 'visits.json')

function readVisitCount() {
  try {
    return JSON.parse(fs.readFileSync(visitsFile, 'utf-8')).count || 0
  } catch {
    return 0
  }
}
function writeVisitCount(count) {
  fs.mkdirSync(path.dirname(visitsFile), { recursive: true })
  fs.writeFileSync(visitsFile, JSON.stringify({ count }))
}

const app = express()

// bloque les appels directs (curl, navigation brute...) : un vrai fetch() du front envoie
// Origin et/ou Referer correspondant au site ; ni curl ni une navigation brute ne les envoient
function requestOrigin(req) {
  if (req.headers.origin) return req.headers.origin
  try {
    return req.headers.referer ? new URL(req.headers.referer).origin : null
  } catch {
    return null
  }
}

app.use('/api/tmdb', (req, res, next) => {
  const origin = requestOrigin(req)
  if (origin && ALLOWED_ORIGINS.has(origin)) return next()
  res.status(403).json({ status_message: 'Origine non autorisée.' })
})

app.get('/api/visits', (req, res) => {
  res.json({ count: readVisitCount() })
})

app.post('/api/visits', (req, res) => {
  const origin = requestOrigin(req)
  if (!origin || !ALLOWED_ORIGINS.has(origin)) {
    res.status(403).json({ status_message: 'Origine non autorisée.' })
    return
  }
  const count = readVisitCount() + 1
  writeVisitCount(count)
  res.json({ count })
})

app.get('/visites', (req, res) => {
  res.sendFile(path.join(__dirname, 'visites.html'))
})

// chemin stable pour l'icône, utilisée par visites.html qui n'est pas servi par Vite
// (dans dist/, elle est hashée par le build, donc son chemin change à chaque build)
app.use('/icon', express.static(path.join(__dirname, '..', 'src', 'icon')))

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
