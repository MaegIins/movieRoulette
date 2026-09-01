<script setup>
import { reactive, ref, onMounted, onBeforeUnmount, nextTick } from 'vue'

const CATEGORIES = [
  {
    key: 'genre',
    label: 'Genre',
    duration: 1100,
    list: [
      'Action', 'Aventure', 'Animation', 'Comédie', 'Policier', 'Documentaire', 'Drame', 'Familial',
      'Fantastique', 'Histoire', 'Horreur', 'Musique', 'Mystère', 'Romance', 'Science-fiction',
      'Thriller', 'Téléfilm', 'Guerre', 'Western',
    ],
  },
  { key: 'year', label: 'Année', duration: 1550, list: ['1980s', '1990s', '2000s', '2010s', '2020s'] },
  {
    key: 'country',
    label: 'Pays',
    duration: 2000,
    list: [
      'États-Unis', 'Royaume-Uni', 'France', 'Allemagne', 'Italie', 'Espagne', 'Japon', 'Corée du Sud', 'Chine',
      'Hong Kong', 'Taïwan', 'Inde', 'Canada', 'Mexique', 'Brésil', 'Argentine', 'Chili',
      'Colombie', 'Australie', 'Nouvelle-Zélande', 'Russie', 'Pologne', 'Suède', 'Norvège', 'Danemark',
      'Finlande', 'Pays-Bas', 'Belgique', 'Suisse', 'Autriche', 'Irlande', 'Portugal',
      'Grèce', 'Turquie', 'Iran', 'Israël', 'Égypte', 'Afrique du Sud', 'Nigeria', 'Thaïlande',
      'Philippines', 'Indonésie', 'Vietnam', 'Malaisie', 'Singapour', 'Pakistan',
      'République tchèque', 'Hongrie', 'Roumanie', 'Ukraine', 'Serbie', 'Croatie', 'Islande',
    ],
  },
]

const SUBGENRES = {
  Action: [
    'Arts martiaux', 'Espionnage', 'Braquage', 'Super-héros', 'Buddy movie', 'Guerre urbaine',
    'Cascades extrêmes', 'Vengeance', 'Course-poursuite', 'Un contre tous', 'Militaire',
  ],
  Aventure: [
    'Exploration', 'Pirates', 'Survie', 'Quête', 'Road trip', 'Chasse au trésor',
    'Jungle', 'Expédition', 'Voyage initiatique', 'Monde perdu', 'Île déserte',
  ],
  Animation: [
    'Stop-motion', 'Anime', 'Jeunesse', 'Fable', 'Adulte', 'Conte',
    'Super-héros animé', 'Musical animé', 'Science-fiction animée', 'Aventure animée', 'Buddy animé',
  ],
  Comédie: [
    'Comédie romantique', 'Comédie noire', 'Parodie', 'Comédie musicale', 'Buddy comedy', 'Satire',
    'Comédie potache', 'Screwball', 'Mockumentaire', 'Comédie de mœurs', 'Comédie familiale',
  ],
  Policier: [
    'Polar', 'Braquage', 'Enquête', 'Film noir', 'Gangster', 'Corruption',
    'Serial killer', 'Thriller judiciaire', 'Cavale', 'Infiltration', 'Crime organisé',
  ],
  Documentaire: [
    'Nature', 'Vrai crime', 'Sport', 'Biographie', 'Société', 'Musical',
    'Guerre', 'Politique', 'Portrait intime', 'Investigation', 'Environnement',
  ],
  Drame: [
    'Drame social', 'Coming-of-age', 'Drame familial', 'Drame judiciaire', 'Drame historique', 'Mélodrame',
    'Drame psychologique', 'Rédemption', 'Huis clos', 'Chronique intime', 'Maladie',
  ],
  Familial: [
    'Conte de fées', 'Aventure jeunesse', 'Animaux', 'Magie', 'Amitié', 'Fête',
    'Apprentissage', 'Fantaisie douce', 'Vacances', 'Famille recomposée', 'École',
  ],
  Fantastique: [
    'Sorcellerie', 'Créatures', 'Monde parallèle', 'Conte gothique', 'Épopée fantastique', 'Magie urbaine',
    'Créatures légendaires', 'Malédiction', 'Portail magique', 'Héros élu', 'Mythologie',
  ],
  Histoire: [
    'Biopic', 'Guerre historique', 'Époque médiévale', 'Antiquité', 'Révolution', 'Reconstitution',
    'Épopée royale', 'Colonisation', 'Renaissance', 'Guerre froide', 'Cour royale',
  ],
  Horreur: [
    'Slasher', 'Épouvante surnaturelle', 'Found footage', 'Zombies', 'Horreur psychologique', 'Body horror',
    'Maison hantée', 'Possession', 'Horreur folklorique', 'Survie horrifique', 'Créature horrifique', 'Horreur cosmique',
  ],
  Musique: [
    'Comédie musicale', 'Biopic musical', 'Concert', 'Opéra rock', 'Jukebox musical', 'Musique du monde',
    'Battle musical', 'Formation de groupe', 'Comeback', 'Musique classique',
  ],
  Mystère: [
    'Whodunit', 'Complot', 'Enquête', 'Suspense', 'Thriller psychologique', 'Détective',
    'Disparition', 'Secret de famille', 'Mystère surnaturel', 'Enquête journalistique',
  ],
  Romance: [
    'Comédie romantique', 'Romance dramatique', 'Romance historique', 'Amour impossible', 'Triangle amoureux', 'Romance d’été',
    'Amour interdit', 'Retrouvailles', 'Amour à distance', 'Romance queer',
  ],
  'Science-fiction': [
    'Dystopie', 'Voyage dans le temps', 'Extraterrestres', 'Cyberpunk', 'Espace', 'Post-apocalyptique',
    'Intelligence artificielle', 'Clonage', 'Exploration spatiale', 'Robots', 'Réalité virtuelle',
  ],
  Thriller: [
    'Thriller psychologique', 'Thriller politique', 'Thriller d’espionnage', 'Thriller juridique', 'Home invasion', 'Course contre la montre',
    'Complot', 'Traque', 'Manipulation', 'Vengeance',
  ],
  Téléfilm: [
    'Romance TV', 'Drame TV', 'Saga', 'Mini-série', 'Adaptation', 'Fêtes de fin d’année',
    'Chronique familiale', 'Anthologie',
  ],
  Guerre: [
    'Guerre mondiale', 'Guérilla', 'Résistance', 'Front', 'Prisonnier de guerre', 'Après-guerre',
    'Espionnage militaire', 'Bataille navale', 'Guerre civile', 'Enfance en temps de guerre',
  ],
  Western: [
    'Spaghetti western', 'Néo-western', 'Hors-la-loi', 'Cowboy', 'Frontière', 'Chasse à l’homme',
    'Guerre indienne', 'Chercheur d’or', 'Shérif', 'Vengeance dans l’Ouest',
  ],
}

const reels = reactive(
  Object.fromEntries(
    CATEGORIES.map((c) => [c.key, { strip: [c.label], translate: 0, transitionMs: 0, spinning: false, started: false }]),
  ),
)

const sub = reactive({ strip: ['Sous-genre'], translate: 0, transitionMs: 0, spinning: false, started: false })
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

onMounted(() => {
  updateCellHeight()
  window.addEventListener('resize', updateCellHeight)
})
onBeforeUnmount(() => {
  window.removeEventListener('resize', updateCellHeight)
  if (tickInterval) clearInterval(tickInterval)
})

// ---------- sound ----------
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

// ---------- reel spin ----------
function spinReel(reel, list, durationMs, heightPx, onDone) {
  reel.started = true
  reel.spinning = true

  const loops = 3 + Math.floor(Math.random() * 2)
  const extra = Math.floor(Math.random() * list.length)
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
    playLand()
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
  if (rolling.value) return
  rolling.value = true
  updateCellHeight()
  sub.started = false
  sub.strip = ['Sous-genre']
  sub.translate = 0
  sub.transitionMs = 0
  rollingSub.value = false
  playThunk()
  startTicking()
  CATEGORIES.forEach((c) => spinReel(reels[c.key], c.list, c.duration, cellHeight.value, checkAllDone))
}

function currentGenre() {
  return reels.genre.strip[reels.genre.strip.length - 1]
}

function rollSub() {
  if (rollingSub.value || rolling.value || !reels.genre.started) return
  const list = SUBGENRES[currentGenre()] || ['Classique']
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
</script>

<template>
  <div class="min-h-screen flex flex-col items-center justify-center gap-10 sm:gap-16 px-4 sm:px-6 py-10 sm:py-16 relative overflow-x-hidden">
    <!-- invisible probes: measure actual rendered cell height at the current breakpoint -->
    <div ref="probeRef" class="reel-box w-52 h-52 sm:w-64 sm:h-64 absolute opacity-0 pointer-events-none -z-10" aria-hidden="true"></div>
    <div ref="subProbeRef" class="reel-box w-full max-w-72 h-16 sm:max-w-96 sm:h-20 absolute opacity-0 pointer-events-none -z-10" aria-hidden="true"></div>

    <button
      class="mute-btn absolute top-4 right-4 sm:top-6 sm:right-6 text-xs font-semibold tracking-widest uppercase"
      @click="muted = !muted"
      :title="muted ? 'Activer le son' : 'Couper le son'"
    >
      {{ muted ? 'Son coupé' : 'Son actif' }}
    </button>

    <div class="mast flex flex-col items-center gap-3 w-full max-w-xs sm:max-w-none">
      <div class="mast-rule"></div>
      <h1 class="mast-title text-3xl sm:text-5xl text-center">Movie Roulette</h1>
      <p class="mast-subtitle text-center">Trouve quoi regarder</p>
      <div class="mast-rule"></div>
    </div>

    <div class="flex flex-col sm:flex-row flex-wrap items-center sm:items-start justify-center gap-8 sm:gap-10">
      <div v-for="cat in CATEGORIES" :key="cat.key" class="flex flex-col items-center gap-3">
        <span class="field-label">{{ cat.label }}</span>
        <div class="reel-box w-52 h-52 sm:w-64 sm:h-64" :class="{ 'is-spinning': reels[cat.key].spinning }">
          <div v-if="!reels[cat.key].started" class="w-full h-full flex items-center justify-center">
            <span class="text-2xl sm:text-3xl font-medium text-[var(--muted)]">—</span>
          </div>
          <div v-else class="reel-window">
            <div
              class="reel-track"
              :style="{
                transform: `translateY(${reels[cat.key].translate}px)`,
                transitionProperty: 'transform',
                transitionDuration: `${reels[cat.key].transitionMs}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }"
            >
              <div v-for="(item, i) in reels[cat.key].strip" :key="i" class="reel-item" :style="{ height: `${cellHeight}px` }">
                <span class="text-2xl sm:text-3xl font-semibold px-2 text-center">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <button class="btn-primary rounded-md px-10 sm:px-14 py-4 sm:py-5 text-base sm:text-lg w-full max-w-xs sm:w-auto" :disabled="rolling" @click="roll">
      {{ rolling ? 'En cours…' : 'Lancer' }}
    </button>

    <div v-if="reels.genre.started && !rolling" class="flex flex-col items-center gap-4 w-full max-w-xs sm:max-w-none">
      <div v-if="sub.started" class="flex flex-col items-center gap-3 w-full">
        <span class="field-label">Sous-genre</span>
        <div class="reel-box w-full max-w-72 h-16 sm:max-w-96 sm:h-20" :class="{ 'is-spinning': sub.spinning }">
          <div class="reel-window">
            <div
              class="reel-track"
              :style="{
                transform: `translateY(${sub.translate}px)`,
                transitionProperty: 'transform',
                transitionDuration: `${sub.transitionMs}ms`,
                transitionTimingFunction: 'cubic-bezier(0.16, 1, 0.3, 1)',
              }"
            >
              <div v-for="(item, i) in sub.strip" :key="i" class="reel-item" :style="{ height: `${subCellHeight}px` }">
                <span class="text-lg sm:text-xl font-semibold px-2 text-center">{{ item }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button class="btn-outline rounded-md px-8 py-3 text-sm w-full max-w-72 sm:w-auto" :disabled="rollingSub" @click="rollSub">
        {{ rollingSub ? 'En cours…' : sub.started ? 'Relancer le sous-genre' : 'Sous-genre' }}
      </button>
    </div>
  </div>
</template>
