<script setup>
import { reactive, ref, computed, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { suggestMovies } from './tmdb.js'
import { GENRES } from './data/genres.js'
import { COUNTRIES } from './data/countries.js'
import { DECADES } from './data/decades.js'

const creationYear = 2026

const CATEGORIES = [
  { key: 'genre', label: 'Genre', duration: 1100, fullList: GENRES.map((g) => g.label) },
  { key: 'year', label: 'Année', duration: 1550, fullList: DECADES.map((d) => d.label), fullWeights: DECADES.map((d) => d.weight) },
  { key: 'country', label: 'Pays', duration: 2000, fullList: COUNTRIES.map((c) => c.label), fullWeights: COUNTRIES.map((c) => c.weight) },
]

const excluded = reactive({ genre: new Set(), year: new Set(), country: new Set() })
const filterKey = ref(null)
const activeCategory = computed(() => CATEGORIES.find((c) => c.key === filterKey.value))

function openFilter(key) {
  filterKey.value = key
}
function closeFilter() {
  filterKey.value = null
}
function toggleExclude(key, item, event) {
  const set = excluded[key]
  if (set.has(item)) {
    set.delete(item)
    return
  }
  const cat = CATEGORIES.find((c) => c.key === key)
  if (cat.fullList.length - set.size <= 1) {
    // rien ne change côté état réactif ici, donc Vue ne remettra pas la checkbox
    // cochée toute seule : on force la case native à revenir en arrière
    if (event) event.target.checked = true
    return
  }
  set.add(item)
}
function effectivePool(cat) {
  const ex = excluded[cat.key]
  if (!ex.size) return { list: cat.fullList, weights: cat.fullWeights }
  const list = []
  const weights = cat.fullWeights ? [] : undefined
  cat.fullList.forEach((item, i) => {
    if (ex.has(item)) return
    list.push(item)
    if (weights) weights.push(cat.fullWeights[i])
  })
  return { list, weights }
}

const locked = reactive({ genre: false, year: false, country: false })
const allLocked = computed(() => CATEGORIES.every((c) => locked[c.key]))
function toggleLock(key) {
  locked[key] = !locked[key]
}

const reels = reactive(
  Object.fromEntries(
    CATEGORIES.map((c) => [c.key, { strip: [c.label], translate: 0, transitionMs: 0, spinning: false, started: false, landed: false }]),
  ),
)

const sub = reactive({ strip: ['Sous-genre'], translate: 0, transitionMs: 0, spinning: false, started: false, landed: false })
const SUB_DURATION = 1300

const rolling = ref(false)
const rollingSub = ref(false)
const muted = ref(false)
const cellHeight = ref(208)
const subCellHeight = ref(64)
const probeRef = ref(null)
const subProbeRef = ref(null)

function updateCellHeight() {
  if (probeRef.value) cellHeight.value = probeRef.value.offsetHeight
  if (subProbeRef.value) subCellHeight.value = subProbeRef.value.offsetHeight
}

function onKeydown(e) {
  if (e.key !== 'Escape') return
  if (filterKey.value) filterKey.value = null
  else if (showModal.value) showModal.value = false
}

onMounted(() => {
  updateCellHeight()
  window.addEventListener('resize', updateCellHeight)
  window.addEventListener('keydown', onKeydown)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCellHeight)
  window.removeEventListener('keydown', onKeydown)
  if (tickInterval) clearInterval(tickInterval)
})

let audioCtx = null
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)()
  return audioCtx
}
function beep({ freq, type = 'sine', duration = 0.08, gain = 0.06, delay = 0 }) {
  if (muted.value) return
  const ctx = getCtx()
  const start = ctx.currentTime + delay
  const osc = ctx.createOscillator()
  const g = ctx.createGain()
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  g.gain.setValueAtTime(0.0001, start)
  g.gain.exponentialRampToValueAtTime(gain, start + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(g).connect(ctx.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}
function playTick() {
  beep({ freq: 950, type: 'square', duration: 0.045, gain: 0.045 })
}
function playThunk() {
  beep({ freq: 160, type: 'triangle', duration: 0.12, gain: 0.09 })
}
function playLand() {
  beep({ freq: 520, type: 'triangle', duration: 0.15, gain: 0.08 })
}
function playChime() {
  ;[523.25, 659.25, 783.99, 1046.5].forEach((freq, i) =>
    beep({ freq, type: 'triangle', duration: 0.4, gain: 0.07, delay: i * 0.09 }),
  )
}

let tickInterval = null
function startTicking() {
  if (tickInterval) return
  tickInterval = setInterval(() => {
    if (Object.values(reels).some((r) => r.spinning) || sub.spinning) playTick()
  }, 90)
}
function stopTicking() {
  if (tickInterval) {
    clearInterval(tickInterval)
    tickInterval = null
  }
}

// pondère le tirage sans jamais exclure une option
function weightedIndex(weights) {
  const total = weights.reduce((sum, w) => sum + w, 0)
  let r = Math.random() * total
  for (let i = 0; i < weights.length; i++) {
    r -= weights[i]
    if (r <= 0) return i
  }
  return weights.length - 1
}

function spinReel(reel, list, durationMs, heightPx, onDone, weights) {
  reel.started = true
  reel.spinning = true

  const loops = 3 + Math.floor(Math.random() * 2)
  const targetIndex = weights ? weightedIndex(weights) : Math.floor(Math.random() * list.length)
  const extra = (targetIndex + 1) % list.length
  const totalSteps = loops * list.length + extra

  const currentLabel = reel.strip[reel.strip.length - 1]
  const strip = [currentLabel]
  for (let k = 1; k <= totalSteps; k++) strip.push(list[(k - 1) % list.length])

  reel.transitionMs = 0
  reel.translate = 0
  reel.strip = strip

  nextTick(() => {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        reel.transitionMs = durationMs
        reel.translate = -(strip.length - 1) * heightPx
      })
    })
  })

  setTimeout(() => {
    reel.spinning = false
    reel.landed = true
    playLand()
    setTimeout(() => {
      reel.landed = false
    }, 350)
    onDone?.()
  }, durationMs + 20)
}

function checkAllDone() {
  const allDone = Object.values(reels).every((r) => !r.spinning)
  if (allDone && rolling.value) {
    rolling.value = false
    stopTicking()
    playChime()
  }
}

function roll() {
  if (rolling.value || allLocked.value) return
  rolling.value = true
  updateCellHeight()
  sub.started = false
  sub.strip = ['Sous-genre']
  sub.translate = 0
  sub.transitionMs = 0
  rollingSub.value = false
  suggestions.value = []
  suggestError.value = ''
  showModal.value = false
  seenMovieIds = new Set()
  playThunk()
  startTicking()
  CATEGORIES.forEach((c) => {
    if (locked[c.key]) return
    const { list, weights } = effectivePool(c)
    spinReel(reels[c.key], list, c.duration, cellHeight.value, checkAllDone, weights)
  })
}

function currentGenre() {
  return reels.genre.strip[reels.genre.strip.length - 1]
}

function rollSub() {
  if (rollingSub.value || rolling.value || !reels.genre.started) return
  const list = GENRES.find((g) => g.label === currentGenre())?.subgenres.map((s) => s.label) || ['Classique']
  rollingSub.value = true
  updateCellHeight()
  playThunk()
  startTicking()
  spinReel(sub, list, SUB_DURATION, subCellHeight.value, () => {
    rollingSub.value = false
    stopTicking()
    playChime()
  })
}

const suggestions = ref([])
const loadingSuggestions = ref(false)
const suggestError = ref('')
const relaxedCriteria = ref([])
const showModal = ref(false)
let seenMovieIds = new Set()

const RELAXED_LABELS = { subgenre: 'le sous-genre', country: 'le pays', year: 'la décennie' }

function joinFr(items) {
  if (items.length <= 1) return items.join('')
  return `${items.slice(0, -1).join(', ')} et ${items[items.length - 1]}`
}

async function fetchSuggestions() {
  if (loadingSuggestions.value || rolling.value || !reels.genre.started) return
  showModal.value = true
  loadingSuggestions.value = true
  suggestError.value = ''
  suggestions.value = []
  relaxedCriteria.value = []
  try {
    const { movies, relaxed } = await suggestMovies({
      genre: reels.genre.strip[reels.genre.strip.length - 1],
      year: reels.year.strip[reels.year.strip.length - 1],
      country: reels.country.strip[reels.country.strip.length - 1],
      subgenre: sub.started ? sub.strip[sub.strip.length - 1] : null,
      excludeIds: seenMovieIds,
    })
    suggestions.value = movies
    relaxedCriteria.value = relaxed
    movies.forEach((m) => seenMovieIds.add(m.id))
    if (suggestions.value.length === 0) suggestError.value = 'Aucun film trouvé pour cette combinaison.'
  } catch (err) {
    suggestError.value = err.message || 'Erreur lors de la recherche.'
  } finally {
    loadingSuggestions.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col relative overflow-x-hidden">
    <button
      class="absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-semibold tracking-widest uppercase text-muted hover:text-ink transition-colors"
      @click="muted = !muted"
      :title="muted ? 'Activer le son' : 'Couper le son'"
    >
      {{ muted ? 'Son coupé' : 'Son actif' }}
    </button>

    <div class="flex-1 flex flex-col items-center justify-center gap-10 sm:gap-16 px-4 sm:px-6 py-10 sm:py-16">
    <!-- mesure la hauteur réelle des cases pour aligner le défilement des rouleaux -->
    <div ref="probeRef" class="w-52 h-52 sm:w-64 sm:h-64 absolute opacity-0 pointer-events-none -z-10 border border-line rounded-lg bg-panel" aria-hidden="true"></div>
    <div ref="subProbeRef" class="w-full max-w-72 h-16 sm:max-w-96 sm:h-20 absolute opacity-0 pointer-events-none -z-10 border border-line rounded-lg bg-panel" aria-hidden="true"></div>

    <div class="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none text-center">
      <div class="w-full max-w-[22rem] h-px bg-line mx-auto"></div>
      <h1 class="font-display font-semibold tracking-tight text-3xl sm:text-5xl">Movie Roulette</h1>
      <p class="text-muted tracking-[0.24em] uppercase text-[0.7rem]">Trouve quoi regarder</p>
      <div class="w-full max-w-[22rem] h-px bg-line mx-auto"></div>
    </div>

    <div class="flex flex-col sm:flex-row flex-wrap items-center sm:items-start justify-center gap-8 sm:gap-10">
      <div v-for="cat in CATEGORIES" :key="cat.key" class="flex flex-col items-center gap-3">
        <button
          type="button"
          class="font-semibold tracking-[0.16em] uppercase text-[0.7rem] px-2 py-1 -mx-2 -my-1 transition-colors"
          :class="excluded[cat.key].size ? 'text-accent' : 'text-muted hover:text-ink'"
          @click="openFilter(cat.key)"
        >
          {{ cat.label }}<template v-if="excluded[cat.key].size"> · {{ cat.fullList.length - excluded[cat.key].size }}</template>
        </button>
        <div
          class="w-52 h-52 sm:w-64 sm:h-64 border rounded-lg bg-panel transition-colors duration-300"
          :class="[reels[cat.key].spinning ? 'border-accent' : 'border-line', reels[cat.key].landed && 'animate-pop']"
        >
          <div v-if="!reels[cat.key].started" class="w-full h-full flex items-center justify-center">
            <span class="text-2xl sm:text-3xl font-medium text-muted">—</span>
          </div>
          <div v-else class="overflow-hidden h-full rounded-md">
            <div
              class="flex flex-col"
              :style="{
                transform: `translateY(${reels[cat.key].translate}px)`,
                transitionProperty: 'transform',
                transitionDuration: `${reels[cat.key].transitionMs}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }"
            >
              <div v-for="(item, i) in reels[cat.key].strip" :key="i" class="flex items-center justify-center shrink-0 text-center px-3" :style="{ height: `${cellHeight}px` }">
                <span class="text-2xl sm:text-3xl font-semibold text-center">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
        <button
          type="button"
          class="text-[0.65rem] font-semibold tracking-[0.1em] uppercase transition-colors"
          :class="[
            reels[cat.key].started ? 'opacity-100' : 'opacity-0 pointer-events-none',
            locked[cat.key] ? 'text-accent' : 'text-muted hover:text-ink',
          ]"
          :disabled="rolling"
          @click="toggleLock(cat.key)"
        >
          {{ locked[cat.key] ? 'Verrouillé' : 'Verrouiller' }}
        </button>
      </div>
    </div>

    <TransitionGroup
      tag="div"
      name="btn-row"
      class="flex flex-col sm:flex-row flex-wrap items-center justify-center gap-4 w-full max-w-xs sm:max-w-none sm:w-auto"
    >
      <button
        key="roll"
        class="font-semibold tracking-[0.08em] uppercase bg-accent text-accent-ink border border-accent transition duration-150 hover:bg-accent-hover hover:border-accent-hover hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-10 sm:px-14 py-4 sm:py-5 text-base sm:text-lg w-full max-w-xs sm:w-auto"
        :disabled="rolling || allLocked"
        @click="roll"
      >
        {{ rolling ? 'En cours…' : 'Lancer' }}
      </button>

      <button
        v-if="reels.genre.started && !rolling"
        key="subgenre"
        class="font-semibold tracking-[0.08em] uppercase bg-transparent text-accent border border-accent transition duration-150 hover:bg-accent hover:text-accent-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-8 py-3 text-sm w-full max-w-72 sm:w-auto"
        :disabled="rollingSub"
        @click="rollSub"
      >
        {{ rollingSub ? 'En cours…' : sub.started ? 'Relancer le sous-genre' : 'Sous-genre' }}
      </button>

      <button
        v-if="reels.genre.started && !rolling"
        key="suggest"
        class="font-semibold tracking-[0.08em] uppercase bg-transparent text-accent border border-accent transition duration-150 hover:bg-accent hover:text-accent-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-8 py-3 text-sm w-full max-w-72 sm:w-auto"
        :disabled="loadingSuggestions"
        @click="fetchSuggestions"
      >
        {{ loadingSuggestions ? 'Recherche…' : 'Proposer 3 films' }}
      </button>
    </TransitionGroup>

    <div v-if="sub.started" class="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none">
      <span class="font-semibold tracking-[0.16em] uppercase text-[0.7rem] text-muted">Sous-genre</span>
      <div
        class="w-full max-w-72 h-16 sm:max-w-96 sm:h-20 border rounded-lg bg-panel transition-colors duration-300"
        :class="[sub.spinning ? 'border-accent' : 'border-line', sub.landed && 'animate-pop']"
      >
        <div class="overflow-hidden h-full rounded-md">
          <div
            class="flex flex-col"
            :style="{
              transform: `translateY(${sub.translate}px)`,
              transitionProperty: 'transform',
              transitionDuration: `${sub.transitionMs}ms`,
              transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
            }"
          >
            <div v-for="(item, i) in sub.strip" :key="i" class="flex items-center justify-center shrink-0 text-center px-3" :style="{ height: `${subCellHeight}px` }">
              <span class="text-lg sm:text-xl font-semibold text-center">{{ item }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    </div>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showModal" class="fixed inset-0 bg-ink/55 flex items-center justify-center p-6 z-50" @click.self="showModal = false">
          <div class="modal-panel relative bg-bg border border-line rounded-xl pt-8 px-6 pb-6 max-w-lg w-full max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <button class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors text-base" @click="showModal = false" aria-label="Fermer">✕</button>
            <h2 class="font-display font-semibold text-xl text-center mb-5">Suggestions</h2>
            <p v-if="loadingSuggestions" class="text-center text-muted py-4">Recherche…</p>
            <p v-else-if="suggestError" class="text-center text-accent py-4">{{ suggestError }}</p>
            <template v-else>
              <p v-if="relaxedCriteria.length" class="text-center text-muted text-[0.8rem] italic mb-4">
                Pour trouver des résultats, la recherche a été élargie sur : {{ joinFr(relaxedCriteria.map((c) => RELAXED_LABELS[c])) }}.
              </p>
              <div class="flex flex-wrap justify-center gap-4">
                <div
                  v-for="(m, i) in suggestions"
                  :key="m.id"
                  class="w-40 border border-line rounded-lg bg-panel overflow-hidden animate-fade-up"
                  :style="{ animationDelay: `${i * 80}ms` }"
                >
                  <a :href="m.tmdbUrl" target="_blank" rel="noopener noreferrer">
                    <img v-if="m.posterUrl" :src="m.posterUrl" :alt="m.title" class="w-full aspect-[2/3] object-cover block bg-line transition-opacity hover:opacity-85" />
                    <div v-else class="w-full aspect-[2/3] flex items-center justify-center bg-line text-muted transition-opacity hover:opacity-85">—</div>
                  </a>
                  <div class="p-3">
                    <p class="font-display font-semibold text-[0.95rem] leading-tight">{{ m.title }}</p>
                    <p class="text-muted text-xs mt-1">{{ m.year }}<template v-if="m.country"> · {{ m.country }}</template></p>
                    <p class="mt-[0.4rem] text-[0.7rem]">
                      <a :href="m.tmdbUrl" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">TMDB</a>
                      <span class="text-muted" aria-hidden="true"> · </span>
                      <a :href="m.letterboxdUrl" target="_blank" rel="noopener noreferrer" class="text-accent hover:underline">Letterboxd</a>
                    </p>
                  </div>
                </div>
              </div>
              <div class="flex justify-center mt-5">
                <button
                  class="font-semibold tracking-[0.08em] uppercase bg-transparent text-accent border border-accent transition duration-150 hover:bg-accent hover:text-accent-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-6 py-2 text-xs"
                  :disabled="loadingSuggestions"
                  @click="fetchSuggestions"
                >
                  Autres films
                </button>
              </div>
            </template>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="filterKey" class="fixed inset-0 bg-ink/55 flex items-center justify-center p-6 z-50" @click.self="closeFilter">
          <div class="modal-panel relative bg-bg border border-line rounded-xl pt-8 px-6 pb-6 max-w-md w-full max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <button class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors text-base" @click="closeFilter" aria-label="Fermer">✕</button>
            <h2 class="font-display font-semibold text-xl text-center mb-1">Filtrer : {{ activeCategory.label }}</h2>
            <p class="text-center text-muted text-xs mb-4">
              {{ activeCategory.fullList.length - excluded[filterKey].size }} / {{ activeCategory.fullList.length }} sélectionnés
              <button v-if="excluded[filterKey].size" type="button" class="text-accent hover:underline ml-2" @click="excluded[filterKey].clear()">Tout cocher</button>
            </p>
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-x-3 gap-y-1">
              <label
                v-for="item in activeCategory.fullList"
                :key="item"
                class="flex items-center gap-1.5 py-1 px-1.5 rounded cursor-pointer hover:bg-panel text-sm"
              >
                <input
                  type="checkbox"
                  class="accent-accent shrink-0"
                  :checked="!excluded[filterKey].has(item)"
                  @change="toggleExclude(filterKey, item, $event)"
                />
                <span class="truncate">{{ item }}</span>
              </label>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <footer class="w-full max-w-xs sm:max-w-none mx-auto flex flex-col items-center gap-2 text-center px-4 sm:px-6 pt-4 pb-6 sm:pb-8">
      <div class="w-full max-w-[22rem] h-px bg-line mx-auto"></div>
      <p class="text-muted text-xs">© {{ creationYear }} tristankule</p>
      <p class="text-muted text-[0.65rem] max-w-xs">
        Ce produit utilise l'API TMDB mais n'est ni approuvé ni certifié par TMDB.
      </p>
      <a
        href="https://github.com/MaegIins/movieRoulette"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent hover:underline text-xs"
      >
        Code source
      </a>
    </footer>
  </div>
</template>
