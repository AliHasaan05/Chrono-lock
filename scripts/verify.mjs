// Quick runtime verification of the interpreter + task evaluation.
// Run with: node scripts/verify.mjs   (after `npm run build:verify` tsc step)
// We import the compiled TS via tsx-less approach: use a tiny inline harness.
//
// Since the engine is TS, we transpile on the fly with esbuild (already a dep
// of vite). This checks that each task's intended solution passes its tests and
// emits the right actions.

import { build } from 'esbuild'
import { pathToFileURL, fileURLToPath } from 'url'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function load(entry) {
  const outfile = path.join(root, '.verify', 'bundle.mjs')
  mkdirSync(path.join(root, '.verify'), { recursive: true })
  await build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'node',
    outfile,
    alias: { '@': path.join(root, 'src') },
    logLevel: 'silent',
  })
  return import(pathToFileURL(outfile).href + '?t=' + Date.now())
}

const harnessPath = path.join(root, '.verify', 'harness.ts')
mkdirSync(path.join(root, '.verify'), { recursive: true })
writeFileSync(
  harnessPath,
  `
import { TASKS } from '@/content/tasks'
import { MISSION_FUNCTIONS } from '@/content/gameFunctions'
import { evaluateTask } from '@/engine/evaluator'

export const SOLUTIONS: Record<string, string> = {
  'monorail-1': 'print("Monorail online")',
  'monorail-2': 'speed = 60',
  'monorail-3': 'engine = "ready"\\nclose_doors()\\nlaunch_train()',
  'laser-1': 'laser = "red"\\nif laser == "red":\\n    activate_shield()\\nelse:\\n    jump()',
  'laser-2': 'laser = "blue"\\nif laser == "red":\\n    activate_shield()\\nelif laser == "blue":\\n    jump()\\nelse:\\n    disable_laser("safe")',
  'reactor-1': 'dampeners = ["D1","D2","D3","D4","D5"]\\nfor d in dampeners:\\n    drain(d)',
  'reactor-2': 'energy = 5\\nwhile energy > 0:\\n    drain("core")\\n    energy = energy - 1\\nstabilize()',
  'vault-1': 'keys = ["NOVA","ECHO","FLUX"]\\nhighlight(keys[1])',
  'vault-2': 'keys = ["NOVA","ECHO","FLUX"]\\nfor key in keys:\\n    highlight(key)\\nopen_vault()',
  'ailab-1': 'def open_door():\\n    unlock()\\n    slide_door()\\n\\nopen_door()',
  'ailab-2': 'drones = ["R1","R2","R3","R4"]\\ndef clear(group):\\n    for d in group:\\n        disable(d)\\n\\nclear(drones)',
  'titan-1': 'shield = "fire"\\nif shield == "fire":\\n    use_water_weapon()\\nelse:\\n    use_fire_weapon()',
  'titan-2': 'for i in range(3):\\n    strike()',
  'titan-3': 'def finish():\\n    for i in range(3):\\n        strike()\\n\\nfinish()',
}

export function runAll() {
  const results: any[] = []
  for (const task of TASKS) {
    const code = SOLUTIONS[task.id]
    const res = evaluateTask(task, code, { gameFunctions: MISSION_FUNCTIONS[task.sectorId] ?? {} })
    results.push({ id: task.id, success: res.success, error: res.error?.message ?? null, passed: res.passedTests })
  }
  return results
}
`,
  'utf8'
)

const mod = await load(harnessPath)
const results = mod.runAll()
let ok = 0
for (const r of results) {
  const mark = r.success ? 'PASS' : 'FAIL'
  console.log(`${mark}  ${r.id}  tests=[${r.passed.join(',')}]${r.error ? '  err=' + r.error : ''}`)
  if (r.success) ok++
}
console.log(`\n${ok}/${results.length} tasks solvable with intended solution.`)
process.exit(ok === results.length ? 0 : 1)
