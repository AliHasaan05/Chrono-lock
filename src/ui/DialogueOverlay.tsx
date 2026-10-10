// ============================================================================
// DIALOGUE OVERLAY — short NPC conversations.
// ============================================================================

import { useState } from 'react'
import { NPCS } from '@/content/npcs'
import { useUIStore } from '@/state/uiStore'
import { playSfx } from '@/audio/sound'

export function DialogueOverlay() {
  const dialogue = useUIStore((s) => s.dialogue)
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const [line, setLine] = useState(0)

  if (!dialogue) return null
  const npc = NPCS[dialogue.npcId]
  const lines = dialogue.lines

  const advance = () => {
    playSfx('ui')
    if (line + 1 >= lines.length) {
      closeOverlay()
      setLine(0)
    } else {
      setLine(line + 1)
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        left: 0,
        right: 0,
        bottom: 0,
        display: 'flex',
        justifyContent: 'center',
        padding: 24,
        zIndex: 55,
      }}
    >
      <div
        className="cl-panel fade-in"
        style={{ width: 'min(760px, 94vw)', padding: 18, display: 'flex', gap: 16, alignItems: 'center' }}
        onClick={advance}
      >
        <div
          style={{
            width: 54,
            height: 54,
            borderRadius: '50%',
            flex: '0 0 auto',
            background: `radial-gradient(circle, ${npc?.color}, transparent)`,
            border: `2px solid ${npc?.color}`,
            boxShadow: `0 0 18px ${npc?.color}`,
          }}
        />
        <div style={{ flex: 1 }}>
          <div style={{ color: npc?.color, fontWeight: 700, letterSpacing: 1 }}>
            {npc?.name} <span className="cl-tag">{npc?.role}</span>
          </div>
          <div style={{ marginTop: 4, fontSize: 15 }}>{lines[line]}</div>
        </div>
        <div className="cl-tag" style={{ alignSelf: 'flex-end' }}>
          {line + 1}/{lines.length} · click ▸
        </div>
      </div>
    </div>
  )
}
