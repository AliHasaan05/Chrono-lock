// ============================================================================
// WORLD EVENT BUS
// ----------------------------------------------------------------------------
// Decouples CODE EXECUTION from 3D RENDERING. The terminal evaluates code and
// publishes GameActions here (optionally staggered so loops animate step by
// step). The 3D world subscribes and animates. Neither imports the other.
// ============================================================================

import type { GameAction } from '@/types'

type Listener = (action: GameAction) => void

const listeners = new Set<Listener>()

export function subscribeWorld(fn: Listener): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function emitWorld(action: GameAction) {
  listeners.forEach((fn) => fn(action))
}

// Replay a list of actions with a delay between each so the player SEES loops
// execute one iteration at a time (drone 1 shuts down, drone 2 shuts down...).
export function playActionSequence(actions: GameAction[], stepMs = 450): Promise<void> {
  return new Promise((resolve) => {
    let i = 0
    const tick = () => {
      if (i >= actions.length) {
        resolve()
        return
      }
      emitWorld(actions[i])
      i++
      setTimeout(tick, stepMs)
    }
    tick()
  })
}
