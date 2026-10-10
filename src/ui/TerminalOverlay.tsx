// ============================================================================
// TERMINAL OVERLAY — the coding interface.
// ----------------------------------------------------------------------------
// EXPLORE -> LEARN -> CODE -> HINT -> DEBUG -> RUN -> WORLD REACTS -> REWARD.
// Shows: mission title/objective, teaching card (WHAT/HOW/WHY/SYNTAX), the code
// editor, Run / Reset / Hint / Debug / Teach-Me, output console, test results.
// Real evaluation via the sandboxed interpreter; success replays GameActions
// to the 3D world (staggered so loops animate step by step).
// ============================================================================

import { useMemo, useState } from 'react'
import { getTask } from '@/content/tasks'
import { getVariant } from '@/content/taskVariants'
import { MISSION_FUNCTIONS } from '@/content/gameFunctions'
import { evaluateTask, resolveSuccessActions } from '@/engine/evaluator'
import { runSource } from '@/engine/run'
import type { DebugStep, LearningResult } from '@/types'
import { useUIStore } from '@/state/uiStore'
import { useGameStore } from '@/state/gameStore'
import { playActionSequence } from '@/state/worldEvents'
import { playSfx } from '@/audio/sound'
import { CodeEditor } from './CodeEditor'
import { TeachMe } from './TeachMe'

export function TerminalOverlay() {
  const taskId = useUIStore((s) => s.activeTaskId)
  const closeOverlay = useUIStore((s) => s.closeOverlay)
  const showComplete = useUIStore((s) => s.showComplete)
  const setToast = useUIStore((s) => s.setToast)

  const addXp = useGameStore((s) => s.addXp)
  const addShards = useGameStore((s) => s.addShards)
  const addCores = useGameStore((s) => s.addCores)
  const spendShards = useGameStore((s) => s.spendShards)
  const shards = useGameStore((s) => s.shards)
  const completeTask = useGameStore((s) => s.completeTask)
  const isTaskComplete = useGameStore((s) => s.isTaskComplete)
  const recordAttempt = useGameStore((s) => s.recordAttempt)
  const recordHint = useGameStore((s) => s.recordHint)
  const recordError = useGameStore((s) => s.recordError)
  const recordDebug = useGameStore((s) => s.recordDebug)
  const language = useGameStore((s) => s.language)

  const task = taskId ? getTask(taskId) : undefined
  const lang = language ?? 'python'
  // Per-language presentation (null => use the Python base in the task itself).
  const variant = task ? getVariant(task.id, lang) : null
  const starter = variant?.starterCode ?? task?.starterCode ?? ''
  const syntax = variant?.syntax ?? task?.teaching.syntax ?? ''

  const [code, setCode] = useState(starter)
  const [output, setOutput] = useState<string[]>([])
  const [result, setResult] = useState<LearningResult | null>(null)
  const [revealedHints, setRevealedHints] = useState(0)
  const [debugSteps, setDebugSteps] = useState<DebugStep[] | null>(null)
  const [debugIdx, setDebugIdx] = useState(0)
  const [running, setRunning] = useState(false)
  const [showTeaching, setShowTeaching] = useState(true)
  const [teachMeOpen, setTeachMeOpen] = useState(false)

  const gameFns = useMemo(
    () => (task ? { gameFunctions: MISSION_FUNCTIONS[task.sectorId] ?? {} } : { gameFunctions: {} }),
    [task]
  )

  if (!task) return null

  const alreadyDone = isTaskComplete(task.id)

  const handleRun = async () => {
    if (running) return
    playSfx('run')
    setRunning(true)
    setDebugSteps(null)
    recordAttempt(task.concept)

    const res = evaluateTask(task, code, gameFns, lang)
    setResult(res)
    setOutput(res.context.output)

    if (res.error) {
      recordError(task.concept, res.error.kind === 'logic' ? 'logic' : 'syntax')
      playSfx('fail')
      setRunning(false)
      return
    }

    if (res.success) {
      playSfx('success')
      // replay the real actions the code produced into the 3D world
      const actions = resolveSuccessActions(task, res)
      await playActionSequence(actions, 450)

      if (!alreadyDone) {
        completeTask(task.id)
        addXp(task.rewards.xp)
        addShards(task.rewards.shards)
        if (task.rewards.cores) addCores(task.rewards.cores)
        playSfx('xp')
      }
      setRunning(false)
      showComplete(task.id)
    } else {
      recordError(task.concept, 'logic')
      playSfx('fail')
      setRunning(false)
    }
  }

  const handleDebug = () => {
    playSfx('terminal')
    recordDebug(task.concept)
    const { context } = runSource(lang, code, gameFns)
    setDebugSteps(context.steps)
    setDebugIdx(0)
    setOutput(context.output)
    if (context.steps.length === 0) {
      setToast('Step-through tracing is available for Python missions. Output still shows above.')
    }
  }

  const revealHint = () => {
    const next = revealedHints + 1
    if (next > task.hints.length) return
    const hint = task.hints[next - 1]
    if (hint.cost > 0) {
      if (!spendShards(hint.cost)) {
        setToast(`Need ${hint.cost} shards for this hint.`)
        playSfx('fail')
        return
      }
    }
    recordHint(task.concept)
    setRevealedHints(next)
    playSfx('ui')
  }

  const reset = () => {
    setCode(starter)
    setResult(null)
    setOutput([])
    setDebugSteps(null)
    playSfx('ui')
  }

  // Hint text for a given level, using the language variant when available.
  const hintTextFor = (level: number): string => {
    if (variant && variant.hintText[level - 1]) return variant.hintText[level - 1]
    return task.hints[level - 1]?.text ?? ''
  }

  const currentStep = debugSteps && debugSteps[debugIdx]

  return (
    <div className="cl-overlay fade-in">
      <div className="cl-panel" style={{ width: 'min(1100px, 96vw)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', padding: 20, overflow: 'hidden' }}>
        {/* header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
          <div>
            <div className="cl-tag">{task.conceptLabel} · {task.difficulty.toUpperCase()} · STAGE {task.stage}/7 · {(language ?? 'python').toUpperCase()}</div>
            <h2 className="cl-title" style={{ fontSize: 22 }}>{task.title}</h2>
            <p style={{ color: 'var(--muted)', maxWidth: 760, marginTop: 4 }}>{task.description}</p>
          </div>
          <button className="cl-btn ghost" onClick={() => { playSfx('ui'); closeOverlay() }}>✕ ESC</button>
        </div>

        <div style={{ display: 'flex', gap: 16, flex: 1, minHeight: 0 }}>
          {/* LEFT: teaching + editor */}
          <div style={{ flex: 1.4, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
            {showTeaching && (
              <div style={{ background: 'rgba(0,240,255,0.05)', border: '1px solid rgba(0,240,255,0.18)', borderRadius: 8, padding: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <strong style={{ color: 'var(--cyan)' }}>HOW IT WORKS</strong>
                  <button className="cl-btn ghost" style={{ padding: '2px 8px', fontSize: 11 }} onClick={() => setShowTeaching(false)}>hide</button>
                </div>
                <div style={{ fontSize: 13, marginTop: 6, display: 'grid', gap: 4 }}>
                  <div><b style={{ color: '#9affc0' }}>WHAT:</b> {task.teaching.what}</div>
                  <div><b style={{ color: '#56c8ff' }}>HOW:</b> {task.teaching.how}</div>
                  <div><b style={{ color: '#ffcc88' }}>WHY:</b> {task.teaching.why}</div>
                </div>
                <div className="cl-tag" style={{ marginTop: 8, color: 'var(--muted)' }}>SYNTAX · {lang.toUpperCase()}</div>
                <pre className="hud-mono" style={{ marginTop: 4, background: '#070a16', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 6, padding: 10, fontSize: 13, color: '#dff6ff', whiteSpace: 'pre-wrap' }}>{syntax}</pre>
              </div>
            )}
            {!showTeaching && (
              <button className="cl-btn ghost" style={{ alignSelf: 'flex-start', fontSize: 11, padding: '4px 10px' }} onClick={() => setShowTeaching(true)}>show how it works</button>
            )}

            <CodeEditor value={code} onChange={setCode} highlightLine={currentStep?.line ?? null} />

            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="cl-btn primary" onClick={handleRun} disabled={running}>▶ Run Code</button>
              <button className="cl-btn" onClick={handleDebug} disabled={running}>🐞 Debug</button>
              <button className="cl-btn" onClick={revealHint} disabled={revealedHints >= task.hints.length}>💡 Hint ({revealedHints}/{task.hints.length})</button>
              {task.teachMe && <button className="cl-btn" onClick={() => { setTeachMeOpen(true); playSfx('ui') }}>🎓 Teach Me</button>}
              <button className="cl-btn ghost" onClick={reset}>↺ Reset</button>
            </div>
          </div>

          {/* RIGHT: output / tests / hints / debug */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0, overflow: 'auto' }}>
            {/* Debug panel */}
            {debugSteps && (
              <div style={{ background: '#0a0f20', border: '1px solid rgba(180,0,255,0.3)', borderRadius: 8, padding: 10 }}>
                <strong style={{ color: 'var(--magenta)' }}>DEBUGGER — step through</strong>
                <div className="hud-mono" style={{ fontSize: 13, marginTop: 6 }}>
                  {currentStep ? (
                    <>
                      <div>LINE {currentStep.line}: <span style={{ color: '#dff6ff' }}>{currentStep.code || '(output)'}</span></div>
                      {currentStep.action && <div style={{ color: '#7cff00' }}>→ world: {currentStep.action.type}</div>}
                      <div style={{ marginTop: 6, color: 'var(--muted)' }}>VARIABLES</div>
                      {Object.keys(currentStep.variables).length === 0 && <div style={{ color: '#5a6488' }}>(none yet)</div>}
                      {Object.entries(currentStep.variables).map(([k, v]) => (
                        <div key={k}><span style={{ color: '#56c8ff' }}>{k}</span> = <span style={{ color: '#ffcc88' }}>{JSON.stringify(v)}</span></div>
                      ))}
                    </>
                  ) : (
                    <div style={{ color: 'var(--muted)' }}>No steps recorded.</div>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  <button className="cl-btn ghost" style={{ padding: '4px 10px' }} disabled={debugIdx <= 0} onClick={() => setDebugIdx((i) => Math.max(0, i - 1))}>◀ Prev</button>
                  <span style={{ color: 'var(--muted)', alignSelf: 'center', fontSize: 12 }}>{debugSteps.length ? debugIdx + 1 : 0}/{debugSteps.length}</span>
                  <button className="cl-btn ghost" style={{ padding: '4px 10px' }} disabled={debugIdx >= debugSteps.length - 1} onClick={() => setDebugIdx((i) => Math.min(debugSteps.length - 1, i + 1))}>Next ▶</button>
                </div>
              </div>
            )}

            {/* Output console */}
            <div style={{ background: '#070a16', border: '1px solid rgba(0,240,255,0.18)', borderRadius: 8, padding: 10, flex: '0 0 auto' }}>
              <strong style={{ color: 'var(--cyan)' }}>OUTPUT</strong>
              <pre className="hud-mono" style={{ fontSize: 13, color: '#cfe8ff', minHeight: 40, whiteSpace: 'pre-wrap', marginTop: 6 }}>
                {output.length ? output.join('\n') : <span style={{ color: '#5a6488' }}>// run your code to see output</span>}
              </pre>
            </div>

            {/* Error / contextual hint */}
            {result?.error && (
              <div style={{ background: 'rgba(255,77,77,0.08)', border: '1px solid rgba(255,77,77,0.4)', borderRadius: 8, padding: 10 }}>
                <strong style={{ color: '#ff8a8a' }}>{result.error.kind.toUpperCase()} ERROR{result.error.line ? ` · line ${result.error.line}` : ''}</strong>
                <div style={{ fontSize: 13, marginTop: 4 }}>{result.error.message}</div>
                {result.contextualHint && <div style={{ fontSize: 13, marginTop: 6, color: 'var(--cyan)' }}>{result.contextualHint}</div>}
              </div>
            )}

            {/* Tests */}
            <div style={{ background: '#0a0f20', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 8, padding: 10 }}>
              <strong style={{ color: '#9affc0' }}>OBJECTIVES</strong>
              <div style={{ fontSize: 13, marginTop: 6, display: 'grid', gap: 4 }}>
                {task.tests.map((t, i) => {
                  const passed = result?.passedTests[i]
                  return (
                    <div key={i} style={{ color: passed ? '#7cff00' : passed === false ? '#ff8a8a' : 'var(--muted)' }}>
                      {passed ? '✓' : passed === false ? '✗' : '○'} {t.description}
                    </div>
                  )
                })}
              </div>
              {result && !result.success && !result.error && result.contextualHint && (
                <div style={{ fontSize: 13, marginTop: 8, color: 'var(--cyan)' }}>{result.contextualHint}</div>
              )}
            </div>

            {/* Hints */}
            {revealedHints > 0 && (
              <div style={{ background: 'rgba(255,204,0,0.06)', border: '1px solid rgba(255,204,0,0.3)', borderRadius: 8, padding: 10 }}>
                <strong style={{ color: 'var(--yellow)' }}>CHRONO HINTS</strong>
                <div style={{ display: 'grid', gap: 6, marginTop: 6 }}>
                  {task.hints.slice(0, revealedHints).map((h) => (
                    <div key={h.level} style={{ fontSize: 13 }}>
                      <span style={{ color: 'var(--yellow)' }}>#{h.level} {h.kind}:</span>{' '}
                      <span style={{ whiteSpace: 'pre-wrap' }}>{hintTextFor(h.level)}</span>
                    </div>
                  ))}
                </div>
                {revealedHints < task.hints.length && (
                  <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 6 }}>
                    Next hint costs {task.hints[revealedHints].cost} shards (you have {shards}).
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {teachMeOpen && task.teachMe && (
          <TeachMe
            steps={task.teachMe}
            onClose={() => setTeachMeOpen(false)}
            onDone={() => { setTeachMeOpen(false); setToast('CHRONO: Now try writing it yourself.') }}
          />
        )}
      </div>
    </div>
  )
}
