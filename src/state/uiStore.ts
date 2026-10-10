// ============================================================================
// UI / FLOW STATE
// ----------------------------------------------------------------------------
// Tracks the current screen, active terminal/task, dialogue, pause menu, etc.
// Kept separate from persistent game progression.
// ============================================================================

import { create } from 'zustand'

export type Screen = 'title' | 'language' | 'world'

export type Overlay =
  | null
  | 'terminal'
  | 'dialogue'
  | 'pause'
  | 'map'
  | 'inventory'
  | 'skills'
  | 'codex'
  | 'settings'
  | 'safehouse'
  | 'complete'

interface DialogueState {
  npcId: string
  lines: string[]
}

interface UIState {
  screen: Screen
  overlay: Overlay
  activeTaskId: string | null
  lastCompletedTaskId: string | null
  dialogue: DialogueState | null
  toast: string | null

  setScreen: (s: Screen) => void
  openTerminal: (taskId: string) => void
  closeOverlay: () => void
  setOverlay: (o: Overlay) => void
  openDialogue: (npcId: string, lines: string[]) => void
  showComplete: (taskId: string) => void
  setToast: (msg: string | null) => void
}

export const useUIStore = create<UIState>((set) => ({
  screen: 'title',
  overlay: null,
  activeTaskId: null,
  lastCompletedTaskId: null,
  dialogue: null,
  toast: null,

  setScreen: (s) => set({ screen: s }),
  openTerminal: (taskId) => set({ overlay: 'terminal', activeTaskId: taskId }),
  closeOverlay: () => set({ overlay: null, dialogue: null }),
  setOverlay: (o) => set({ overlay: o }),
  openDialogue: (npcId, lines) => set({ overlay: 'dialogue', dialogue: { npcId, lines } }),
  showComplete: (taskId) => set({ overlay: 'complete', lastCompletedTaskId: taskId }),
  setToast: (msg) => set({ toast: msg }),
}))
