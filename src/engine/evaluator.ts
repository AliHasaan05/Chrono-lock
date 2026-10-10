// ============================================================================
// CODE EVALUATOR
// ----------------------------------------------------------------------------
// Bridges the interpreter and a CodingTask. Produces a LearningResult:
//   - runs the code in the sandbox
//   - runs the task's tests
//   - turns learner mistakes into CONTEXTUAL, teaching hints
//   - decides which GameActions to emit (from the trace, not faked)
// ============================================================================

import type { CodingTask, LearningResult, GameAction, Language } from '@/types'
import { type InterpreterOptions } from './interpreter'
import { runSource } from './run'

export function evaluateTask(
  task: CodingTask,
  source: string,
  gameOptions: InterpreterOptions,
  language: Language = 'python'
): LearningResult {
  const { context, error } = runSource(language, source, gameOptions)

  // If the program crashed, build a contextual teaching hint.
  if (error) {
    return {
      success: false,
      error,
      context,
      passedTests: task.tests.map(() => false),
      contextualHint: contextualHintFromError(source, error.message),
    }
  }

  // Run tests against the resulting context.
  const passedTests = task.tests.map((t) => {
    try {
      return t.check(context)
    } catch {
      return false
    }
  })

  const allPassed = passedTests.length > 0 && passedTests.every(Boolean)

  return {
    success: allPassed,
    error: null,
    context,
    passedTests,
    contextualHint: allPassed ? undefined : contextualHintFromTests(task, source, passedTests),
  }
}

// Only emit the task's canonical success actions if the trace actually
// produced the right world events. We prefer the actions the interpreter
// emitted, falling back to the task's declared successActions for ordering.
export function resolveSuccessActions(
  task: CodingTask,
  result: LearningResult
): GameAction[] {
  if (!result.success) return []
  // The interpreter already emitted real actions from game functions; use them
  // if present, otherwise fall back to the declared success actions.
  const emitted = result.context.actions
  return emitted.length > 0 ? emitted : task.successActions
}

// ----------------------------------------------------------------------------
// CONTEXTUAL HINTS — turn errors into learning moments.
// ----------------------------------------------------------------------------
function contextualHintFromError(source: string, friendly: string): string {
  // Common beginner patterns get specific coaching.
  if (/\bif\b[^=]*[^=!<>]=[^=]/.test(source) && /==/.test(friendly) === false) {
    // handled by interpreter already, but double-coach
  }
  // misspelled laser/lazer
  if (/lazer/i.test(source)) {
    return 'Check the variable name — the system gave you "laser", but your code uses "lazer".'
  }
  return 'CHRONO: ' + friendly
}

function contextualHintFromTests(
  task: CodingTask,
  source: string,
  passed: boolean[]
): string {
  const firstFailed = passed.findIndex((p) => !p)
  const failing = task.tests[firstFailed]?.description
  const base = failing
    ? `Not quite yet — this part still needs work: ${failing}`
    : task.failureFeedback

  // Add a nudge toward the concept.
  return `CHRONO: ${base}`
}
