// Verify every task is solvable in Python, JavaScript and C++ with real code,
// using the actual language-aware runner + task tests.
import { build } from 'esbuild'
import { pathToFileURL, fileURLToPath } from 'url'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function load(entry) {
  const outfile = path.join(root, '.verify', 'langs.mjs')
  mkdirSync(path.join(root, '.verify'), { recursive: true })
  await build({
    entryPoints: [entry], bundle: true, format: 'esm', platform: 'node',
    outfile, alias: { '@': path.join(root, 'src') }, logLevel: 'silent',
  })
  return import(pathToFileURL(outfile).href + '?t=' + Date.now())
}

const harness = path.join(root, '.verify', 'langs-harness.ts')
mkdirSync(path.join(root, '.verify'), { recursive: true })

// Intended solutions per language. Written as arrays of lines joined at runtime
// so we avoid escaping headaches.
const harnessSrc = `
import { TASKS } from '@/content/tasks'
import { MISSION_FUNCTIONS } from '@/content/gameFunctions'
import { evaluateTask } from '@/engine/evaluator'
const NL = String.fromCharCode(10)
const L = (...xs:string[]) => xs.join(NL)

const PY: Record<string,string> = {
  'monorail-1': 'print("Monorail online")',
  'monorail-2': 'speed = 60',
  'monorail-3': L('engine = "ready"','close_doors()','launch_train()'),
  'laser-1': L('laser = "red"','if laser == "red":','    activate_shield()','else:','    jump()'),
  'laser-2': L('laser = "blue"','if laser == "red":','    activate_shield()','elif laser == "blue":','    jump()','else:','    disable_laser("safe")'),
  'reactor-1': L('dampeners = ["D1","D2","D3","D4","D5"]','for d in dampeners:','    drain(d)'),
  'reactor-2': L('energy = 5','while energy > 0:','    drain("core")','    energy = energy - 1','stabilize()'),
  'vault-1': L('keys = ["NOVA","ECHO","FLUX"]','highlight(keys[1])'),
  'vault-2': L('keys = ["NOVA","ECHO","FLUX"]','for key in keys:','    highlight(key)','open_vault()'),
  'ailab-1': L('def open_door():','    unlock()','    slide_door()','','open_door()'),
  'ailab-2': L('drones = ["R1","R2","R3","R4"]','def clear(group):','    for d in group:','        disable(d)','','clear(drones)'),
  'titan-1': L('shield = "fire"','if shield == "fire":','    use_water_weapon()','else:','    use_fire_weapon()'),
  'titan-2': L('for i in range(3):','    strike()'),
  'titan-3': L('def finish():','    for i in range(3):','        strike()','','finish()'),
}

const JS: Record<string,string> = {
  'monorail-1': 'console.log("Monorail online");',
  'monorail-2': 'let speed = 60;',
  'monorail-3': L('let engine = "ready";','close_doors();','launch_train();'),
  'laser-1': L('let laser = "red";','if (laser == "red") {','  activate_shield();','} else {','  jump();','}'),
  'laser-2': L('let laser = "blue";','if (laser == "red") {','  activate_shield();','} else if (laser == "blue") {','  jump();','} else {','  disable_laser("safe");','}'),
  'reactor-1': L('let dampeners = ["D1","D2","D3","D4","D5"];','for (let d of dampeners) {','  drain(d);','}'),
  'reactor-2': L('let energy = 5;','while (energy > 0) {','  drain("core");','  energy = energy - 1;','}','stabilize();'),
  'vault-1': L('let keys = ["NOVA","ECHO","FLUX"];','highlight(keys[1]);'),
  'vault-2': L('let keys = ["NOVA","ECHO","FLUX"];','for (let key of keys) {','  highlight(key);','}','open_vault();'),
  'ailab-1': L('function open_door() {','  unlock();','  slide_door();','}','open_door();'),
  'ailab-2': L('let drones = ["R1","R2","R3","R4"];','function clear(group) {','  for (let d of group) {','    disable(d);','  }','}','clear(drones);'),
  'titan-1': L('let shield = "fire";','if (shield == "fire") {','  use_water_weapon();','} else {','  use_fire_weapon();','}'),
  'titan-2': L('for (let i = 0; i < 3; i = i + 1) {','  strike();','}'),
  'titan-3': L('function finish() {','  for (let i = 0; i < 3; i = i + 1) {','    strike();','  }','}','finish();'),
}

const CPP: Record<string,string> = {
  'monorail-1': 'cout << "Monorail online";',
  'monorail-2': 'int speed = 60;',
  'monorail-3': L('string engine = "ready";','close_doors();','launch_train();'),
  'laser-1': L('string laser = "red";','if (laser == "red") {','  activate_shield();','} else {','  jump();','}'),
  'laser-2': L('string laser = "blue";','if (laser == "red") {','  activate_shield();','} else if (laser == "blue") {','  jump();','} else {','  disable_laser("safe");','}'),
  'reactor-1': L('string dampeners[] = {"D1","D2","D3","D4","D5"};','for (auto d : dampeners) {','  drain(d);','}'),
  'reactor-2': L('int energy = 5;','while (energy > 0) {','  drain("core");','  energy = energy - 1;','}','stabilize();'),
  'vault-1': L('string keys[] = {"NOVA","ECHO","FLUX"};','highlight(keys[1]);'),
  'vault-2': L('string keys[] = {"NOVA","ECHO","FLUX"};','for (auto key : keys) {','  highlight(key);','}','open_vault();'),
  'ailab-1': L('void open_door() {','  unlock();','  slide_door();','}','open_door();'),
  'ailab-2': L('string drones[] = {"R1","R2","R3","R4"};','void clear(auto group) {','  for (auto d : group) {','    disable(d);','  }','}','clear(drones);'),
  'titan-1': L('string shield = "fire";','if (shield == "fire") {','  use_water_weapon();','} else {','  use_fire_weapon();','}'),
  'titan-2': L('for (int i = 0; i < 3; i = i + 1) {','  strike();','}'),
  'titan-3': L('void finish() {','  for (int i = 0; i < 3; i = i + 1) {','    strike();','  }','}','finish();'),
}

const SETS: any = { python: PY, javascript: JS, cpp: CPP }

export function runAll() {
  const results: any[] = []
  for (const langKey of Object.keys(SETS)) {
    for (const task of TASKS) {
      const code = SETS[langKey][task.id]
      const res = evaluateTask(task, code, { gameFunctions: MISSION_FUNCTIONS[task.sectorId] ?? {} }, langKey as any)
      results.push({ lang: langKey, id: task.id, success: res.success, err: res.error ? res.error.message : null, passed: res.passedTests })
    }
  }
  return results
}
`
writeFileSync(harness, harnessSrc, 'utf8')

const mod = await load(harness)
const results = mod.runAll()
const byLang = {}
for (const r of results) {
  byLang[r.lang] = byLang[r.lang] || { ok: 0, total: 0 }
  byLang[r.lang].total++
  if (r.success) byLang[r.lang].ok++
  else console.log(`FAIL [${r.lang}] ${r.id}  passed=[${r.passed}]${r.err ? '  err=' + r.err : ''}`)
}
console.log('')
let allOk = true
for (const lang of Object.keys(byLang)) {
  const { ok, total } = byLang[lang]
  console.log(`${lang.padEnd(11)} ${ok}/${total} tasks pass`)
  if (ok !== total) allOk = false
}
process.exit(allOk ? 0 : 1)
