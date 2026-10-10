// ============================================================================
// BRACE-LANGUAGE INTERPRETER (JavaScript + C++ teaching subsets)
// ----------------------------------------------------------------------------
// A small, SANDBOXED interpreter for the brace-based teaching subset shared by
// JavaScript and C++. Like the Python interpreter it never uses eval() and only
// produces an EvalContext (output, variables, actions, debug steps) plus
// differentiated, beginner-friendly errors.
//
// Supported (both JS and C++ flavors):
//   - declarations:   let/const/var x = e;   |   int/double/string/bool/auto x = e;
//   - assignment:     x = e;    x[i] = e;
//   - output:         console.log(e);        |   cout << e << endl;  / cout << e;
//   - arithmetic/compare: + - * / % == != < > <= >= && || !
//   - strings, numbers, booleans (true/false), arrays/vectors [ ... ]
//   - indexing:       name[expr]
//   - if (cond) { } else if (cond) { } else { }
//   - for (init; cond; update) { }   and   for (x of arr) { } (JS) / range-for
//   - while (cond) { }   (bounded for safety)
//   - functions:      function name(a){...}  |  void name(a){...} / auto name(){...}
//   - comments: // ... and /* ... */
//
// Game "built-ins" (start_engine(), drain(x), strike(), etc.) are shared with
// the Python engine and emit GameActions.
// ============================================================================

import type { EvalContext, CodeError, GameAction } from '@/types'

const MAX_STEPS = 20000

type Value = number | string | boolean | Value[] | null
type GameBuiltin = (args: Value[], ctx: EvalContext) => Value

export interface BraceOptions {
  gameFunctions?: Record<string, GameBuiltin>
  flavor: 'javascript' | 'cpp'
}

interface Scope {
  vars: Record<string, Value>
  parent: Scope | null
}

export function runBraceProgram(
  source: string,
  options: BraceOptions
): { context: EvalContext; error: CodeError | null } {
  const ctx: EvalContext = { output: [], variables: {}, actions: [], steps: [] }
  const gameFns = options.gameFunctions ?? {}
  const flavor = options.flavor
  let stepCount = 0

  const userFns: Record<string, { params: string[]; body: Token[] }> = {}

  // --- Tokenize -----------------------------------------------------------
  let tokens: Token[]
  try {
    tokens = tokenize(source)
  } catch (e) {
    return { context: ctx, error: toError(e) }
  }

  const globalScope: Scope = { vars: {}, parent: null }

  try {
    execStatements(tokens, globalScope)
  } catch (e) {
    if (e instanceof StepLimit) {
      return {
        context: snapshotGlobals(ctx, globalScope),
        error: { kind: 'runtime', message: 'Your program ran too long — it may contain a loop that never stops.' },
      }
    }
    return { context: snapshotGlobals(ctx, globalScope), error: toError(e) }
  }

  return { context: snapshotGlobals(ctx, globalScope), error: null }

  // =======================================================================
  function tick() {
    stepCount++
    if (stepCount > MAX_STEPS) throw new StepLimit()
  }

  function snapshotGlobals(c: EvalContext, sc: Scope): EvalContext {
    c.variables = {}
    for (const k of Object.keys(sc.vars)) c.variables[k] = clone(sc.vars[k])
    return c
  }

  // --- Statement execution over a flat token stream with brace nesting ----
  function execStatements(toks: Token[], scope: Scope) {
    let i = 0
    while (i < toks.length) {
      i = execOneStatement(toks, i, scope)
    }
  }

  // Returns index after the consumed statement.
  function execOneStatement(toks: Token[], start: number, scope: Scope): number {
    tick()
    const t = toks[start]
    if (!t) return start + 1

    // standalone block
    if (t.type === 'punct' && t.value === '{') {
      const end = matchBrace(toks, start)
      const inner = toks.slice(start + 1, end)
      execStatements(inner, { vars: {}, parent: scope })
      return end + 1
    }

    if (t.type === 'ident') {
      // keywords
      if (t.value === 'if') return execIf(toks, start, scope)
      if (t.value === 'for') return execFor(toks, start, scope)
      if (t.value === 'while') return execWhile(toks, start, scope)
      if (isFunctionKeyword(t.value)) return defineFunction(toks, start)
      if (isDeclKeyword(t.value)) return execDeclaration(toks, start, scope)
      // C++ output: cout << ... ;
      if (flavor === 'cpp' && t.value === 'cout') return execCout(toks, start, scope)
      if (flavor === 'cpp' && t.value === 'return') return skipToSemicolon(toks, start) + 1
      if (flavor === 'javascript' && t.value === 'return') return skipToSemicolon(toks, start) + 1
    }

    // assignment or expression statement, terminated by ';'
    const end = findSemicolon(toks, start)
    const stmt = toks.slice(start, end)
    execSimple(stmt, scope)
    return end + 1
  }

  function isDeclKeyword(v: string): boolean {
    if (flavor === 'javascript') return v === 'let' || v === 'const' || v === 'var'
    return v === 'int' || v === 'double' || v === 'float' || v === 'string' ||
      v === 'bool' || v === 'auto' || v === 'char' || v === 'long' || v === 'void'
  }
  function isFunctionKeyword(v: string): boolean {
    if (flavor === 'javascript') return v === 'function'
    // C++: treat "void name(...)" and "auto name(...){" and "int name(...){" as fn defs
    return false // handled specially below for C++ via lookahead
  }

  function execDeclaration(toks: Token[], start: number, scope: Scope): number {
    // For C++, a declaration like "int add(int a){...}" is actually a function.
    if (flavor === 'cpp') {
      // lookahead: TYPE IDENT ( ... ) {   => function
      const name = toks[start + 1]
      const paren = toks[start + 2]
      if (name?.type === 'ident' && paren?.type === 'punct' && paren.value === '(') {
        // find matching ) then check for {
        const closeParen = matchParen(toks, start + 2)
        if (toks[closeParen + 1]?.value === '{') {
          return defineCppFunction(toks, start)
        }
      }
    }
    const end = findSemicolon(toks, start)
    // skip the type/let keyword, then it's "name = expr" or just "name"
    const rest = toks.slice(start + 1, end)
    execSimple(rest, scope, /*declare*/ true)
    return end + 1
  }

  function defineFunction(toks: Token[], start: number): number {
    // JS: function name ( params ) { body }
    const name = toks[start + 1]
    if (!name || name.type !== 'ident') throw err('syntax', 'A function needs a name: function name() { ... }', name?.line)
    const openParen = start + 2
    if (toks[openParen]?.value !== '(') throw err('syntax', 'Expected "(" after the function name.', name.line)
    const closeParen = matchParen(toks, openParen)
    const params = parseParamList(toks.slice(openParen + 1, closeParen), false)
    if (toks[closeParen + 1]?.value !== '{') throw err('syntax', 'A function body must start with "{".', name.line)
    const bodyEnd = matchBrace(toks, closeParen + 1)
    userFns[name.value] = { params, body: toks.slice(closeParen + 2, bodyEnd) }
    return bodyEnd + 1
  }

  function defineCppFunction(toks: Token[], start: number): number {
    // TYPE name ( params ) { body }
    const name = toks[start + 1]
    const openParen = start + 2
    const closeParen = matchParen(toks, openParen)
    const params = parseParamList(toks.slice(openParen + 1, closeParen), true)
    const openBrace = closeParen + 1
    const bodyEnd = matchBrace(toks, openBrace)
    userFns[name.value] = { params, body: toks.slice(openBrace + 1, bodyEnd) }
    return bodyEnd + 1
  }

  function parseParamList(toks: Token[], cpp: boolean): string[] {
    if (toks.length === 0) return []
    const parts = splitTopLevel(toks, ',')
    return parts
      .map((p) => {
        const idents = p.filter((t) => t.type === 'ident')
        // cpp: "int x" -> name is last ident; js: "x" -> only ident
        return cpp ? idents[idents.length - 1]?.value : idents[0]?.value
      })
      .filter(Boolean) as string[]
  }

  function execCout(toks: Token[], start: number, scope: Scope): number {
    const end = findSemicolon(toks, start)
    // cout << a << b << endl;  -> split on "<<"
    const inner = toks.slice(start + 1, end)
    const parts = splitTopLevelOp(inner, '<<')
    const pieces: string[] = []
    for (const part of parts) {
      if (part.length === 1 && part[0].type === 'ident' && part[0].value === 'endl') continue
      if (part.length === 0) continue
      const v = evalExpr(part, scope)
      pieces.push(repr(v))
    }
    if (pieces.length) ctx.output.push(pieces.join(''))
    return end + 1
  }

  function execIf(toks: Token[], start: number, scope: Scope): number {
    // if ( cond ) { } (else if (...) {} )* (else {})?
    let i = start
    let taken = false

    const run = (): number => {
      // expects toks[i] == 'if'
      const openParen = i + 1
      if (toks[openParen]?.value !== '(') throw err('syntax', 'Write the condition in parentheses: if (condition) { ... }', toks[i].line)
      const closeParen = matchParen(toks, openParen)
      const cond = evalExpr(toks.slice(openParen + 1, closeParen), scope)
      const openBrace = closeParen + 1
      if (toks[openBrace]?.value !== '{') throw err('syntax', 'The if body must be inside braces { }.', toks[i].line)
      const bodyEnd = matchBrace(toks, openBrace)
      if (!taken && truthy(cond)) {
        execStatements(toks.slice(openBrace + 1, bodyEnd), { vars: {}, parent: scope })
        taken = true
      }
      return bodyEnd + 1
    }

    i = run()

    // chain else / else if
    while (toks[i]?.type === 'ident' && toks[i].value === 'else') {
      if (toks[i + 1]?.type === 'ident' && toks[i + 1].value === 'if') {
        i = i + 1 // point at the inner 'if'
        i = run()
      } else {
        const openBrace = i + 1
        if (toks[openBrace]?.value !== '{') throw err('syntax', 'The else body must be inside braces { }.', toks[i].line)
        const bodyEnd = matchBrace(toks, openBrace)
        if (!taken) execStatements(toks.slice(openBrace + 1, bodyEnd), { vars: {}, parent: scope })
        i = bodyEnd + 1
        break
      }
    }
    return i
  }

  function execFor(toks: Token[], start: number, scope: Scope): number {
    const openParen = start + 1
    if (toks[openParen]?.value !== '(') throw err('syntax', 'A for loop looks like for (init; condition; update) { ... }', toks[start].line)
    const closeParen = matchParen(toks, openParen)
    const header = toks.slice(openParen + 1, closeParen)
    const openBrace = closeParen + 1
    if (toks[openBrace]?.value !== '{') throw err('syntax', 'The for body must be inside braces { }.', toks[start].line)
    const bodyEnd = matchBrace(toks, openBrace)
    const body = toks.slice(openBrace + 1, bodyEnd)

    // Detect range-for:  (x of arr)  JS   |   (TYPE x : arr)  C++
    const ofIdx = header.findIndex((t) => t.type === 'ident' && t.value === 'of')
    const colonIdx = header.findIndex((t) => t.type === 'punct' && t.value === ':')

    const loopScope: Scope = { vars: {}, parent: scope }

    if (flavor === 'javascript' && ofIdx >= 0) {
      const varName = header.filter((t, idx) => idx < ofIdx && t.type === 'ident' && !isDeclKeyword(t.value)).pop()?.value
      const iterable = evalExpr(header.slice(ofIdx + 1), scope)
      const list = toIterable(iterable, toks[start].line)
      for (const item of list) {
        tick()
        if (varName) loopScope.vars[varName] = item
        execStatements(body, { vars: { ...loopScope.vars }, parent: scope })
      }
      return bodyEnd + 1
    }
    if (flavor === 'cpp' && colonIdx >= 0) {
      const beforeColon = header.slice(0, colonIdx).filter((t) => t.type === 'ident')
      const varName = beforeColon[beforeColon.length - 1]?.value
      const iterable = evalExpr(header.slice(colonIdx + 1), scope)
      const list = toIterable(iterable, toks[start].line)
      for (const item of list) {
        tick()
        const s2: Scope = { vars: {}, parent: scope }
        if (varName) s2.vars[varName] = item
        execStatements(body, s2)
      }
      return bodyEnd + 1
    }

    // classic C-style for (init; cond; update)
    const parts = splitTopLevel(header, ';')
    if (parts.length !== 3) throw err('syntax', 'A for loop needs three parts: for (init; condition; update).', toks[start].line)
    // init
    if (parts[0].length) {
      if (parts[0][0].type === 'ident' && isDeclKeyword(parts[0][0].value)) {
        execSimple(parts[0].slice(1), loopScope, true)
      } else {
        execSimple(parts[0], loopScope)
      }
    }
    while (parts[1].length === 0 || truthy(evalExpr(parts[1], loopScope))) {
      tick()
      execStatements(body, { vars: {}, parent: loopScope })
      if (parts[2].length) execSimple(parts[2], loopScope)
      if (parts[1].length === 0) break // avoid infinite empty-cond loops
    }
    return bodyEnd + 1
  }

  function execWhile(toks: Token[], start: number, scope: Scope): number {
    const openParen = start + 1
    if (toks[openParen]?.value !== '(') throw err('syntax', 'A while loop looks like while (condition) { ... }', toks[start].line)
    const closeParen = matchParen(toks, openParen)
    const cond = toks.slice(openParen + 1, closeParen)
    const openBrace = closeParen + 1
    const bodyEnd = matchBrace(toks, openBrace)
    const body = toks.slice(openBrace + 1, bodyEnd)
    while (truthy(evalExpr(cond, scope))) {
      tick()
      execStatements(body, { vars: {}, parent: scope })
    }
    return bodyEnd + 1
  }

  // Simple statement: assignment or bare expression (tokens, no trailing ';')
  function execSimple(toks: Token[], scope: Scope, declare = false) {
    if (toks.length === 0) return
    // assignment target: IDENT = ...  or IDENT[expr] = ...
    const eqIdx = findTopLevelAssign(toks)
    if (eqIdx >= 0) {
      const lhs = toks.slice(0, eqIdx)
      const rhs = toks.slice(eqIdx + 1)
      const value = evalExpr(rhs, scope)
      // index assignment
      if (lhs.length >= 4 && lhs[1]?.value === '[') {
        const name = lhs[0].value
        const closeB = matchBracket(lhs, 1)
        const idxExpr = lhs.slice(2, closeB)
        const arr = lookup(scope, name)
        if (!Array.isArray(arr)) throw err('type', `"${name}" is not an array, so you can't assign to an index of it.`, toks[0].line)
        const idx = asIndex(evalExpr(idxExpr, scope), arr.length, toks[0].line)
        arr[idx] = value
        return
      }
      const name = lhs[0].value
      if (declare) {
        scope.vars[name] = value
      } else {
        assign(scope, name, value, toks[0].line)
      }
      return
    }
    if (declare) {
      // declaration without initializer: int x;
      const name = toks[0]?.value
      if (name) scope.vars[name] = null
      return
    }
    // bare expression (e.g. a function call)
    evalExpr(toks, scope)
  }

  // =======================================================================
  // EXPRESSION EVALUATION (Pratt-ish over tokens)
  // =======================================================================
  function evalExpr(toks: Token[], scope: Scope): Value {
    if (toks.length === 0) throw err('syntax', 'Expected a value here.', undefined)
    const p = new Parser(toks)
    const node = p.parseExpression()
    p.expectEnd()
    return evalNode(node, scope)
  }

  function evalNode(node: Node, scope: Scope): Value {
    switch (node.k) {
      case 'num': return node.v
      case 'str': return node.v
      case 'bool': return node.v
      case 'null': return null
      case 'arr': return node.items.map((n) => evalNode(n, scope))
      case 'id': return lookup(scope, node.name)
      case 'index': {
        const base = evalNode(node.base, scope)
        const idx = evalNode(node.index, scope)
        if (typeof base === 'string') return base[asIndex(idx, base.length, undefined)]
        if (Array.isArray(base)) return base[asIndex(idx, base.length, undefined)]
        throw err('type', 'You can only use [index] on an array or string.', undefined)
      }
      case 'unary': {
        const v = evalNode(node.operand, scope)
        if (node.op === '!') return !truthy(v)
        if (node.op === '-') return -asNum(v)
        return v
      }
      case 'bin': return evalBin(node, scope)
      case 'call': return evalCall(node, scope)
    }
  }

  function evalBin(node: BinNode, scope: Scope): Value {
    if (node.op === '&&') {
      const l = evalNode(node.left, scope)
      return truthy(l) ? evalNode(node.right, scope) : l
    }
    if (node.op === '||') {
      const l = evalNode(node.left, scope)
      return truthy(l) ? l : evalNode(node.right, scope)
    }
    const l = evalNode(node.left, scope)
    const r = evalNode(node.right, scope)
    switch (node.op) {
      case '+': return typeof l === 'string' || typeof r === 'string' ? repr(l) + repr(r) : asNum(l) + asNum(r)
      case '-': return asNum(l) - asNum(r)
      case '*': return asNum(l) * asNum(r)
      case '/': return asNum(l) / asNum(r)
      case '%': return asNum(l) % asNum(r)
      case '==': return looseEq(l, r)
      case '!=': return !looseEq(l, r)
      case '<': return asNum(l) < asNum(r)
      case '>': return asNum(l) > asNum(r)
      case '<=': return asNum(l) <= asNum(r)
      case '>=': return asNum(l) >= asNum(r)
    }
    throw err('syntax', `Unknown operator "${node.op}".`, undefined)
  }

  function evalCall(node: CallNode, scope: Scope): Value {
    const args = node.args.map((a) => evalNode(a, scope))

    // console.log(...)
    if (node.name === 'console.log' || node.name === 'print') {
      ctx.output.push(args.map(repr).join(' '))
      return null
    }
    if (node.name === 'length' || node.name === 'size') {
      const a = args[0]
      if (Array.isArray(a) || typeof a === 'string') return a.length
    }
    if (node.name in gameFns) return gameFns[node.name](args, ctx) ?? null
    if (node.name in userFns) return callUser(node.name, args)
    throw err('name', `The function "${node.name}" doesn't exist here. Check the spelling, or define it first.`, undefined)
  }

  function callUser(name: string, args: Value[]): Value {
    tick()
    const fn = userFns[name]
    if (args.length !== fn.params.length) {
      throw err('type', `"${name}" expects ${fn.params.length} argument(s) but got ${args.length}.`, undefined)
    }
    const local: Scope = { vars: {}, parent: globalScope }
    fn.params.forEach((p, idx) => (local.vars[p] = args[idx]))
    execStatements(fn.body, local)
    return null
  }

  // --- scope helpers ---
  function lookup(scope: Scope, name: string): Value {
    let s: Scope | null = scope
    while (s) {
      if (name in s.vars) return s.vars[name]
      s = s.parent
    }
    throw err('name', `The name "${name}" is not defined. Create it first, or check the spelling.`, undefined)
  }
  function assign(scope: Scope, name: string, value: Value, line?: number) {
    let s: Scope | null = scope
    while (s) {
      if (name in s.vars) { s.vars[name] = value; return }
      s = s.parent
    }
    // implicit global (lenient for learners)
    void line
    scope.vars[name] = value
  }

  function toIterable(v: Value, line?: number): Value[] {
    if (Array.isArray(v)) return v
    if (typeof v === 'string') return v.split('')
    throw err('type', 'A loop needs an array or string to repeat over.', line)
  }
  function asNum(v: Value): number {
    if (typeof v === 'number') return v
    if (typeof v === 'boolean') return v ? 1 : 0
    throw err('type', `Expected a number but got ${describe(v)}.`, undefined)
  }
  function asIndex(v: Value, length: number, line?: number): number {
    const n = Math.trunc(asNum(v))
    let i = n
    if (i < 0) i += length
    if (i < 0 || i >= length) throw err('runtime', `Index ${n} is out of range. Valid positions are 0 to ${length - 1}.`, line)
    return i
  }
}

// ============================================================================
// TOKENIZER
// ============================================================================
interface Token {
  type: 'ident' | 'num' | 'str' | 'punct' | 'op'
  value: string
  line: number
}

function tokenize(src: string): Token[] {
  const out: Token[] = []
  let i = 0
  let line = 1
  const code = src.replace(/\r\n/g, '\n')
  const n = code.length

  const ops = ['<<', '>>', '==', '!=', '<=', '>=', '&&', '||', '::', '+', '-', '*', '/', '%', '<', '>', '!', '=']
  while (i < n) {
    const c = code[i]
    if (c === '\n') { line++; i++; continue }
    if (c === ' ' || c === '\t') { i++; continue }
    // comments
    if (c === '/' && code[i + 1] === '/') { while (i < n && code[i] !== '\n') i++; continue }
    if (c === '/' && code[i + 1] === '*') {
      i += 2
      while (i < n && !(code[i] === '*' && code[i + 1] === '/')) { if (code[i] === '\n') line++; i++ }
      i += 2
      continue
    }
    // preprocessor / using lines (C++) — skip whole line
    if (c === '#') { while (i < n && code[i] !== '\n') i++; continue }
    // strings
    if (c === '"' || c === "'") {
      const quote = c
      i++
      let s = ''
      while (i < n && code[i] !== quote) {
        if (code[i] === '\\') { i++; const e = code[i]; s += e === 'n' ? '\n' : e === 't' ? '\t' : e; i++ }
        else { s += code[i]; i++ }
      }
      if (code[i] !== quote) throw mkErr('syntax', 'A string is missing its closing quote.', line)
      i++
      out.push({ type: 'str', value: s, line })
      continue
    }
    // numbers
    if (/[0-9]/.test(c) || (c === '.' && /[0-9]/.test(code[i + 1] ?? ''))) {
      let num = ''
      while (i < n && /[0-9.]/.test(code[i])) { num += code[i]; i++ }
      out.push({ type: 'num', value: num, line })
      continue
    }
    // identifiers
    if (/[A-Za-z_]/.test(c)) {
      let id = ''
      while (i < n && /[A-Za-z0-9_]/.test(code[i])) { id += code[i]; i++ }
      // handle console.log and std::  as single idents
      if (id === 'console' && code[i] === '.' ) {
        let rest = ''
        i++ // dot
        while (i < n && /[A-Za-z0-9_]/.test(code[i])) { rest += code[i]; i++ }
        out.push({ type: 'ident', value: 'console.' + rest, line })
        continue
      }
      if (id === 'std' && code[i] === ':' && code[i + 1] === ':') {
        i += 2
        let rest = ''
        while (i < n && /[A-Za-z0-9_]/.test(code[i])) { rest += code[i]; i++ }
        out.push({ type: 'ident', value: rest, line }) // treat std::cout as cout
        continue
      }
      out.push({ type: 'ident', value: id, line })
      continue
    }
    // method call .length / .size()  -> fold ".name" into a call-ish token
    if (c === '.') {
      // handled generically below as punct; our expr parser treats .x() specially? keep simple:
      // support arr.length and str.length by converting to length(arr) at parse? skip — rare in tasks
      out.push({ type: 'punct', value: '.', line })
      i++
      continue
    }
    // multi-char operators
    let matched = ''
    for (const op of ops) {
      if (code.startsWith(op, i)) { matched = op; break }
    }
    if (matched) {
      // '=' alone is punct(assign); others are ops
      if (matched === '=') out.push({ type: 'punct', value: '=', line })
      else out.push({ type: 'op', value: matched, line })
      i += matched.length
      continue
    }
    // punctuation
    if ('(){}[];,:'.includes(c)) {
      out.push({ type: 'punct', value: c, line })
      i++
      continue
    }
    throw mkErr('syntax', `Unexpected character "${c}".`, line)
  }
  return out
}

// ============================================================================
// EXPRESSION PARSER (over token slice)
// ============================================================================
type Node =
  | { k: 'num'; v: number }
  | { k: 'str'; v: string }
  | { k: 'bool'; v: boolean }
  | { k: 'null' }
  | { k: 'id'; name: string }
  | { k: 'arr'; items: Node[] }
  | { k: 'index'; base: Node; index: Node }
  | { k: 'unary'; op: '!' | '-'; operand: Node }
  | BinNode
  | CallNode

interface BinNode { k: 'bin'; op: string; left: Node; right: Node }
interface CallNode { k: 'call'; name: string; args: Node[] }

class Parser {
  private pos = 0
  constructor(private toks: Token[]) {}

  parseExpression(): Node { return this.parseOr() }
  private parseOr(): Node {
    let left = this.parseAnd()
    while (this.isOp('||')) { this.pos++; left = { k: 'bin', op: '||', left, right: this.parseAnd() } }
    return left
  }
  private parseAnd(): Node {
    let left = this.parseEquality()
    while (this.isOp('&&')) { this.pos++; left = { k: 'bin', op: '&&', left, right: this.parseEquality() } }
    return left
  }
  private parseEquality(): Node {
    let left = this.parseCompareOp()
    while (this.isOp('==') || this.isOp('!=')) { const op = this.toks[this.pos++].value; left = { k: 'bin', op, left, right: this.parseCompareOp() } }
    return left
  }
  private parseCompareOp(): Node {
    let left = this.parseAdd()
    while (this.isOp('<') || this.isOp('>') || this.isOp('<=') || this.isOp('>=')) {
      const op = this.toks[this.pos++].value
      left = { k: 'bin', op, left, right: this.parseAdd() }
    }
    return left
  }
  private parseAdd(): Node {
    let left = this.parseMul()
    while (this.isOp('+') || this.isOp('-')) { const op = this.toks[this.pos++].value; left = { k: 'bin', op, left, right: this.parseMul() } }
    return left
  }
  private parseMul(): Node {
    let left = this.parseUnary()
    while (this.isOp('*') || this.isOp('/') || this.isOp('%')) { const op = this.toks[this.pos++].value; left = { k: 'bin', op, left, right: this.parseUnary() } }
    return left
  }
  private parseUnary(): Node {
    if (this.isOp('!')) { this.pos++; return { k: 'unary', op: '!', operand: this.parseUnary() } }
    if (this.isOp('-')) { this.pos++; return { k: 'unary', op: '-', operand: this.parseUnary() } }
    return this.parsePostfix()
  }
  private parsePostfix(): Node {
    let node = this.parsePrimary()
    for (;;) {
      const t = this.peek()
      if (t?.type === 'punct' && t.value === '[') {
        this.pos++
        const index = this.parseExpression()
        this.expectPunct(']')
        node = { k: 'index', base: node, index }
      } else if (t?.type === 'punct' && t.value === '.') {
        // method/property: .length  / .size()
        this.pos++
        const name = this.toks[this.pos++]
        // optional ()
        if (this.peek()?.value === '(') { this.pos++; this.expectPunct(')') }
        if (name?.value === 'length' || name?.value === 'size') {
          node = { k: 'call', name: 'length', args: [node] }
        }
      } else break
    }
    return node
  }
  private parsePrimary(): Node {
    const t = this.peek()
    if (!t) throw mkErr('syntax', 'Unexpected end of expression.', undefined)
    if (t.type === 'num') { this.pos++; return { k: 'num', v: parseFloat(t.value) } }
    if (t.type === 'str') { this.pos++; return { k: 'str', v: t.value } }
    if (t.type === 'punct' && t.value === '(') {
      this.pos++
      const node = this.parseExpression()
      this.expectPunct(')')
      return node
    }
    if (t.type === 'punct' && t.value === '[') {
      this.pos++
      const items: Node[] = []
      if (this.peek()?.value !== ']') {
        for (;;) {
          items.push(this.parseExpression())
          if (this.peek()?.value === ',') { this.pos++; continue }
          break
        }
      }
      this.expectPunct(']')
      return { k: 'arr', items }
    }
    if (t.type === 'punct' && t.value === '{') {
      // C++ brace-init list {a, b} -> treat as array
      this.pos++
      const items: Node[] = []
      if (this.peek()?.value !== '}') {
        for (;;) {
          items.push(this.parseExpression())
          if (this.peek()?.value === ',') { this.pos++; continue }
          break
        }
      }
      this.expectPunct('}')
      return { k: 'arr', items }
    }
    if (t.type === 'ident') {
      this.pos++
      if (t.value === 'true') return { k: 'bool', v: true }
      if (t.value === 'false') return { k: 'bool', v: false }
      if (t.value === 'null' || t.value === 'nullptr' || t.value === 'None') return { k: 'null' }
      // call?
      if (this.peek()?.type === 'punct' && this.peek()!.value === '(') {
        this.pos++
        const args: Node[] = []
        if (this.peek()?.value !== ')') {
          for (;;) {
            args.push(this.parseExpression())
            if (this.peek()?.value === ',') { this.pos++; continue }
            break
          }
        }
        this.expectPunct(')')
        return { k: 'call', name: t.value, args }
      }
      return { k: 'id', name: t.value }
    }
    throw mkErr('syntax', `Unexpected token "${t.value}".`, t.line)
  }

  expectEnd() {
    if (this.pos < this.toks.length) {
      const t = this.toks[this.pos]
      if (t.type === 'punct' && t.value === '=') {
        throw mkErr('syntax', '"=" assigns a value. To compare two values, use "==".', t.line)
      }
      throw mkErr('syntax', `Unexpected extra token "${t.value}".`, t.line)
    }
  }

  private peek(): Token | undefined { return this.toks[this.pos] }
  private isOp(op: string): boolean { const t = this.toks[this.pos]; return !!t && t.type === 'op' && t.value === op }
  private expectPunct(v: string) {
    const t = this.toks[this.pos]
    if (!t || t.value !== v) throw mkErr('syntax', `Expected "${v}".`, t?.line)
    this.pos++
  }
}

// ============================================================================
// TOKEN-STREAM HELPERS
// ============================================================================
function matchBrace(toks: Token[], openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < toks.length; i++) {
    if (toks[i].value === '{') depth++
    else if (toks[i].value === '}') { depth--; if (depth === 0) return i }
  }
  throw mkErr('syntax', 'A "{" is missing its matching "}".', toks[openIdx]?.line)
}
function matchParen(toks: Token[], openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < toks.length; i++) {
    if (toks[i].value === '(') depth++
    else if (toks[i].value === ')') { depth--; if (depth === 0) return i }
  }
  throw mkErr('syntax', 'A "(" is missing its matching ")".', toks[openIdx]?.line)
}
function matchBracket(toks: Token[], openIdx: number): number {
  let depth = 0
  for (let i = openIdx; i < toks.length; i++) {
    if (toks[i].value === '[') depth++
    else if (toks[i].value === ']') { depth--; if (depth === 0) return i }
  }
  throw mkErr('syntax', 'A "[" is missing its matching "]".', toks[openIdx]?.line)
}
function findSemicolon(toks: Token[], start: number): number {
  let depth = 0
  for (let i = start; i < toks.length; i++) {
    const v = toks[i].value
    if (v === '(' || v === '{' || v === '[') depth++
    else if (v === ')' || v === '}' || v === ']') depth--
    else if (v === ';' && depth === 0) return i
  }
  return toks.length
}
function skipToSemicolon(toks: Token[], start: number): number {
  return findSemicolon(toks, start)
}
function findTopLevelAssign(toks: Token[]): number {
  let depth = 0
  for (let i = 0; i < toks.length; i++) {
    const v = toks[i].value
    if (v === '(' || v === '{' || v === '[') depth++
    else if (v === ')' || v === '}' || v === ']') depth--
    else if (toks[i].type === 'punct' && v === '=' && depth === 0) return i
  }
  return -1
}
function splitTopLevel(toks: Token[], sep: string): Token[][] {
  const parts: Token[][] = []
  let cur: Token[] = []
  let depth = 0
  for (const t of toks) {
    if (t.value === '(' || t.value === '{' || t.value === '[') depth++
    else if (t.value === ')' || t.value === '}' || t.value === ']') depth--
    if (depth === 0 && t.value === sep && t.type === 'punct') { parts.push(cur); cur = [] }
    else cur.push(t)
  }
  parts.push(cur)
  return parts
}
function splitTopLevelOp(toks: Token[], sep: string): Token[][] {
  const parts: Token[][] = []
  let cur: Token[] = []
  let depth = 0
  for (const t of toks) {
    if (t.value === '(' || t.value === '{' || t.value === '[') depth++
    else if (t.value === ')' || t.value === '}' || t.value === ']') depth--
    if (depth === 0 && t.value === sep && t.type === 'op') { parts.push(cur); cur = [] }
    else cur.push(t)
  }
  parts.push(cur)
  return parts
}

// ============================================================================
// ERRORS + VALUE HELPERS
// ============================================================================
class StepLimit extends Error {}
class BErr extends Error {
  constructor(public kind: CodeError['kind'], public friendly: string, public lineNo?: number) {
    super(friendly)
  }
}
function err(kind: CodeError['kind'], msg: string, line?: number): BErr { return new BErr(kind, msg, line) }
function mkErr(kind: CodeError['kind'], msg: string, line?: number): BErr { return new BErr(kind, msg, line) }
function toError(e: unknown): CodeError {
  if (e instanceof BErr) return { kind: e.kind, line: e.lineNo, message: e.friendly }
  return { kind: 'runtime', message: 'Something went wrong while running your program.', rawMessage: String(e) }
}

function truthy(v: Value): boolean {
  if (v === null) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  if (Array.isArray(v)) return v.length > 0
  return true
}
function looseEq(a: Value, b: Value): boolean {
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => looseEq(x, b[i]))
  return a === b
}
function describe(v: Value): string {
  if (v === null) return 'null'
  if (Array.isArray(v)) return 'an array'
  if (typeof v === 'string') return 'a string'
  if (typeof v === 'boolean') return 'a boolean'
  return 'a number'
}
function repr(v: Value): string {
  if (v === null) return 'null'
  if (typeof v === 'boolean') return v ? 'true' : 'false'
  if (Array.isArray(v)) return '[' + v.map(repr).join(', ') + ']'
  return String(v)
}
function clone(v: Value): Value {
  if (Array.isArray(v)) return v.map(clone)
  return v
}
