// ============================================================================
// TOAST — transient notifications (hint costs, nudges, unlocks).
// ============================================================================

import { useEffect } from 'react'
import { useUIStore } from '@/state/uiStore'

export function Toast() {
  const toast = useUIStore((s) => s.toast)
  const setToast = useUIStore((s) => s.setToast)

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast, setToast])

  if (!toast) return null
  return (
    <div
      className="fade-in"
      style={{
        position: 'fixed',
        top: 90,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(8,10,22,0.92)',
        border: '1px solid rgba(0,240,255,0.4)',
        borderRadius: 10,
        padding: '10px 18px',
        color: 'var(--text)',
        zIndex: 70,
        boxShadow: '0 0 20px rgba(0,240,255,0.2)',
      }}
    >
      {toast}
    </div>
  )
}
