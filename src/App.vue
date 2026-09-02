<script setup>
import { reactive, ref, computed, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
import { suggestMovies } from './tmdb.js'
import { GENRES } from './data/genres.js'
import { COUNTRIES } from './data/countries.js'
import { DECADES } from './data/decades.js'
import { locale, t, joinList } from './i18n.js'

const creationYear = 2026

const CATEGORIES = [
  { key: 'genre', duration: 1100, fullList: GENRES.map((g) => g.tmdbId) },
  { key: 'year', duration: 1550, fullList: DECADES.map((d) => d.id), fullWeights: DECADES.map((d) => d.weight) },
  { key: 'country', duration: 2000, fullList: COUNTRIES.map((c) => c.iso), fullWeights: COUNTRIES.map((c) => c.weight) },
]

function categoryLabel(key) {
  return t(`category.${key}`)
}

function itemLabel(catKey, id) {
  if (id == null) return ''
  if (catKey === 'genre') return GENRES.find((g) => g.tmdbId === id)?.labels[locale.value] ?? ''
  if (catKey === 'year') return DECADES.find((d) => d.id === id)?.labels[locale.value] ?? ''
  if (catKey === 'country') return COUNTRIES.find((c) => c.iso === id)?.labels[locale.value] ?? ''
  return ''
}

function subgenreLabel(genreId, subId) {
  if (subId == null) return ''
  const genre = GENRES.find((g) => g.tmdbId === genreId)
  return genre?.subgenres.find((s) => s.id === subId)?.labels[locale.value] ?? ''
}

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
    CATEGORIES.map((c) => [c.key, { strip: [null], translate: 0, transitionMs: 0, spinning: false, started: false, landed: false }]),
  ),
)

const sub = reactive({ strip: [null], translate: 0, transitionMs: 0, spinning: false, started: false, landed: false })
const SUB_DURATION = 1300

const rolling = ref(false)
const rollingSub = ref(false)

const MUTED_KEY = 'movieRoulette.muted'
function loadMuted() {
  try {
    return localStorage.getItem(MUTED_KEY) === 'true'
  } catch {
    return false
  }
}
const muted = ref(loadMuted())
watch(muted, (value) => {
  try {
    localStorage.setItem(MUTED_KEY, String(value))
  } catch {
    // ignore
  }
})

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
  else if (showSettings.value) showSettings.value = false
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

  const currentItem = reel.strip[reel.strip.length - 1]
  const strip = [currentItem]
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
  sub.strip = [null]
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

function currentGenreId() {
  return reels.genre.strip[reels.genre.strip.length - 1]
}

function rollSub() {
  if (rollingSub.value || rolling.value || !reels.genre.started) return
  const genre = GENRES.find((g) => g.tmdbId === currentGenreId())
  const list = genre ? genre.subgenres.map((s) => s.id) : []
  if (!list.length) return
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

const showSettings = ref(false)

const FILTER_SETTINGS_KEY = 'movieRoulette.filterSettings'

function loadFilterSettings() {
  try {
    return JSON.parse(localStorage.getItem(FILTER_SETTINGS_KEY)) || {}
  } catch {
    return {}
  }
}

const savedFilterSettings = loadFilterSettings()

const minVoteCount = ref(savedFilterSettings.minVoteCount ?? 50)
const minVoteAverage = ref(savedFilterSettings.minVoteAverage ?? 0)
const voteCountMode = ref(savedFilterSettings.voteCountMode === 'max' ? 'max' : 'min')
const voteAverageMode = ref(savedFilterSettings.voteAverageMode === 'max' ? 'max' : 'min')

watch([minVoteCount, minVoteAverage, voteCountMode, voteAverageMode], () => {
  try {
    localStorage.setItem(
      FILTER_SETTINGS_KEY,
      JSON.stringify({
        minVoteCount: minVoteCount.value,
        minVoteAverage: minVoteAverage.value,
        voteCountMode: voteCountMode.value,
        voteAverageMode: voteAverageMode.value,
      }),
    )
  } catch {
    // ignore
  }
})

function toggleVoteCountMode() {
  voteCountMode.value = voteCountMode.value === 'min' ? 'max' : 'min'
}
function toggleVoteAverageMode() {
  voteAverageMode.value = voteAverageMode.value === 'min' ? 'max' : 'min'
}

const RELAXED_KEYS = { subgenre: 'relaxed.subgenre', country: 'relaxed.country', year: 'relaxed.year' }

async function fetchSuggestions() {
  if (loadingSuggestions.value || rolling.value || !reels.genre.started) return
  showModal.value = true
  loadingSuggestions.value = true
  suggestError.value = ''
  suggestions.value = []
  relaxedCriteria.value = []
  try {
    const { movies, relaxed } = await suggestMovies({
      genreId: reels.genre.strip[reels.genre.strip.length - 1],
      decadeId: reels.year.strip[reels.year.strip.length - 1],
      countryCode: reels.country.strip[reels.country.strip.length - 1],
      subgenreId: sub.started ? sub.strip[sub.strip.length - 1] : null,
      excludeIds: seenMovieIds,
      minVoteCount: minVoteCount.value,
      minVoteAverage: minVoteAverage.value,
      voteCountMode: voteCountMode.value,
      voteAverageMode: voteAverageMode.value,
      locale: locale.value,
    })
    suggestions.value = movies
    relaxedCriteria.value = relaxed
    movies.forEach((m) => seenMovieIds.add(m.id))
    if (suggestions.value.length === 0) suggestError.value = t('suggest.noResults')
  } catch (err) {
    suggestError.value = err.message || t('suggest.error')
  } finally {
    loadingSuggestions.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col relative overflow-x-hidden">
    <div class="absolute top-4 right-4 sm:top-6 sm:right-6 flex items-center gap-4">
      <button
        class="text-xs font-semibold tracking-widest uppercase text-muted hover:text-ink transition-colors"
        @click="muted = !muted"
        :title="muted ? t('sound.titleEnable') : t('sound.titleDisable')"
      >
        {{ muted ? t('sound.off') : t('sound.on') }}
      </button>
      <button
        class="text-xs font-semibold tracking-widest uppercase text-muted hover:text-ink transition-colors"
        @click="showSettings = true"
      >
        {{ t('settings.button') }}
      </button>
    </div>

    <div class="flex-1 flex flex-col items-center justify-center gap-10 sm:gap-16 px-4 sm:px-6 py-10 sm:py-16">
    <!-- mesure la hauteur réelle des cases pour aligner le défilement des rouleaux -->
    <div ref="probeRef" class="w-52 h-52 sm:w-64 sm:h-64 absolute opacity-0 pointer-events-none -z-10 border border-line rounded-lg bg-panel" aria-hidden="true"></div>
    <div ref="subProbeRef" class="w-full max-w-72 h-16 sm:max-w-96 sm:h-20 absolute opacity-0 pointer-events-none -z-10 border border-line rounded-lg bg-panel" aria-hidden="true"></div>

    <div class="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none text-center">
      <div class="w-full max-w-[22rem] h-px bg-line mx-auto"></div>
      <h1 class="font-display font-semibold tracking-tight text-3xl sm:text-5xl">Movie Roulette</h1>
      <p class="text-muted tracking-[0.24em] uppercase text-[0.7rem]">{{ t('tagline') }}</p>
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
          {{ categoryLabel(cat.key) }}<template v-if="excluded[cat.key].size"> · {{ cat.fullList.length - excluded[cat.key].size }}</template>
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
                <span class="text-2xl sm:text-3xl font-semibold text-center">{{ itemLabel(cat.key, item) }}</span>
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
          {{ locked[cat.key] ? t('lock.locked') : t('lock.lock') }}
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
        {{ rolling ? t('rolling') : t('roll') }}
      </button>

      <button
        v-if="reels.genre.started && !rolling"
        key="subgenre"
        class="font-semibold tracking-[0.08em] uppercase bg-transparent text-accent border border-accent transition duration-150 hover:bg-accent hover:text-accent-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-8 py-3 text-sm w-full max-w-72 sm:w-auto"
        :disabled="rollingSub"
        @click="rollSub"
      >
        {{ rollingSub ? t('rolling') : sub.started ? t('subgenre.reroll') : t('subgenre.roll') }}
      </button>

      <button
        v-if="reels.genre.started && !rolling"
        key="suggest"
        class="font-semibold tracking-[0.08em] uppercase bg-transparent text-accent border border-accent transition duration-150 hover:bg-accent hover:text-accent-ink hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.96] disabled:opacity-50 disabled:cursor-not-allowed rounded-md px-8 py-3 text-sm w-full max-w-72 sm:w-auto"
        :disabled="loadingSuggestions"
        @click="fetchSuggestions"
      >
        {{ loadingSuggestions ? t('suggest.loading') : t('suggest.button') }}
      </button>
    </TransitionGroup>

    <div v-if="sub.started" class="flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none">
      <span class="font-semibold tracking-[0.16em] uppercase text-[0.7rem] text-muted">{{ t('subgenre.label') }}</span>
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
              <span class="text-lg sm:text-xl font-semibold text-center">{{ subgenreLabel(currentGenreId(), item) }}</span>
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
            <button class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors text-base" @click="showModal = false" :aria-label="t('close')">✕</button>
            <h2 class="font-display font-semibold text-xl text-center mb-5">{{ t('modal.title') }}</h2>
            <p v-if="loadingSuggestions" class="text-center text-muted py-4">{{ t('suggest.loading') }}</p>
            <p v-else-if="suggestError" class="text-center text-accent py-4">{{ suggestError }}</p>
            <template v-else>
              <p v-if="relaxedCriteria.length" class="text-center text-muted text-[0.8rem] italic mb-4">
                {{ t('suggest.relaxedIntro', { list: joinList(relaxedCriteria.map((c) => t(RELAXED_KEYS[c]))) }) }}
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
                  {{ t('suggest.other') }}
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
            <button class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors text-base" @click="closeFilter" :aria-label="t('close')">✕</button>
            <h2 class="font-display font-semibold text-xl text-center mb-1">{{ t('filter.title', { label: categoryLabel(activeCategory.key) }) }}</h2>
            <p class="text-center text-muted text-xs mb-4">
              {{ t('filter.selected', { count: activeCategory.fullList.length - excluded[filterKey].size, total: activeCategory.fullList.length }) }}
              <button v-if="excluded[filterKey].size" type="button" class="text-accent hover:underline ml-2" @click="excluded[filterKey].clear()">{{ t('filter.checkAll') }}</button>
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
                <span class="truncate">{{ itemLabel(filterKey, item) }}</span>
              </label>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <Teleport to="body">
      <Transition name="modal">
        <div v-if="showSettings" class="fixed inset-0 bg-ink/55 flex items-center justify-center p-6 z-50" @click.self="showSettings = false">
          <div class="modal-panel relative bg-bg border border-line rounded-xl pt-8 px-6 pb-6 max-w-sm w-full max-h-[85vh] overflow-y-auto shadow-[0_20px_60px_rgba(0,0,0,0.25)]">
            <button class="absolute top-3 right-3 w-8 h-8 flex items-center justify-center text-muted hover:text-ink transition-colors text-base" @click="showSettings = false" :aria-label="t('close')">✕</button>
            <h2 class="font-display font-semibold text-xl text-center mb-6">{{ t('settings.title') }}</h2>

            <div class="flex flex-col gap-6">
              <div>
                <div class="flex items-baseline justify-between mb-1">
                  <span class="text-sm font-semibold">{{ t('settings.language') }}</span>
                </div>
                <div class="flex gap-2">
                  <button
                    type="button"
                    class="flex-1 text-sm font-semibold rounded-md border px-3 py-2 transition-colors"
                    :class="locale === 'fr' ? 'bg-accent text-accent-ink border-accent' : 'text-muted border-line hover:text-ink'"
                    @click="locale = 'fr'"
                  >
                    {{ t('lang.fr') }}
                  </button>
                  <button
                    type="button"
                    class="flex-1 text-sm font-semibold rounded-md border px-3 py-2 transition-colors"
                    :class="locale === 'en' ? 'bg-accent text-accent-ink border-accent' : 'text-muted border-line hover:text-ink'"
                    @click="locale = 'en'"
                  >
                    {{ t('lang.en') }}
                  </button>
                </div>
                <p class="text-muted text-[0.7rem] mt-1">{{ t('settings.languageDesc') }}</p>
              </div>

              <div>
                <div class="flex items-baseline justify-between mb-1">
                  <span class="flex items-center gap-1.5 text-sm font-semibold">
                    {{ voteCountMode === 'max' ? t('settings.maxPopularity') : t('settings.minPopularity') }}
                    <button
                      type="button"
                      class="text-muted hover:text-accent transition-colors"
                      :title="voteCountMode === 'min' ? t('settings.toggleMax') : t('settings.toggleMin')"
                      @click="toggleVoteCountMode"
                    >
                      <svg
                        class="w-4 h-4 transition-transform duration-300"
                        :class="voteCountMode === 'max' && 'rotate-180'"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </button>
                  </span>
                  <span class="text-muted text-xs">{{ t('settings.votes', { count: minVoteCount }) }}</span>
                </div>
                <input type="range" min="0" max="500" step="10" v-model.number="minVoteCount" class="w-full accent-accent" />
                <p class="text-muted text-[0.7rem] mt-1">{{ voteCountMode === 'max' ? t('settings.maxPopularityDesc') : t('settings.minPopularityDesc') }}</p>
              </div>

              <div>
                <div class="flex items-baseline justify-between mb-1">
                  <span class="flex items-center gap-1.5 text-sm font-semibold">
                    {{ voteAverageMode === 'max' ? t('settings.maxRating') : t('settings.minRating') }}
                    <button
                      type="button"
                      class="text-muted hover:text-accent transition-colors"
                      :title="voteAverageMode === 'min' ? t('settings.toggleMax') : t('settings.toggleMin')"
                      @click="toggleVoteAverageMode"
                    >
                      <svg
                        class="w-4 h-4 transition-transform duration-300"
                        :class="voteAverageMode === 'max' && 'rotate-180'"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      >
                        <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                        <path d="M3 3v5h5" />
                        <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                        <path d="M16 16h5v5" />
                      </svg>
                    </button>
                  </span>
                  <span class="text-muted text-xs">{{ minVoteAverage > 0 ? `${minVoteAverage}/10` : t('settings.none') }}</span>
                </div>
                <input type="range" min="0" max="10" step="0.5" v-model.number="minVoteAverage" class="w-full accent-accent" />
                <p class="text-muted text-[0.7rem] mt-1">{{ voteAverageMode === 'max' ? t('settings.maxRatingDesc') : t('settings.minRatingDesc') }}</p>
              </div>

              <button
                type="button"
                class="text-accent hover:underline text-xs self-center"
                @click="minVoteCount = 50; minVoteAverage = 0; voteCountMode = 'min'; voteAverageMode = 'min'"
              >
                {{ t('settings.reset') }}
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <footer class="w-full max-w-xs sm:max-w-none mx-auto flex flex-col items-center gap-2 text-center px-4 sm:px-6 pt-4 pb-6 sm:pb-8">
      <div class="w-full max-w-[22rem] h-px bg-line mx-auto"></div>
      <p class="text-muted text-xs">© {{ creationYear }} tristankule</p>
      <p class="text-muted text-[0.65rem] max-w-xs">
        {{ t('footer.disclaimer') }}
      </p>
      <a
        href="https://github.com/MaegIins/movieRoulette"
        target="_blank"
        rel="noopener noreferrer"
        class="text-accent hover:underline text-xs"
      >
        {{ t('footer.source') }}
      </a>
    </footer>
  </div>
</template>
