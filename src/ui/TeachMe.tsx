// ============================================================================
// TEACH ME — guided, step-by-step coaching when the player is stuck.
// ----------------------------------------------------------------------------
// CHRONO asks small questions and builds the solution WITH the learner, rather
// than handing them the answer. Each correct choice reveals the next step.
// ============================================================================

import { useState } from 'react'
import type { TeachMeStep } from '@/types'
import { playSfx } from '@/audio/sound'

interface TeachMeProps {
  steps: TeachMeStep[]
  onClose: () => void
  onDone: () => void
}

export function TeachMe({ steps, onClose, onDone }: TeachMeProps) {
  const [idx, setIdx] = useState(0)
  const [answered, setAnswered] = useState(false)
  const step = steps[idx]

  const choose = (i: number) => {
    if (answered) return
    if (i === step.correctIndex) {
      playSfx('success')
      setAnswered(true)
    } else {
      playSfx('fail')
    }
  }

  const next = () => {
    if (idx + 1 >= steps.length) {
      onDone()
    } else {
      setIdx(idx + 1)
      setAnswered(false)
    }
  }

  return (
    <div className="cl-overlay fade-in" style={{ zIndex: 60 }}>
      <div className="cl-panel" style={{ width: 'min(540px, 92vw)', padding: 22 }}>
        <div className="cl-tag">CHRONO · TEACH ME MODE · STEP {idx + 1}/{steps.length}</div>
        <h3 className="cl-title" style={{ fontSize: 18, marginTop: 6 }}>{step.prompt}</h3>

        <div style={{ display: 'grid', gap: 8, marginTop: 14 }}>
          {step.options.map((opt, i) => (
            <button
              key={i}
              className="cl-btn"
              style={{
                textAlign: 'left',
                textTransform: 'none',
                borderColor: answered && i === step.correctIndex ? 'var(--green)' : undefined,
                background: answered && i === step.correctIndex ? 'rgba(124,255,0,0.12)' : undefined,
              }}
              onClick={() => choose(i)}
            >
              {opt}
            </button>
          ))}
        </div>

        {answered && (
          <div style={{ marginTop: 14, color: 'var(--green)', fontSize: 14 }}>CHRONO: {step.response}</div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 18 }}>
          <button className="cl-btn ghost" onClick={onClose}>Exit</button>
          <button className="cl-btn primary" onClick={next} disabled={!answered}>
            {idx + 1 >= steps.length ? 'Finish' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  )
}
