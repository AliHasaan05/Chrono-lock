// ============================================================================
// LANGUAGE SELECT — asked before the adventure begins.
// ----------------------------------------------------------------------------
// The player chooses which programming language they want to learn. The choice
// is stored and shown throughout the game. The missions teach core concepts
// (variables, conditions, loops, lists, functions) that apply to every
// language; the syntax the player writes in-world is the teaching subset.
// ============================================================================

import { useState } from 'react'
import type { Language } from '@/types'
import { useGameStore } from '@/state/gameStore'
import { useUIStore } from '@/state/uiStore'
import { startAmbient, playSfx } from '@/audio/sound'
import { enterFullscreen } from '@/util/fullscreen'

const LANGUAGES: {
  id: Language
  name: string
  tagline: string
  color: string
  sample: string
}[] = [
  {
    id: 'python',
    name: 'Python',
    tagline: 'Clean, readable, beginner-friendly. Recommended for your first language.',
    color: '#00f0ff',
    sample: 'speed = 60\nif speed > 50:\n    print("Fast")',
  },
  {
    id: 'javascript',
    name: 'JavaScript',
    tagline: 'The language of the web. Same concepts, curly-brace syntax.',
    color: '#ffcc00',
    sample: 'let speed = 60;\nif (speed > 50) {\n  console.log("Fast");\n}',
  },
  {
    id: 'cpp',
    name: 'C++',
    tagline: 'Powerful and fast. Great once the fundamentals click.',
    color: '#ff3b6b',
    sample: 'int speed = 60;\nif (speed > 50) {\n  cout << "Fast";\n}',
  },
]

export function LanguageSelect() {
  const setLanguage = useGameStore((s) => s.setLanguage)
  const setScreen = useUIStore((s) => s.setScreen)
  const [selected, setSelected] = useState<Language>('python')

  const confirm = () => {
    playSfx('terminal')
    startAmbient()
    enterFullscreen()
    setLanguage(selected)
    setScreen('world')
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(ellipse at 50% 25%, rgba(0,240,255,0.12), transparent 60%), radial-gradient(ellipse at 50% 85%, rgba(180,0,255,0.14), transparent 60%), #05060f',
        padding: 24,
      }}
    >
      <div className="cl-tag" style={{ letterSpacing: 6 }}>BEFORE YOU BEGIN</div>
      <h1 className="cl-title" style={{ fontSize: 'clamp(28px,5vw,48px)', margin: '8px 0 4px' }}>
        Choose Your Language
      </h1>
      <p style={{ color: 'var(--muted)', maxWidth: 620, textAlign: 'center', marginBottom: 28 }}>
        Which programming language do you want to learn? CHRONO will teach you the core
        ideas, then you will write real code to repair the city.
      </p>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center', maxWidth: 1000 }}>
        {LANGUAGES.map((lang) => {
          const active = selected === lang.id
          return (
            <button
              key={lang.id}
              onClick={() => { setSelected(lang.id); playSfx('ui') }}
              style={{
                width: 280,
                textAlign: 'left',
                background: active ? `${lang.color}18` : 'rgba(10,14,30,0.7)',
                border: `2px solid ${active ? lang.color : 'rgba(255,255,255,0.1)'}`,
                borderRadius: 14,
                padding: 18,
                cursor: 'pointer',
                boxShadow: active ? `0 0 26px ${lang.color}44` : 'none',
                transform: active ? 'translateY(-4px)' : 'none',
                transition: 'all 0.15s ease',
                color: 'var(--text)',
                fontFamily: 'inherit',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 14, height: 14, borderRadius: '50%', background: lang.color, boxShadow: `0 0 10px ${lang.color}` }} />
                <span style={{ fontSize: 22, fontWeight: 800, color: active ? lang.color : 'var(--text)' }}>{lang.name}</span>
              </div>
              <div style={{ fontSize: 13, color: 'var(--muted)', margin: '8px 0 12px', minHeight: 54 }}>{lang.tagline}</div>
              <pre
                className="hud-mono"
                style={{
                  background: '#070a16',
                  border: '1px solid rgba(255,255,255,0.08)',
                  borderRadius: 8,
                  padding: 10,
                  fontSize: 12,
                  color: '#cfe8ff',
                  whiteSpace: 'pre',
                  overflow: 'auto',
                }}
              >
                {lang.sample}
              </pre>
            </button>
          )
        })}
      </div>

      <div style={{ display: 'flex', gap: 12, marginTop: 30 }}>
        <button className="cl-btn ghost" onClick={() => { playSfx('ui'); setScreen('title') }}>Back</button>
        <button className="cl-btn primary" style={{ fontSize: 16, padding: '14px 30px' }} onClick={confirm}>
          Start as {LANGUAGES.find((l) => l.id === selected)?.name}
        </button>
      </div>

      <p style={{ color: 'var(--muted)', fontSize: 12, marginTop: 18, maxWidth: 560, textAlign: 'center' }}>
        Note: the city terminals teach using a Python-style syntax that maps directly to the
        concepts in your chosen language. You can change this later in Settings.
      </p>
    </div>
  )
}
