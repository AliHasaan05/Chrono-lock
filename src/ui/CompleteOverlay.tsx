// ============================================================================
// MISSION COMPLETE — learning summary + rewards + unlock notice.
// ============================================================================

import { getTask } from '@/content/tasks'
import { getSector, SECTORS } from '@/content/sectors'
import { useUIStore } from '@/state/uiStore'
import { useGameStore } from '@/state/gameStore'
import { playSfx } from '@/audio/sound'

export function CompleteOverlay() {
  const taskId = useUIStore((s) => s.lastCompletedTaskId)
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const unlockedSectors = useGameStore((s) => s.unlockedSectors)
  const completedTasks = useGameStore((s) => s.completedTasks)

  const task = taskId ? getTask(taskId) : undefined
  if (!task) return null

  const sector = getSector(task.sectorId)
  const sectorDone = sector?.taskIds.every((id) => completedTasks.includes(id))
  const nextSector = sector ? SECTORS.find((s) => s.index === sector.index + 1) : undefined
  const justUnlocked = sectorDone && nextSector && unlockedSectors.includes(nextSector.id)

  return (
    <div className="cl-overlay fade-in">
      <div className="cl-panel" style={{ width: 'min(560px, 92vw)', padding: 26, textAlign: 'center' }}>
        <div className="cl-tag">MISSION COMPLETE</div>
        <h2 className="cl-title" style={{ fontSize: 26, marginTop: 4 }}>{task.title}</h2>

        <div style={{ textAlign: 'left', margin: '18px 0', background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.18)', borderRadius: 8, padding: 14 }}>
          <strong style={{ color: 'var(--green)' }}>You learned</strong>
          <div style={{ marginTop: 6 }}>✓ {task.conceptLabel}</div>
          <div style={{ marginTop: 10, color: 'var(--muted)' }}>Why it worked</div>
          <div>{task.learningExplanation}</div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '10px 0 18px' }}>
          <Reward label="XP" value={`+${task.rewards.xp}`} color="#00f0ff" />
          <Reward label="SHARDS" value={`+${task.rewards.shards}`} color="#b400ff" />
          {task.rewards.cores ? <Reward label="CORES" value={`+${task.rewards.cores}`} color="#ffcc00" /> : null}
        </div>

        {justUnlocked && (
          <div className="pulse" style={{ color: 'var(--yellow)', marginBottom: 14, fontWeight: 700 }}>
            🔓 NEW DISTRICT UNLOCKED: {nextSector!.name}
          </div>
        )}

        <button className="cl-btn primary" onClick={() => { playSfx('ui'); closeOverlay() }}>Continue</button>
      </div>
    </div>
  )
}

function Reward({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: 24, fontWeight: 800, color, textShadow: `0 0 10px ${color}` }}>{value}</div>
      <div className="cl-tag">{label}</div>
    </div>
  )
}
