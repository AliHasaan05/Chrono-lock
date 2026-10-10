// ============================================================================
// LANGUAGE-AWARE RUNNER
// ----------------------------------------------------------------------------
// Routes source code to the correct sandboxed interpreter based on the chosen
// language, returning a uniform EvalContext + error. Python uses the Python
// interpreter; JavaScript and C++ share the brace interpreter.
// ============================================================================

import type { EvalContext, CodeError, Language } from '@/types'
import { runProgram, type InterpreterOptions } from './interpreter'
import { runBraceProgram } from './braceInterpreter'

export function runSource(
  language: Language,
  source: string,
  options: InterpreterOptions
): { context: EvalContext; error: CodeError | null } {
  if (language === 'python') {
    return runProgram(source, options)
  }
  return runBraceProgram(source, {
    gameFunctions: options.gameFunctions,
    flavor: language, // 'javascript' | 'cpp'
  })
}
