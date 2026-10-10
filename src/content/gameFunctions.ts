// ============================================================================
// MISSION GAME FUNCTIONS
// ----------------------------------------------------------------------------
// Each mission exposes a set of "abilities" to learner code. Calling them
// pushes GameActions into the EvalContext, which the 3D world later replays.
// These are completely safe: they only append structured action objects.
// ============================================================================

import type { EvalContext, GameAction } from '@/types'
import type { InterpreterOptions } from '@/engine/interpreter'

type Val = unknown

function push(ctx: EvalContext, action: GameAction) {
  ctx.actions.push(action)
}

export const MISSION_FUNCTIONS: Record<string, InterpreterOptions['gameFunctions']> = {
  monorail: {
    start_engine: (_args, ctx) => {
      push(ctx, { type: 'LOG', message: 'Engine ignition...' })
      return null
    },
    close_doors: (_args, ctx) => {
      push(ctx, { type: 'CLOSE_DOORS', trainId: 'monorail-1' })
      return null
    },
    launch_train: (_args, ctx) => {
      push(ctx, { type: 'ACTIVATE_TRAIN', trainId: 'monorail-1' })
      return null
    },
  },

  laser: {
    activate_shield: (_args, ctx) => {
      push(ctx, { type: 'ACTIVATE_SHIELD' })
      return null
    },
    jump: (_args, ctx) => {
      push(ctx, { type: 'PLAYER_JUMP' })
      return null
    },
    disable_laser: (args: Val[], ctx) => {
      push(ctx, { type: 'DISABLE_LASER', laserId: String(args[0] ?? 'laser') })
      return null
    },
  },

  reactor: {
    drain: (args: Val[], ctx) => {
      const id = String(args[0] ?? 'dampener')
      const index = ctx.actions.filter((a) => a.type === 'DRAIN_DAMPENER').length
      push(ctx, { type: 'DRAIN_DAMPENER', dampenerId: id, index })
      return null
    },
    stabilize: (_args, ctx) => {
      push(ctx, { type: 'STABILIZE_REACTOR', reactorId: 'reactor-7' })
      return null
    },
  },

  vault: {
    highlight: (args: Val[], ctx) => {
      const label = String(args[0] ?? '')
      const index = ctx.actions.filter((a) => a.type === 'HIGHLIGHT_KEY').length
      push(ctx, { type: 'HIGHLIGHT_KEY', vaultId: 'vault-1', index, label })
      return null
    },
    open_vault: (_args, ctx) => {
      push(ctx, { type: 'OPEN_VAULT', vaultId: 'vault-1' })
      return null
    },
  },

  ailab: {
    unlock: (_args, ctx) => {
      push(ctx, { type: 'LOG', message: 'Lock disengaged.' })
      return null
    },
    slide_door: (_args, ctx) => {
      push(ctx, { type: 'OPEN_DOOR', doorId: 'ailab-door' })
      return null
    },
    disable: (args: Val[], ctx) => {
      const id = String(args[0] ?? 'drone')
      const index = ctx.actions.filter((a) => a.type === 'DISABLE_DRONE').length
      push(ctx, { type: 'DISABLE_DRONE', droneId: id, index })
      return null
    },
  },

  titan: {
    use_water_weapon: (_args, ctx) => {
      push(ctx, { type: 'DAMAGE_BOSS', amount: 34 })
      return null
    },
    use_fire_weapon: (_args, ctx) => {
      push(ctx, { type: 'DAMAGE_BOSS', amount: 34 })
      return null
    },
    use_shock_weapon: (_args, ctx) => {
      push(ctx, { type: 'DAMAGE_BOSS', amount: 34 })
      return null
    },
    strike: (_args, ctx) => {
      push(ctx, { type: 'DAMAGE_BOSS', amount: 20 })
      return null
    },
  },
}
