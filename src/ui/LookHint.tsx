// ============================================================================
// LOOK HINT + CROSSHAIR
// ----------------------------------------------------------------------------
// Shows a center crosshair during exploration and a "click to look around"
// prompt until the pointer is locked. Pointer lock lets the mouse steer the
// camera freely (no click-drag). The hint hides once the pointer is locked.
// ============================================================================

import { useEffect, useState } from 'react'
import { useUIStore } from '@/state/uiStore'

export function LookHint() {
  const overlay = useUIStore((s) => s.overlay)
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const update = () => setLocked(!!document.pointerLockElement)
    document.addEventListener('pointerlockchange', update)
    return () => document.removeEventListener('pointerlockchange', update)
  }, [])

  // Only relevant during free exploration.
  if (overlay !== null) return null

  return (
    <>
      {/* crosshair */}
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          width: 8,
          height: 8,
          marginLeft: -4,
          marginTop: -4,
          borderRadius: '50%',
          border: '1.5px solid rgba(0,240,255,0.8)',
          boxShadow: '0 0 8px rgba(0,240,255,0.6)',
          pointerEvents: 'none',
          zIndex: 15,
          opacity: locked ? 0.9 : 0.3,
        }}
      />
      {!locked && (
        <div
          className="pulse"
          style={{
            position: 'fixed',
            bottom: 92,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(8,10,22,0.82)',
            border: '1px solid rgba(0,240,255,0.4)',
            borderRadius: 10,
            padding: '8px 16px',
            color: '#cfe8ff',
            fontSize: 13,
            zIndex: 18,
            pointerEvents: 'none',
          }}
        >
          🖱️ Click the scene to look around freely · press Esc to release
        </div>
      )}
    </>
  )
}
