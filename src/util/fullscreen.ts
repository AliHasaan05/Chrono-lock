// ============================================================================
// FULLSCREEN HELPER
// ----------------------------------------------------------------------------
// Requests fullscreen on the document element. Must be called from a user
// gesture (e.g. a click), which is how we invoke it (Start / language confirm).
// Fails silently if the browser blocks it so the game still runs windowed.
// ============================================================================

export function enterFullscreen() {
  try {
    const el = document.documentElement as HTMLElement & {
      webkitRequestFullscreen?: () => Promise<void>
      msRequestFullscreen?: () => Promise<void>
    }
    if (document.fullscreenElement) return
    if (el.requestFullscreen) void el.requestFullscreen()
    else if (el.webkitRequestFullscreen) void el.webkitRequestFullscreen()
    else if (el.msRequestFullscreen) void el.msRequestFullscreen()
  } catch {
    /* fullscreen blocked — continue windowed */
  }
}

export function exitFullscreen() {
  try {
    if (document.fullscreenElement && document.exitFullscreen) void document.exitFullscreen()
  } catch {
    /* ignore */
  }
}
