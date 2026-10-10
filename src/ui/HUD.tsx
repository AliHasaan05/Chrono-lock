// ============================================================================
// HUD — minimal in-world overlay: level, XP, resources, current objective,
// and quick controls. Stays out of the way during exploration.
// ============================================================================

import { useGameStore } from '@/state/gameStore'
import { useUIStore } from '@/state/uiStore'
import { SECTORS } from '@/content/sectors'
import { TASKS } from '@/content/tasks'
import { storyFor } from '@/content/storyline'
import { playSfx } from '@/audio/sound'

const XP_PER_LEVEL = 500

export function HUD() {
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const shards = useGameStore((s) => s.shards)
  const cores = useGameStore((s) => s.cores)
  const unlockedSectors = useGameStore((s) => s.unlockedSectors)
  const completedTasks = useGameStore((s) => s.completedTasks)
  const language = useGameStore((s) => s.language)
  const setOverlay = useUIStore((s) => s.setOverlay)

  const xpInLevel = xp % XP_PER_LEVEL
  const xpPct = (xpInLevel / XP_PER_LEVEL) * 100

  // current objective = first incomplete task in the highest unlocked sector
  const current = findCurrentObjective(unlockedSectors, completedTasks)

  return (
    <>
      {/* top-left: level + xp + resources */}
      <div style={panel('top', 'left')}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ fontWeight: 800, color: 'var(--cyan)', fontSize: 18, textShadow: '0 0 10px rgba(0,240,255,0.6)' }}>LVL {level}</div>
          <div style={{ width: 160 }}>
            <div style={{ height: 8, background: '#0a0f20', border: '1px solid rgba(0,240,255,0.3)', borderRadius: 4 }}>
              <div style={{ width: `${xpPct}%`, height: '100%', background: 'linear-gradient(90deg,#00f0ff,#b400ff)', borderRadius: 4 }} />
            </div>
            <div className="cl-tag" style={{ marginTop: 2 }}>{xpInLevel} / {XP_PER_LEVEL} XP</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 14, marginTop: 8, fontSize: 13, alignItems: 'center' }}>
          <span style={{ color: 'var(--magenta)' }}>◆ {shards} SHARDS</span>
          <span style={{ color: 'var(--yellow)' }}>⬡ {cores} CORES</span>
          {language && (
            <span className="hud-mono" style={{ color: '#9affc0', border: '1px solid rgba(124,255,0,0.3)', borderRadius: 5, padding: '1px 6px', fontSize: 11, textTransform: 'uppercase' }}>
              {language} · {storyFor(language).codename}
            </span>
          )}
        </div>
      </div>

      {/* top-right: menu buttons */}
      <div style={{ ...panel('top', 'right'), display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: 320 }}>
        <MenuBtn label="Map" k="M" onClick={() => { playSfx('ui'); setOverlay('map') }} />
        <MenuBtn label="Skills" k="K" onClick={() => { playSfx('ui'); setOverlay('skills') }} />
        <MenuBtn label="Codex" k="C" onClick={() => { playSfx('ui'); setOverlay('codex') }} />
        <MenuBtn label="Base" k="B" onClick={() => { playSfx('ui'); setOverlay('safehouse') }} />
        <MenuBtn label="Menu" k="ESC" onClick={() => { playSfx('ui'); setOverlay('pause') }} />
      </div>

      {/* top-center: prominent OBJECTIVE banner */}
      <div
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'linear-gradient(135deg, rgba(0,240,255,0.14), rgba(180,0,255,0.14))',
          border: '1px solid rgba(0,240,255,0.45)',
          borderRadius: 12,
          padding: '10px 22px',
          textAlign: 'center',
          backdropFilter: 'blur(6px)',
          boxShadow: '0 0 24px rgba(0,240,255,0.22)',
          zIndex: 21,
          minWidth: 320,
          maxWidth: '46vw',
        }}
      >
        <div className="cl-tag" style={{ color: 'var(--cyan)', letterSpacing: 3 }}>🎯 OBJECTIVE</div>
        <div style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', textShadow: '0 0 10px rgba(0,240,255,0.4)' }}>
          {current ? current.title : 'City restored — well done, Chrononaut.'}
        </div>
        {current && (
          <>
            <div style={{ fontSize: 12, color: '#cfe8ff', marginTop: 2 }}>
              {current.sectorName} · {current.conceptLabel}
            </div>
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>{current.hint}</div>
          </>
        )}
      </div>

      {/* bottom-right: controls hint */}
      <div style={{ ...panel('bottom', 'right'), fontSize: 12, color: 'var(--muted)', textAlign: 'right' }}>
        <div>WASD move · Shift sprint · Space jump</div>
        <div>Drag to look · <b style={{ color: 'var(--cyan)' }}>E</b> interact</div>
      </div>
    </>
  )
}

function findCurrentObjective(unlocked: string[], completed: string[]) {
  const sectors = SECTORS.filter((s) => unlocked.includes(s.id)).sort((a, b) => a.index - b.index)
  for (const sector of sectors) {
    for (const taskId of sector.taskIds) {
      if (!completed.includes(taskId)) {
        const task = TASKS.find((t) => t.id === taskId)
        if (task)
          return {
            title: task.title,
            sectorName: sector.name,
            conceptLabel: task.conceptLabel,
            hint: `Go to the ${sector.name} district and press E on a glowing terminal.`,
          }
      }
    }
  }
  return null
}

function MenuBtn({ label, k, onClick }: { label: string; k: string; onClick: () => void }) {
  return (
    <button className="cl-btn" style={{ padding: '6px 10px', fontSize: 12 }} onClick={onClick}>
      {label} <span style={{ opacity: 0.6, fontSize: 10 }}>{k}</span>
    </button>
  )
}

function panel(v: 'top' | 'bottom', h: 'left' | 'right'): React.CSSProperties {
  return {
    position: 'fixed',
    [v]: 16,
    [h]: 16,
    background: 'rgba(8,10,22,0.7)',
    border: '1px solid rgba(0,240,255,0.18)',
    borderRadius: 10,
    padding: '10px 14px',
    backdropFilter: 'blur(6px)',
    zIndex: 20,
    pointerEvents: 'auto',
  } as React.CSSProperties
}
