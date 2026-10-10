// ============================================================================
// MENUS — Pause, Map, Skills, Codex, Inventory, Safehouse, Settings.
// ============================================================================

import { SECTORS } from '@/content/sectors'
import { TASKS } from '@/content/tasks'
import { CODEX } from '@/content/codex'
import { storyFor } from '@/content/storyline'
import { useGameStore } from '@/state/gameStore'
import { useUIStore } from '@/state/uiStore'
import { playSfx } from '@/audio/sound'
import { refreshAmbientVolume } from '@/audio/sound'
import type { ConceptId } from '@/types'

function Shell({ title, children, wide }: { title: string; children: React.ReactNode; wide?: boolean }) {
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  return (
    <div className="cl-overlay fade-in">
      <div className="cl-panel" style={{ width: wide ? 'min(900px,94vw)' : 'min(620px,94vw)', maxHeight: '90vh', overflow: 'auto', padding: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h2 className="cl-title" style={{ fontSize: 22 }}>{title}</h2>
          <button className="cl-btn ghost" onClick={() => { playSfx('ui'); closeOverlay() }}>✕ Close</button>
        </div>
        {children}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
export function PauseMenu() {
  const setOverlay = useUIStore((s) => s.setOverlay)
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const setScreen = useUIStore((s) => s.setScreen)
  const items: [string, () => void][] = [
    ['Resume', () => { playSfx('ui'); closeOverlay() }],
    ['Map', () => setOverlay('map')],
    ['Skills', () => setOverlay('skills')],
    ['Inventory', () => setOverlay('inventory')],
    ['Codex', () => setOverlay('codex')],
    ['Safehouse', () => setOverlay('safehouse')],
    ['Settings', () => setOverlay('settings')],
    ['Quit to Title', () => { playSfx('ui'); setScreen('title'); closeOverlay() }],
  ]
  return (
    <Shell title="Paused">
      <div style={{ display: 'grid', gap: 10 }}>
        {items.map(([label, fn]) => (
          <button key={label} className="cl-btn" onClick={() => { playSfx('ui'); fn() }}>{label}</button>
        ))}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------
export function MapMenu() {
  const unlocked = useGameStore((s) => s.unlockedSectors)
  const completed = useGameStore((s) => s.completedTasks)
  const language = useGameStore((s) => s.language)
  const story = storyFor(language)
  return (
    <Shell title={`${story.world} — City Map`} wide>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px,1fr))', gap: 12 }}>
        {SECTORS.map((s) => {
          const isUnlocked = unlocked.includes(s.id)
          const tasks = s.taskIds.length
          const done = s.taskIds.filter((id) => completed.includes(id)).length
          const districtName = story.sectors[s.id]?.name ?? s.name
          return (
            <div key={s.id} style={{
              background: isUnlocked ? 'rgba(0,240,255,0.05)' : 'rgba(255,255,255,0.02)',
              border: `1px solid ${isUnlocked ? 'rgba(0,240,255,0.25)' : 'rgba(255,255,255,0.08)'}`,
              borderRadius: 10, padding: 14, opacity: isUnlocked ? 1 : 0.55,
            }}>
              <div className="cl-tag">SECTOR {s.index}</div>
              <div style={{ fontWeight: 700, color: isUnlocked ? 'var(--cyan)' : 'var(--muted)' }}>{districtName}</div>
              <div style={{ fontSize: 12, color: 'var(--muted)' }}>{s.subtitle}</div>
              <div style={{ fontSize: 13, marginTop: 8 }}>{isUnlocked ? `${done}/${tasks} missions` : '🔒 Locked'}</div>
              {isUnlocked && (
                <div style={{ height: 6, background: '#0a0f20', borderRadius: 3, marginTop: 6 }}>
                  <div style={{ width: `${(done / tasks) * 100}%`, height: '100%', background: 'linear-gradient(90deg,#00f0ff,#7cff00)', borderRadius: 3 }} />
                </div>
              )}
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------
const SKILL_TREE: { concept: ConceptId; label: string; tier: string }[] = [
  { concept: 'variables', label: 'Variables', tier: 'FOUNDATIONS' },
  { concept: 'print', label: 'Output', tier: 'FOUNDATIONS' },
  { concept: 'conditions', label: 'Conditions', tier: 'LOGIC' },
  { concept: 'comparison', label: 'Comparison', tier: 'LOGIC' },
  { concept: 'loops-for', label: 'For Loops', tier: 'AUTOMATION' },
  { concept: 'loops-while', label: 'While Loops', tier: 'AUTOMATION' },
  { concept: 'lists', label: 'Lists', tier: 'DATA' },
  { concept: 'indexing', label: 'Indexing', tier: 'DATA' },
  { concept: 'functions', label: 'Functions', tier: 'ABSTRACTION' },
  { concept: 'parameters', label: 'Parameters', tier: 'ABSTRACTION' },
]

export function SkillsMenu() {
  const getMastery = useGameStore((s) => s.getMastery)
  const tiers = [...new Set(SKILL_TREE.map((s) => s.tier))]
  return (
    <Shell title="Programming Mastery" wide>
      {tiers.map((tier) => (
        <div key={tier} style={{ marginBottom: 18 }}>
          <div className="cl-tag" style={{ color: 'var(--magenta)' }}>{tier}</div>
          <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
            {SKILL_TREE.filter((s) => s.tier === tier).map((s) => {
              const m = getMastery(s.concept)
              return (
                <div key={s.concept} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 110, fontSize: 13 }}>{s.label}</div>
                  <div style={{ flex: 1, height: 12, background: '#0a0f20', borderRadius: 6, border: '1px solid rgba(255,255,255,0.08)' }}>
                    <div style={{ width: `${m}%`, height: '100%', background: 'linear-gradient(90deg,#00f0ff,#b400ff)', borderRadius: 6 }} />
                  </div>
                  <div style={{ width: 44, textAlign: 'right', fontSize: 12, color: 'var(--muted)' }}>{m}%</div>
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </Shell>
  )
}

// ---------------------------------------------------------------------------
export function CodexMenu() {
  const unlocked = useGameStore((s) => s.unlockedCodex)
  return (
    <Shell title="Programming Codex" wide>
      <p style={{ color: 'var(--muted)', marginBottom: 12 }}>Concepts unlock automatically as you learn them.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        {CODEX.map((c) => {
          const open = unlocked.includes(c.concept)
          return (
            <div key={c.concept} style={{ background: 'rgba(0,240,255,0.04)', border: '1px solid rgba(0,240,255,0.18)', borderRadius: 10, padding: 14, opacity: open ? 1 : 0.5 }}>
              <div style={{ fontWeight: 700, color: 'var(--cyan)' }}>{c.title} {!open && '🔒'}</div>
              {open ? (
                <>
                  <div style={{ fontSize: 13, marginTop: 4 }}>{c.purpose}</div>
                  <pre className="hud-mono" style={{ marginTop: 8, background: '#070a16', borderRadius: 6, padding: 10, fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.syntax}</pre>
                  <pre className="hud-mono" style={{ marginTop: 6, color: '#9affc0', fontSize: 13, whiteSpace: 'pre-wrap' }}>{c.example}</pre>
                </>
              ) : (
                <div style={{ fontSize: 13, color: 'var(--muted)', marginTop: 4 }}>Learn this concept in the city to unlock.</div>
              )}
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------
export function InventoryMenu() {
  const inventory = useGameStore((s) => s.inventory)
  const cosmetics = useGameStore((s) => s.cosmetics)
  const equipped = useGameStore((s) => s.equippedCosmetic)
  const equip = useGameStore((s) => s.equipCosmetic)
  return (
    <Shell title="Inventory">
      <div className="cl-tag">ITEMS</div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', margin: '8px 0 16px' }}>
        {inventory.map((it) => (
          <span key={it} style={{ padding: '6px 12px', background: 'rgba(0,240,255,0.08)', border: '1px solid rgba(0,240,255,0.25)', borderRadius: 8, fontSize: 13 }}>{it}</span>
        ))}
      </div>
      <div className="cl-tag">COSMETICS</div>
      <div style={{ display: 'grid', gap: 8, marginTop: 8 }}>
        {cosmetics.map((c) => (
          <button key={c} className="cl-btn" style={{ justifyContent: 'space-between', display: 'flex', textTransform: 'none' }} onClick={() => { playSfx('ui'); equip(c) }}>
            <span>{c}</span>
            <span style={{ color: equipped === c ? 'var(--green)' : 'var(--muted)' }}>{equipped === c ? 'EQUIPPED' : 'equip'}</span>
          </button>
        ))}
      </div>
    </Shell>
  )
}

// ---------------------------------------------------------------------------
const TROPHIES: { id: string; name: string; test: (c: string[]) => boolean }[] = [
  { id: 'first-program', name: 'First Program', test: (c) => c.includes('monorail-1') },
  { id: 'logic-hacker', name: 'Logic Hacker', test: (c) => c.includes('laser-1') },
  { id: 'loop-master', name: 'Loop Master', test: (c) => c.includes('reactor-1') },
  { id: 'data-cracker', name: 'Data Cracker', test: (c) => c.includes('vault-1') },
  { id: 'debug-detective', name: 'Debug Detective', test: (c) => c.includes('ailab-1') },
  { id: 'titan-slayer', name: 'Titan Slayer', test: (c) => c.includes('titan-3') },
]

export function SafehouseMenu() {
  const level = useGameStore((s) => s.level)
  const xp = useGameStore((s) => s.xp)
  const completed = useGameStore((s) => s.completedTasks)
  const cores = useGameStore((s) => s.cores)
  const total = TASKS.length
  return (
    <Shell title="Safehouse" wide>
      <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 18 }}>
        <Stat label="Level" value={String(level)} />
        <Stat label="Total XP" value={String(xp)} />
        <Stat label="Missions" value={`${completed.length}/${total}`} />
        <Stat label="Cores" value={String(cores)} />
      </div>
      <div className="cl-tag">TROPHIES</div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(160px,1fr))', gap: 10, marginTop: 8 }}>
        {TROPHIES.map((t) => {
          const earned = t.test(completed)
          return (
            <div key={t.id} style={{ padding: 12, borderRadius: 10, textAlign: 'center', background: earned ? 'rgba(255,204,0,0.08)' : 'rgba(255,255,255,0.02)', border: `1px solid ${earned ? 'rgba(255,204,0,0.4)' : 'rgba(255,255,255,0.08)'}`, opacity: earned ? 1 : 0.5 }}>
              <div style={{ fontSize: 24 }}>{earned ? '🏆' : '🔒'}</div>
              <div style={{ fontSize: 13, marginTop: 4 }}>{t.name}</div>
            </div>
          )
        })}
      </div>
    </Shell>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div style={{ fontSize: 26, fontWeight: 800, color: 'var(--cyan)', textShadow: '0 0 10px rgba(0,240,255,0.5)' }}>{value}</div>
      <div className="cl-tag">{label}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
export function SettingsMenu() {
  const settings = useGameStore((s) => s.settings)
  const update = useGameStore((s) => s.updateSettings)
  const reset = useGameStore((s) => s.resetProgress)
  const language = useGameStore((s) => s.language)
  const setLanguage = useGameStore((s) => s.setLanguage)

  const set = (patch: Parameters<typeof update>[0]) => {
    update(patch)
    refreshAmbientVolume()
  }

  return (
    <Shell title="Settings">
      <div style={{ display: 'grid', gap: 16 }}>
        <div>
          <div style={{ fontSize: 13, marginBottom: 6 }}>Learning Language</div>
          <div style={{ display: 'flex', gap: 8 }}>
            {(['python', 'javascript', 'cpp'] as const).map((l) => (
              <button
                key={l}
                className="cl-btn"
                style={{
                  textTransform: 'none',
                  background: language === l ? 'rgba(124,255,0,0.15)' : undefined,
                  borderColor: language === l ? 'var(--green)' : undefined,
                }}
                onClick={() => { playSfx('ui'); setLanguage(l) }}
              >
                {l === 'cpp' ? 'C++' : l.charAt(0).toUpperCase() + l.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <Slider label={`Music Volume (${Math.round(settings.musicVolume * 100)}%)`} value={settings.musicVolume} onChange={(v) => set({ musicVolume: v })} />
        <Slider label={`SFX Volume (${Math.round(settings.sfxVolume * 100)}%)`} value={settings.sfxVolume} onChange={(v) => set({ sfxVolume: v })} />
        <Toggle label="Mute all audio" value={settings.muted} onChange={(v) => set({ muted: v })} />
        <Toggle label="Reduced motion" value={settings.reducedMotion} onChange={(v) => set({ reducedMotion: v })} />
        <Toggle label="Subtitles" value={settings.subtitles} onChange={(v) => set({ subtitles: v })} />
        <hr style={{ border: 'none', borderTop: '1px solid rgba(255,255,255,0.1)' }} />
        <button className="cl-btn danger" onClick={() => { if (confirm('Reset all progress? This cannot be undone.')) { playSfx('fail'); reset() } }}>Reset Progress</button>
      </div>
    </Shell>
  )
}

function Slider({ label, value, onChange }: { label: string; value: number; onChange: (v: number) => void }) {
  return (
    <label style={{ display: 'block' }}>
      <div style={{ fontSize: 13, marginBottom: 6 }}>{label}</div>
      <input type="range" min={0} max={1} step={0.05} value={value} onChange={(e) => onChange(parseFloat(e.target.value))} style={{ width: '100%', accentColor: '#00f0ff' }} />
    </label>
  )
}

function Toggle({ label, value, onChange }: { label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
      <span style={{ fontSize: 14 }}>{label}</span>
      <button className="cl-btn" style={{ padding: '4px 14px', background: value ? 'rgba(124,255,0,0.15)' : undefined, borderColor: value ? 'var(--green)' : undefined }} onClick={() => onChange(!value)}>
        {value ? 'ON' : 'OFF'}
      </button>
    </label>
  )
}
