import { build } from 'esbuild'
import { pathToFileURL, fileURLToPath } from 'url'
import { writeFileSync, mkdirSync } from 'fs'
import path from 'path'
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
async function load(entry) {
  const outfile = path.join(root, '.verify', 'brace-err.mjs')
  mkdirSync(path.join(root, '.verify'), { recursive: true })
  await build({ entryPoints: [entry], bundle: true, format: 'esm', platform: 'node', outfile, alias: { '@': path.join(root, 'src') }, logLevel: 'silent' })
  return import(pathToFileURL(outfile).href + '?t=' + Date.now())
}
const harness = path.join(root, '.verify', 'brace-err-harness.ts')
const src = [
  "import { runSource } from '@/engine/run'",
  'const NL = String.fromCharCode(10)',
  'const L = (...xs:string[]) => xs.join(NL)',
  'const cases = [',
  '  { name:"js-assign-in-if", lang:"javascript", src:L("let x = 1;","if (x = 2) {","  console.log(x);","}"), want:"syntax" },',
  '  { name:"js-undefined", lang:"javascript", src:"console.log(foo);", want:"name" },',
  '  { name:"js-infinite", lang:"javascript", src:L("while (true) {","  let x = 1;","}"), want:"runtime" },',
  '  { name:"cpp-missing-brace", lang:"cpp", src:L("if (1 > 0)","  cout << 1;"), want:"syntax" },',
  '  { name:"cpp-valid", lang:"cpp", src:L("int x = 2 + 3;","cout << x;"), want:"none", out:"5" },',
  '  { name:"js-valid-loop", lang:"javascript", src:L("let t = 0;","for (let i = 0; i < 3; i = i + 1) {","  t = t + i;","}","console.log(t);"), want:"none", out:"3" },',
  ']',
  'export function run(){',
  '  return cases.map((c:any) => {',
  '    const { error, context } = runSource(c.lang, c.src, { gameFunctions: {} })',
  '    return { name:c.name, want:c.want, got: error ? error.kind : "none", msg: error ? error.message : null, out: context.output.join(""), wantOut: c.out ?? null }',
  '  })',
  '}',
].join('\n')
mkdirSync(path.join(root, '.verify'), { recursive: true })
writeFileSync(harness, src, 'utf8')
const mod = await load(harness)
const res = mod.run()
let ok = 0
for (const r of res) {
  const kindOk = r.got === r.want
  const outOk = r.wantOut ? r.out === r.wantOut : true
  const pass = kindOk && outOk
  if (pass) ok++
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${r.name}  kind=${r.got}  ${r.msg ?? r.out}`)
}
console.log(`\n${ok}/${res.length} brace-language cases correct.`)
process.exit(ok === res.length ? 0 : 1)
