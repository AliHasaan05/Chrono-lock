// Verify that common beginner mistakes produce helpful, differentiated errors
// and that the sandbox never runs away.
import { build } from 'esbuild'
import { pathToFileURL, fileURLToPath } from 'url'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

async function load(entry) {
  const outfile = path.join(root, '.verify', 'bundle-err.mjs')
  mkdirSync(path.join(root, '.verify'), { recursive: true })
  await build({
    entryPoints: [entry], bundle: true, format: 'esm', platform: 'node',
    outfile, alias: { '@': path.join(root, 'src') }, logLevel: 'silent',
  })
  return import(pathToFileURL(outfile).href + '?t=' + Date.now())
}

const harness = path.join(root, '.verify', 'harness-err.ts')
const harnessSource = [
  "import { runProgram } from '@/engine/interpreter'",
  'const NL = String.fromCharCode(10)',
  'const cases = [',
  '  { name: "assignment-in-if", src: ["laser = \\"red\\"", "if laser = \\"red\\":", "    print(1)"].join(NL), wantKind: "syntax" },',
  '  { name: "undefined-name", src: "print(lazer)", wantKind: "name" },',
  '  { name: "infinite-loop-guard", src: ["while True:", "    x = 1"].join(NL), wantKind: "runtime" },',
  '  { name: "index-out-of-range", src: ["a = [1,2]", "print(a[5])"].join(NL), wantKind: "runtime" },',
  '  { name: "missing-colon", src: ["if 1 > 0", "    print(1)"].join(NL), wantKind: "syntax" },',
  '  { name: "valid-program", src: ["x = 2 + 3", "print(x)"].join(NL), wantKind: "none", wantOut: "5" },',
  ']',
  'export function run() {',
  '  return cases.map((c) => {',
  '    const { error, context } = runProgram(c.src, { gameFunctions: {} })',
  '    return { name: c.name, wantKind: c.wantKind, wantOut: c.wantOut ?? null, kind: error ? error.kind : "none", message: error ? error.message : null, output: context.output.join("") }',
  '  })',
  '}',
].join('\n')

mkdirSync(path.join(root, '.verify'), { recursive: true })
writeFileSync(harness, harnessSource, 'utf8')

const mod = await load(harness)
const results = mod.run()
let ok = 0
for (const r of results) {
  const kindOk = r.kind === r.wantKind
  const outOk = r.wantOut ? r.output === r.wantOut : true
  const pass = kindOk && outOk
  if (pass) ok++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${r.name}  kind=${r.kind}  ${r.message ?? r.output}`)
}
console.log(`\n${ok}/${results.length} error cases behaved correctly.`)
process.exit(ok === results.length ? 0 : 1)
