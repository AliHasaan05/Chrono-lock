// ============================================================================
// GAME STATE (Zustand) + SAVE SYSTEM
// ----------------------------------------------------------------------------
// Single source of truth for progression: XP, shards, cores, unlocked sectors,
// completed tasks, mastery, inventory, cosmetics, settings. Persists to
// localStorage so progress survives reloads.
// ============================================================================

import { create } from 'zustand'
import type { ConceptId } from '@/types'
import { SECTORS } from '@/content/sectors'
import { TASKS } from '@/content/tasks'

const SAVE_KEY = 'chrono-lock-save-v1'

export interface MasteryEntry {
  attempts: number
  completions: number
  hintsUsed: number
  syntaxErrors: number
  logicErrors: number
  debugRuns: number
}

export interface Settings {
  musicVolume: number
  sfxVolume: number
  muted: boolean
  reducedMotion: boolean
  subtitles: boolean
}

export interface SaveData {
  language: import('@/types').Language | null
  level: number
  xp: number
  shards: number
  cores: number
  unlockedSectors: string[]
  completedTasks: string[]
  unlockedCodex: ConceptId[]
  mastery: Record<string, MasteryEntry>
  inventory: string[]
  cosmetics: string[]
  equippedCosmetic: string | null
  achievements: string[]
  settings: Settings
}

interface GameState extends SaveData {
  // actions
  addXp: (amount: number) => void
  addShards: (amount: number) => void
  spendShards: (amount: number) => boolean
  addCores: (amount: number) => void
  completeTask: (taskId: string) => void
  recordAttempt: (concept: ConceptId) => void
  recordHint: (concept: ConceptId) => void
  recordError: (concept: ConceptId, kind: 'syntax' | 'logic') => void
  recordDebug: (concept: ConceptId) => void
  unlockSector: (sectorId: string) => void
  unlockCodex: (concept: ConceptId) => void
  grantAchievement: (id: string) => void
  equipCosmetic: (id: string) => void
  setLanguage: (lang: import('@/types').Language) => void
  updateSettings: (patch: Partial<Settings>) => void
  isTaskComplete: (taskId: string) => boolean
  isSectorUnlocked: (sectorId: string) => boolean
  getMastery: (concept: ConceptId) => number // 0..100
  resetProgress: () => void
}

const XP_PER_LEVEL = 500

function defaultSave(): SaveData {
  return {
    language: null,
    level: 1,
    xp: 0,
    shards: 50,
    cores: 0,
    unlockedSectors: SECTORS.filter((s) => s.unlockedByDefault).map((s) => s.id),
    completedTasks: [],
    unlockedCodex: [],
    mastery: {},
    inventory: ['Chrono Visor'],
    cosmetics: ['Default Jacket'],
    equippedCosmetic: 'Default Jacket',
    achievements: [],
    settings: {
      musicVolume: 0.5,
      sfxVolume: 0.7,
      muted: false,
      reducedMotion: false,
      subtitles: true,
    },
  }
}

function loadSave(): SaveData {
  try {
    const raw = localStorage.getItem(SAVE_KEY)
    if (!raw) return defaultSave()
    const parsed = JSON.parse(raw)
    return { ...defaultSave(), ...parsed, settings: { ...defaultSave().settings, ...parsed.settings } }
  } catch {
    return defaultSave()
  }
}

function persist(state: SaveData) {
  const data: SaveData = {
    language: state.language,
    level: state.level,
    xp: state.xp,
    shards: state.shards,
    cores: state.cores,
    unlockedSectors: state.unlockedSectors,
    completedTasks: state.completedTasks,
    unlockedCodex: state.unlockedCodex,
    mastery: state.mastery,
    inventory: state.inventory,
    cosmetics: state.cosmetics,
    equippedCosmetic: state.equippedCosmetic,
    achievements: state.achievements,
    settings: state.settings,
  }
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(data))
  } catch {
    /* storage full / unavailable — ignore */
  }
}

function emptyMastery(): MasteryEntry {
  return { attempts: 0, completions: 0, hintsUsed: 0, syntaxErrors: 0, logicErrors: 0, debugRuns: 0 }
}

export const useGameStore = create<GameState>((set, get) => ({
  ...loadSave(),

  addXp: (amount) =>
    set((s) => {
      const xp = s.xp + amount
      const level = Math.max(1, Math.floor(xp / XP_PER_LEVEL) + 1)
      const next = { ...s, xp, level }
      persist(next)
      return next
    }),

  addShards: (amount) =>
    set((s) => {
      const next = { ...s, shards: s.shards + amount }
      persist(next)
      return next
    }),

  spendShards: (amount) => {
    const s = get()
    if (s.shards < amount) return false
    set((st) => {
      const next = { ...st, shards: st.shards - amount }
      persist(next)
      return next
    })
    return true
  },

  addCores: (amount) =>
    set((s) => {
      const next = { ...s, cores: s.cores + amount }
      persist(next)
      return next
    }),

  completeTask: (taskId) =>
    set((s) => {
      if (s.completedTasks.includes(taskId)) return s
      const task = TASKS.find((t) => t.id === taskId)
      const completedTasks = [...s.completedTasks, taskId]

      // mastery bump
      const mastery = { ...s.mastery }
      if (task) {
        const m = { ...(mastery[task.concept] ?? emptyMastery()) }
        m.completions += 1
        mastery[task.concept] = m
      }

      // auto-unlock next sector when all its tasks are done
      let unlockedSectors = [...s.unlockedSectors]
      let unlockedCodex = [...s.unlockedCodex]
      if (task) {
        if (!unlockedCodex.includes(task.concept)) unlockedCodex.push(task.concept)
        const sector = SECTORS.find((sec) => sec.id === task.sectorId)
        if (sector) {
          const allDone = sector.taskIds.every((id) => completedTasks.includes(id))
          if (allDone) {
            const nextSector = SECTORS.find((sec) => sec.index === sector.index + 1)
            if (nextSector && !unlockedSectors.includes(nextSector.id)) {
              unlockedSectors.push(nextSector.id)
            }
          }
        }
      }

      const next = { ...s, completedTasks, mastery, unlockedSectors, unlockedCodex }
      persist(next)
      return next
    }),

  recordAttempt: (concept) =>
    set((s) => {
      const mastery = { ...s.mastery }
      const m = { ...(mastery[concept] ?? emptyMastery()) }
      m.attempts += 1
      mastery[concept] = m
      const next = { ...s, mastery }
      persist(next)
      return next
    }),

  recordHint: (concept) =>
    set((s) => {
      const mastery = { ...s.mastery }
      const m = { ...(mastery[concept] ?? emptyMastery()) }
      m.hintsUsed += 1
      mastery[concept] = m
      const next = { ...s, mastery }
      persist(next)
      return next
    }),

  recordError: (concept, kind) =>
    set((s) => {
      const mastery = { ...s.mastery }
      const m = { ...(mastery[concept] ?? emptyMastery()) }
      if (kind === 'syntax') m.syntaxErrors += 1
      else m.logicErrors += 1
      mastery[concept] = m
      const next = { ...s, mastery }
      persist(next)
      return next
    }),

  recordDebug: (concept) =>
    set((s) => {
      const mastery = { ...s.mastery }
      const m = { ...(mastery[concept] ?? emptyMastery()) }
      m.debugRuns += 1
      mastery[concept] = m
      const next = { ...s, mastery }
      persist(next)
      return next
    }),

  unlockSector: (sectorId) =>
    set((s) => {
      if (s.unlockedSectors.includes(sectorId)) return s
      const next = { ...s, unlockedSectors: [...s.unlockedSectors, sectorId] }
      persist(next)
      return next
    }),

  unlockCodex: (concept) =>
    set((s) => {
      if (s.unlockedCodex.includes(concept)) return s
      const next = { ...s, unlockedCodex: [...s.unlockedCodex, concept] }
      persist(next)
      return next
    }),

  grantAchievement: (id) =>
    set((s) => {
      if (s.achievements.includes(id)) return s
      const next = { ...s, achievements: [...s.achievements, id] }
      persist(next)
      return next
    }),

  equipCosmetic: (id) =>
    set((s) => {
      const next = { ...s, equippedCosmetic: id }
      persist(next)
      return next
    }),

  setLanguage: (lang) =>
    set((s) => {
      const next = { ...s, language: lang }
      persist(next)
      return next
    }),

  updateSettings: (patch) =>
    set((s) => {
      const next = { ...s, settings: { ...s.settings, ...patch } }
      persist(next)
      return next
    }),

  isTaskComplete: (taskId) => get().completedTasks.includes(taskId),
  isSectorUnlocked: (sectorId) => get().unlockedSectors.includes(sectorId),

  getMastery: (concept) => {
    const m = get().mastery[concept]
    if (!m || m.attempts === 0) return 0
    // mastery grows with completions, lightly penalized by hints/errors
    const base = Math.min(1, m.completions / Math.max(1, m.attempts))
    const penalty = Math.min(0.3, (m.hintsUsed * 0.03 + m.syntaxErrors * 0.02))
    return Math.round(Math.max(0, base - penalty) * 100)
  },

  resetProgress: () =>
    set(() => {
      const fresh = defaultSave()
      persist(fresh)
      return fresh as GameState
    }),
}))
