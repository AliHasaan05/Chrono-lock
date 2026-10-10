// ============================================================================
// APP ROOT — screen router + overlay manager + global keyboard shortcuts.
// ----------------------------------------------------------------------------
// Wires the 3D World, HUD, and every overlay together. Keeps controls disabled
// while a menu/terminal is open. Handles ESC and menu hotkeys.
// ============================================================================

import { Suspense, useEffect, useRef } from 'react'
import { useGameStore } from '@/state/gameStore'
import { useUIStore } from '@/state/uiStore'
import { storyFor } from '@/content/storyline'
import { World } from '@/three/World'
import { HUD } from '@/ui/HUD'
import { TitleScreen } from '@/ui/TitleScreen'
import { LanguageSelect } from '@/ui/LanguageSelect'
import { TerminalOverlay } from '@/ui/TerminalOverlay'
import { CompleteOverlay } from '@/ui/CompleteOverlay'
import { DialogueOverlay } from '@/ui/DialogueOverlay'
import { Toast } from '@/ui/Toast'
import { LookHint } from '@/ui/LookHint'
import {
  PauseMenu,
  MapMenu,
  SkillsMenu,
  CodexMenu,
  InventoryMenu,
  SafehouseMenu,
  SettingsMenu,
} from '@/ui/Menus'

export default function App() {
  const screen = useUIStore((s) => s.screen)
  const overlay = useUIStore((s) => s.overlay)
  const setOverlay = useUIStore((s) => s.setOverlay)
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const openDialogue = useUIStore((s) => s.openDialogue)
  const language = useGameStore((s) => s.language)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)

  // Play the language-flavored intro once per session when entering the world.
  const introShown = useRef(false)
  useEffect(() => {
    if (screen === 'world' && !introShown.current) {
      introShown.current = true
      const story = storyFor(language)
      // slight delay so the city finishes loading first
      const t = setTimeout(() => openDialogue('chrono', story.intro), 600)
      return () => clearTimeout(t)
    }
  }, [screen, language, openDialogue])

  // global shortcuts
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (screen !== 'world') return
      // don't hijack typing in the editor
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'TEXTAREA' || tag === 'INPUT') return

      if (e.code === 'Escape') {
        e.preventDefault()
        if (overlay && overlay !== 'pause') closeOverlay()
        else if (overlay === 'pause') closeOverlay()
        else setOverlay('pause')
        return
      }
      if (overlay) return // other hotkeys only from exploration
      switch (e.code) {
        case 'KeyM': setOverlay('map'); break
        case 'KeyK': setOverlay('skills'); break
        case 'KeyC': setOverlay('codex'); break
        case 'KeyI': setOverlay('inventory'); break
        case 'KeyB': setOverlay('safehouse'); break
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [screen, overlay, setOverlay, closeOverlay])

  useEffect(() => {
    document.body.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  if (screen === 'title') return <TitleScreen />
  if (screen === 'language') return <LanguageSelect />

  return (
    <div style={{ position: 'fixed', inset: 0 }}>
      <Suspense fallback={<LoadingScreen />}>
        <World />
      </Suspense>

      <HUD />
      <LookHint />
      <Toast />

      {overlay === 'terminal' && <TerminalOverlay />}
      {overlay === 'complete' && <CompleteOverlay />}
      {overlay === 'dialogue' && <DialogueOverlay />}
      {overlay === 'pause' && <PauseMenu />}
      {overlay === 'map' && <MapMenu />}
      {overlay === 'skills' && <SkillsMenu />}
      {overlay === 'codex' && <CodexMenu />}
      {overlay === 'inventory' && <InventoryMenu />}
      {overlay === 'safehouse' && <SafehouseMenu />}
      {overlay === 'settings' && <SettingsMenu />}
    </div>
  )
}

function LoadingScreen() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#05060f',
        color: 'var(--cyan)',
        flexDirection: 'column',
        gap: 12,
      }}
    >
      <div className="pulse" style={{ fontSize: 22, letterSpacing: 4 }}>LOADING CITY…</div>
      <div style={{ color: 'var(--muted)', fontSize: 13 }}>Booting Chrono Core · streaming 3D assets</div>
    </div>
  )
}
