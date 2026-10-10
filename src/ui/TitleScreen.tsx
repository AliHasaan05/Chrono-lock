// ============================================================================
// TITLE SCREEN — a futuristic animated entry point.
// ----------------------------------------------------------------------------
// Animated perspective grid, drifting neon glow, glitching title, scanlines,
// and a sheen-swept start button. Starts audio + fullscreen on the click
// gesture, then routes new players to language select / returning players in.
// ============================================================================

import { useGameStore } from '@/state/gameStore'
import { useUIStore } from '@/state/uiStore'
import { STORYLINES } from '@/content/storyline'
import { startAmbient, playSfx } from '@/audio/sound'
import { enterFullscreen } from '@/util/fullscreen'

export function TitleScreen() {
  const setScreen = useUIStore((s) => s.setScreen)
  const completed = useGameStore((s) => s.completedTasks)
  const level = useGameStore((s) => s.level)
  const language = useGameStore((s) => s.language)
  const hasProgress = completed.length > 0

  const start = () => {
    playSfx('terminal')
    if (hasProgress && language) {
      startAmbient()
      enterFullscreen()
      setScreen('world')
    } else {
      setScreen('language')
    }
  }

  return (
    <div className="title-root">
      {/* animated background layers */}
      <div className="title-glow a" />
      <div className="title-glow b" />
      <div className="title-glow c" />
      <div className="title-grid" />
      <div className="title-scanlines" />
      <div className="title-vignette" />

      {/* floating code fragments for atmosphere */}
      <FloatingCode />

      <div className="title-content fade-in">
        <div className="title-chip">
          <span className="title-dot" />
          A 3D CYBERPUNK CODING ADVENTURE
        </div>

        <h1 className="glitch" data-text="CHRONO-LOCK" style={{ margin: '18px 0 6px' }}>
          CHRONO-LOCK
        </h1>

        <p
          style={{
            fontSize: 'clamp(14px, 2.4vw, 20px)',
            letterSpacing: 6,
            color: '#8af0ff',
            textShadow: '0 0 14px rgba(0,240,255,0.5)',
            margin: 0,
          }}
        >
          CODE THE CITY · CHANGE THE WORLD
        </p>

        <p style={{ color: 'var(--muted)', maxWidth: 600, margin: '18px 0 10px', lineHeight: 1.6 }}>
          A catastrophic failure has corrupted the city. Learn <b style={{ color: '#cfe8ff' }}>real
          programming</b> and use your code to repair the world, one district at a time —
          then face the final AI.
        </p>

        {/* three worlds teaser (one per language) */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 26 }}>
          {(['python', 'javascript', 'cpp'] as const).map((l) => {
            const s = STORYLINES[l]
            const color = l === 'python' ? '#00e5ff' : l === 'javascript' ? '#ffd166' : '#ff5c8a'
            return (
              <div
                key={l}
                style={{
                  border: `1px solid ${color}55`,
                  background: `${color}10`,
                  borderRadius: 10,
                  padding: '8px 14px',
                  minWidth: 150,
                }}
              >
                <div style={{ color, fontWeight: 800, letterSpacing: 1, fontSize: 13 }}>{s.world}</div>
                <div style={{ fontSize: 10, color: 'var(--muted)', letterSpacing: 1 }}>{s.codename}</div>
              </div>
            )
          })}
        </div>

        <button className="start-btn" onClick={start}>
          {hasProgress && language ? `▸ Continue — Level ${level}` : '▸ Start Adventure'}
        </button>

        {hasProgress && language && (
          <div style={{ marginTop: 12, fontSize: 12, color: 'var(--muted)' }}>
            Current run: <b style={{ color: '#9affc0' }}>{STORYLINES[language].world}</b> ({language.toUpperCase()})
          </div>
        )}
      </div>

      <div style={{ position: 'absolute', bottom: 18, width: '100%', textAlign: 'center', color: 'var(--muted)', fontSize: 12, zIndex: 2 }}>
        WASD move · Mouse look · <b style={{ color: '#00f0ff' }}>E</b> interact · ESC menu
      </div>
    </div>
  )
}

// Decorative drifting code snippets in the background.
function FloatingCode() {
  const snippets = [
    'if laser == "red":', 'for d in drones:', 'console.log("online");',
    'int speed = 60;', 'def finish():', 'while (energy > 0) {', 'keys[1]', 'strike();',
  ]
  return (
    <div style={{ position: 'absolute', inset: 0, overflow: 'hidden', zIndex: 1, pointerEvents: 'none' }}>
      {snippets.map((s, i) => (
        <div
          key={i}
          className="hud-mono"
          style={{
            position: 'absolute',
            left: `${(i * 13 + 6) % 90}%`,
            top: `${(i * 29 + 10) % 85}%`,
            fontSize: 13,
            color: 'rgba(0,240,255,0.18)',
            whiteSpace: 'nowrap',
            animation: `floatA ${8 + (i % 5)}s ease-in-out infinite`,
            textShadow: '0 0 8px rgba(0,240,255,0.2)',
          }}
        >
          {s}
        </div>
      ))}
    </div>
  )
}
