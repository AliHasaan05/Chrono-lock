// ============================================================================
// CHRONO-LOCK SAFE CODE INTERPRETER
// ----------------------------------------------------------------------------
// A small, SANDBOXED interpreter for a Python-like teaching subset. It never
// uses eval() on raw learner input and never touches the DOM, network, or any
// privileged API. It parses and executes a limited grammar and produces an
// EvalContext (output, variables, actions, debug steps) plus differentiated
// errors so CHRONO can teach instead of just failing.
//
// Supported (teaching subset, Python syntax):
//   - assignment:            x = <expr>
//   - print(<expr>)
//   - arithmetic/compare:    + - * / // % == != < > <= >= and or not
//   - strings, ints, floats, booleans (True/False), lists [ ... ]
//   - indexing:              name[expr]
//   - if / elif / else       (indentation based)
//   - for x in <iterable>:   (lists and range(...))
//   - while <cond>:          (bounded for safety)
//   - def name(params): ...  + calling user + built-in "game" functions
//   - comments (#)
//
// Built-in "game" functions emit GameActions instead of doing anything unsafe.
// ============================================================================

import type { EvalContext, CodeError, GameAction, DebugStep } from '@/types'

const MAX_STEPS = 5000 // guards against infinite loops

type Value = number | string | boolean | Value[] | null

interface Scope {
  vars: Record<string, Value>
}

// Game built-ins available to learner code. Each returns a GameAction (or null)
// and optionally a return value. These are the "abilities" the city exposes.
type GameBuiltin = (args: Value[], ctx: EvalContext) => Value

export interface InterpreterOptions {
  // Extra game functions for a specific mission (e.g. drain, disable).
  gameFunctions?: Record<string, GameBuiltin>
}

export function runProgram(
  source: string,
  options: InterpreterOptions = {}
): { context: EvalContext; error: CodeError | null } {
  const ctx: EvalContext = {
    output: [],
    variables: {},
    actions: [],
    steps: [],
  }

  const gameFns = options.gameFunctions ?? {}
  let stepCount = 0

  // --- Tokenize into logical lines with indentation levels ---------------
  const rawLines = source.replace(/\r\n/g, '\n').split('\n')
  interface Line {
    indent: number
    text: string
    lineNo: number
  }
  const lines: Line[] = []
  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i]
    // strip comments (naive but fine for the teaching subset)
    const noComment = stripComment(raw)
    if (noComment.trim() === '') continue
    const indent = countIndent(noComment)
    lines.push({ indent, text: noComment.trim(), lineNo: i + 1 })
  }

  const scope: Scope = { vars: ctx.variables as Record<string, Value> }
  const userFns: Record<string, { params: string[]; body: Line[] }> = {}

  let error: CodeError | null = null

  try {
    execBlock(lines, 0, lines.length, 0, scope)
  } catch (e) {
    if (e instanceof InterpError) {
      error = e.toCodeError()
    } else if (e instanceof StepLimit) {
      error = {
        kind: 'runtime',
        message:
          'Your program ran too long — it may contain a loop that never stops.',
        rawMessage: 'Step limit exceeded',
      }
    } else {
      error = {
        kind: 'runtime',
        message: 'Something went wrong while running your program.',
        rawMessage: String(e),
      }
    }
  }

  return { context: ctx, error }

  // =======================================================================
  // BLOCK EXECUTION
  // =======================================================================
  function execBlock(
    all: Line[],
    start: number,
    end: number,
    baseIndent: number,
    sc: Scope
  ): void {
    let i = start
    while (i < end) {
      const line = all[i]
      if (line.indent < baseIndent) return
      if (line.indent > baseIndent) {
        throw new InterpError(
          'syntax',
          'This line is indented more than expected. Check your spacing.',
          line.lineNo
        )
      }

      // function definition
      if (line.text.startsWith('def ')) {
        const header = line.text.slice(4).trim()
        const m = header.match(/^([A-Za-z_]\w*)\s*\(([^)]*)\)\s*:$/)
        if (!m) {
          throw new InterpError(
            'syntax',
            'A function definition looks like "def name():". Check the parentheses and colon.',
            line.lineNo
          )
        }
        const name = m[1]
        const params = m[2].trim() === '' ? [] : m[2].split(',').map((s) => s.trim())
        const { body, next } = collectBody(all, i + 1, end, baseIndent)
        userFns[name] = { params, body }
        i = next
        continue
      }

      // if / elif / else chain
      if (line.text.startsWith('if ')) {
        i = execIf(all, i, end, baseIndent, sc)
        continue
      }

      // for loop
      if (line.text.startsWith('for ')) {
        i = execFor(all, i, end, baseIndent, sc)
        continue
      }

      // while loop
      if (line.text.startsWith('while ')) {
        i = execWhile(all, i, end, baseIndent, sc)
        continue
      }

      // simple statement
      execStatement(line, sc)
      i++
    }
  }

  function collectBody(
    all: Line[],
    start: number,
    end: number,
    headerIndent: number
  ): { body: Line[]; next: number } {
    if (start >= end || all[start].indent <= headerIndent) {
      throw new InterpError(
        'syntax',
        'This block is empty. Code that belongs inside it must be indented on the next line.',
        start < end ? all[start].lineNo : all[start - 1].lineNo
      )
    }
    const bodyIndent = all[start].indent
    let i = start
    while (i < end && all[i].indent >= bodyIndent) i++
    return { body: all.slice(start, i), next: i }
  }

  function execIf(
    all: Line[],
    idx: number,
    end: number,
    baseIndent: number,
    sc: Scope
  ): number {
    let i = idx
    let branchTaken = false

    // if
    let condText = extractCondition(all[i], 'if')
    let cond = truthy(evalExpr(condText, sc, all[i].lineNo))
    let { body, next } = collectBody(all, i + 1, end, baseIndent)
    if (cond) {
      execBlock(body, 0, body.length, body[0].indent, sc)
      branchTaken = true
    }
    i = next

    // elif*
    while (i < end && all[i].indent === baseIndent && all[i].text.startsWith('elif ')) {
      const elifCond = extractCondition(all[i], 'elif')
      const c = collectBody(all, i + 1, end, baseIndent)
      if (!branchTaken && truthy(evalExpr(elifCond, sc, all[i].lineNo))) {
        execBlock(c.body, 0, c.body.length, c.body[0].indent, sc)
        branchTaken = true
      }
      i = c.next
    }

    // else
    if (i < end && all[i].indent === baseIndent && all[i].text.replace(/\s/g, '') === 'else:') {
      const c = collectBody(all, i + 1, end, baseIndent)
      if (!branchTaken) {
        execBlock(c.body, 0, c.body.length, c.body[0].indent, sc)
      }
      i = c.next
    }

    return i
  }

  function execFor(
    all: Line[],
    idx: number,
    end: number,
    baseIndent: number,
    sc: Scope
  ): number {
    const header = all[idx].text.slice(4).trim().replace(/:$/, '')
    const m = header.match(/^([A-Za-z_]\w*)\s+in\s+(.+)$/)
    if (!m || !all[idx].text.trimEnd().endsWith(':')) {
      throw new InterpError(
        'syntax',
        'A for loop looks like "for item in things:". Check the keyword "in" and the colon.',
        all[idx].lineNo
      )
    }
    const varName = m[1]
    const iterable = evalExpr(m[2], sc, all[idx].lineNo)
    const list = toIterable(iterable, all[idx].lineNo)
    const { body, next } = collectBody(all, idx + 1, end, baseIndent)

    for (const item of list) {
      tick()
      sc.vars[varName] = item
      execBlock(body, 0, body.length, body[0].indent, sc)
    }
    return next
  }

  function execWhile(
    all: Line[],
    idx: number,
    end: number,
    baseIndent: number,
    sc: Scope
  ): number {
    const condText = extractCondition(all[idx], 'while')
    const { body, next } = collectBody(all, idx + 1, end, baseIndent)
    while (truthy(evalExpr(condText, sc, all[idx].lineNo))) {
      tick()
      execBlock(body, 0, body.length, body[0].indent, sc)
    }
    return next
  }

  // =======================================================================
  // STATEMENTS
  // =======================================================================
  function execStatement(line: Line, sc: Scope): void {
    tick()
    const text = line.text

    // assignment:  name = expr   OR   name[idx] = expr
    const assignMatch = matchAssignment(text)
    if (assignMatch) {
      const { target, index, exprText } = assignMatch
      const value = evalExpr(exprText, sc, line.lineNo)
      if (index === null) {
        sc.vars[target] = value
        recordStep(line, sc, undefined, {
          type: 'SET_VARIABLE',
          name: target,
          value,
        })
      } else {
        const arr = sc.vars[target]
        if (!Array.isArray(arr)) {
          throw new InterpError(
            'type',
            `"${target}" is not a list, so you can't assign to an index of it.`,
            line.lineNo
          )
        }
        const i = asIndex(evalExpr(index, sc, line.lineNo), arr.length, line.lineNo)
        arr[i] = value
        recordStep(line, sc)
      }
      return
    }

    // bare expression (likely a function call like print(...) or open_door())
    const result = evalExpr(text, sc, line.lineNo)
    recordStep(line, sc)
    void result
  }

  // =======================================================================
  // EXPRESSION EVALUATION  (recursive descent over the teaching subset)
  // =======================================================================
  function evalExpr(src: string, sc: Scope, lineNo: number): Value {
    const parser = new ExprParser(src, lineNo)
    const node = parser.parseExpression()
    parser.expectEnd()
    return evalNode(node, sc, lineNo)
  }

  function evalNode(node: Node, sc: Scope, lineNo: number): Value {
    switch (node.kind) {
      case 'num':
        return node.value
      case 'str':
        return node.value
      case 'bool':
        return node.value
      case 'none':
        return null
      case 'list':
        return node.items.map((it) => evalNode(it, sc, lineNo))
      case 'ident': {
        if (!(node.name in sc.vars)) {
          throw new InterpError(
            'name',
            `The name "${node.name}" is not defined. Did you create it with "${node.name} = ..." first, or spell it differently?`,
            lineNo
          )
        }
        return sc.vars[node.name]
      }
      case 'index': {
        const base = evalNode(node.base, sc, lineNo)
        const idx = evalNode(node.index, sc, lineNo)
        if (typeof base === 'string') {
          const i = asIndex(idx, base.length, lineNo)
          return base[i]
        }
        if (Array.isArray(base)) {
          const i = asIndex(idx, base.length, lineNo)
          return base[i]
        }
        throw new InterpError(
          'type',
          'You can only use [index] on a list or a string.',
          lineNo
        )
      }
      case 'unary': {
        const v = evalNode(node.operand, sc, lineNo)
        if (node.op === 'not') return !truthy(v)
        if (node.op === '-') return -asNumber(v, lineNo)
        return v
      }
      case 'binary':
        return evalBinary(node, sc, lineNo)
      case 'call':
        return evalCall(node, sc, lineNo)
    }
  }

  function evalBinary(node: BinaryNode, sc: Scope, lineNo: number): Value {
    // logical short-circuit
    if (node.op === 'and') {
      const l = evalNode(node.left, sc, lineNo)
      return truthy(l) ? evalNode(node.right, sc, lineNo) : l
    }
    if (node.op === 'or') {
      const l = evalNode(node.left, sc, lineNo)
      return truthy(l) ? l : evalNode(node.right, sc, lineNo)
    }

    const l = evalNode(node.left, sc, lineNo)
    const r = evalNode(node.right, sc, lineNo)

    switch (node.op) {
      case '+':
        if (typeof l === 'string' || typeof r === 'string') {
          return String(l) + String(r)
        }
        return asNumber(l, lineNo) + asNumber(r, lineNo)
      case '-':
        return asNumber(l, lineNo) - asNumber(r, lineNo)
      case '*':
        if (typeof l === 'string') return l.repeat(asNumber(r, lineNo))
        return asNumber(l, lineNo) * asNumber(r, lineNo)
      case '/':
        return asNumber(l, lineNo) / asNumber(r, lineNo)
      case '//':
        return Math.floor(asNumber(l, lineNo) / asNumber(r, lineNo))
      case '%':
        return asNumber(l, lineNo) % asNumber(r, lineNo)
      case '==':
        return looseEqual(l, r)
      case '!=':
        return !looseEqual(l, r)
      case '<':
        return asNumber(l, lineNo) < asNumber(r, lineNo)
      case '>':
        return asNumber(l, lineNo) > asNumber(r, lineNo)
      case '<=':
        return asNumber(l, lineNo) <= asNumber(r, lineNo)
      case '>=':
        return asNumber(l, lineNo) >= asNumber(r, lineNo)
    }
    throw new InterpError('syntax', `Unknown operator "${node.op}".`, lineNo)
  }

  function evalCall(node: CallNode, sc: Scope, lineNo: number): Value {
    const args = node.args.map((a) => evalNode(a, sc, lineNo))

    // print
    if (node.name === 'print') {
      ctx.output.push(args.map(reprForPrint).join(' '))
      recordStepLine(lineNo, { type: 'LOG', message: args.map(reprForPrint).join(' ') })
      return null
    }
    // range(stop) / range(start, stop) / range(start, stop, step)
    if (node.name === 'range') {
      return makeRange(args, lineNo)
    }
    // len
    if (node.name === 'len') {
      const a = args[0]
      if (Array.isArray(a) || typeof a === 'string') return a.length
      throw new InterpError('type', 'len() needs a list or string.', lineNo)
    }
    // str / int / float conversions
    if (node.name === 'str') return String(args[0])
    if (node.name === 'int') return Math.trunc(asNumber(args[0], lineNo))
    if (node.name === 'float') return asNumber(args[0], lineNo)

    // game built-ins
    if (node.name in gameFns) {
      return gameFns[node.name](args, ctx) ?? null
    }

    // user-defined function
    if (node.name in userFns) {
      return callUserFn(node.name, args, lineNo)
    }

    throw new InterpError(
      'name',
      `The function "${node.name}" doesn't exist here. Check the spelling, or define it with "def ${node.name}():".`,
      lineNo
    )
  }

  function callUserFn(name: string, args: Value[], lineNo: number): Value {
    tick()
    const fn = userFns[name]
    if (args.length !== fn.params.length) {
      throw new InterpError(
        'type',
        `"${name}" expects ${fn.params.length} argument(s) but got ${args.length}.`,
        lineNo
      )
    }
    const local: Scope = { vars: { ...scope.vars } }
    fn.params.forEach((p, idx) => (local.vars[p] = args[idx]))
    execBlock(fn.body, 0, fn.body.length, fn.body[0].indent, local)
    // teaching subset: no explicit return value plumbing beyond side effects
    return null
  }

  // =======================================================================
  // HELPERS
  // =======================================================================
  function tick() {
    stepCount++
    if (stepCount > MAX_STEPS) throw new StepLimit()
  }

  function recordStep(line: Line, sc: Scope, note?: string, action?: GameAction) {
    const snapshot: Record<string, unknown> = {}
    for (const k of Object.keys(sc.vars)) snapshot[k] = clone(sc.vars[k])
    const step: DebugStep = {
      line: line.lineNo,
      code: line.text,
      variables: snapshot,
      note,
      action,
    }
    ctx.steps.push(step)
  }

  function recordStepLine(lineNo: number, action?: GameAction) {
    const snapshot: Record<string, unknown> = {}
    for (const k of Object.keys(scope.vars)) snapshot[k] = clone(scope.vars[k])
    ctx.steps.push({ line: lineNo, code: '', variables: snapshot, action })
  }

  function makeRange(args: Value[], lineNo: number): number[] {
    const nums = args.map((a) => asNumber(a, lineNo))
    let start = 0,
      stop = 0,
      step = 1
    if (nums.length === 1) stop = nums[0]
    else if (nums.length === 2) [start, stop] = nums
    else if (nums.length === 3) [start, stop, step] = nums
    else throw new InterpError('type', 'range() takes 1 to 3 arguments.', lineNo)
    const out: number[] = []
    if (step === 0) throw new InterpError('runtime', 'range() step cannot be 0.', lineNo)
    if (step > 0) for (let i = start; i < stop; i += step) out.push(i)
    else for (let i = start; i > stop; i += step) out.push(i)
    return out
  }

  function toIterable(v: Value, lineNo: number): Value[] {
    if (Array.isArray(v)) return v
    if (typeof v === 'string') return v.split('')
    throw new InterpError(
      'type',
      'A for loop needs a list, a string, or range(...) to repeat over.',
      lineNo
    )
  }

  function asNumber(v: Value, lineNo: number): number {
    if (typeof v === 'number') return v
    if (typeof v === 'boolean') return v ? 1 : 0
    throw new InterpError(
      'type',
      `Expected a number but got ${describeType(v)}.`,
      lineNo
    )
  }

  function asIndex(v: Value, length: number, lineNo: number): number {
    const n = asNumber(v, lineNo)
    let i = Math.trunc(n)
    if (i < 0) i += length
    if (i < 0 || i >= length) {
      throw new InterpError(
        'runtime',
        `Index ${n} is out of range. Valid positions are 0 to ${length - 1}.`,
        lineNo
      )
    }
    return i
  }
}

// ============================================================================
// EXPRESSION PARSER
// ============================================================================
type Node =
  | { kind: 'num'; value: number }
  | { kind: 'str'; value: string }
  | { kind: 'bool'; value: boolean }
  | { kind: 'none' }
  | { kind: 'ident'; name: string }
  | { kind: 'list'; items: Node[] }
  | { kind: 'index'; base: Node; index: Node }
  | { kind: 'unary'; op: 'not' | '-'; operand: Node }
  | BinaryNode
  | CallNode

interface BinaryNode {
  kind: 'binary'
  op: string
  left: Node
  right: Node
}
interface CallNode {
  kind: 'call'
  name: string
  args: Node[]
}

class ExprParser {
  private pos = 0
  constructor(private src: string, private lineNo: number) {}

  parseExpression(): Node {
    return this.parseOr()
  }

  private parseOr(): Node {
    let left = this.parseAnd()
    while (this.matchKeyword('or')) {
      const right = this.parseAnd()
      left = { kind: 'binary', op: 'or', left, right }
    }
    return left
  }
  private parseAnd(): Node {
    let left = this.parseNot()
    while (this.matchKeyword('and')) {
      const right = this.parseNot()
      left = { kind: 'binary', op: 'and', left, right }
    }
    return left
  }
  private parseNot(): Node {
    if (this.matchKeyword('not')) {
      return { kind: 'unary', op: 'not', operand: this.parseNot() }
    }
    return this.parseComparison()
  }
  private parseComparison(): Node {
    let left = this.parseAdd()
    for (;;) {
      const op = this.matchOperator(['==', '!=', '<=', '>=', '<', '>'])
      if (!op) break
      const right = this.parseAdd()
      left = { kind: 'binary', op, left, right }
    }
    return left
  }
  private parseAdd(): Node {
    let left = this.parseMul()
    for (;;) {
      const op = this.matchOperator(['+', '-'])
      if (!op) break
      const right = this.parseMul()
      left = { kind: 'binary', op, left, right }
    }
    return left
  }
  private parseMul(): Node {
    let left = this.parseUnary()
    for (;;) {
      const op = this.matchOperator(['//', '*', '/', '%'])
      if (!op) break
      const right = this.parseUnary()
      left = { kind: 'binary', op, left, right }
    }
    return left
  }
  private parseUnary(): Node {
    if (this.matchOperator(['-'])) {
      return { kind: 'unary', op: '-', operand: this.parseUnary() }
    }
    return this.parsePostfix()
  }
  private parsePostfix(): Node {
    let node = this.parsePrimary()
    for (;;) {
      this.skipWs()
      if (this.peek() === '[') {
        this.pos++
        const index = this.parseExpression()
        this.skipWs()
        this.expectChar(']')
        node = { kind: 'index', base: node, index }
      } else {
        break
      }
    }
    return node
  }
  private parsePrimary(): Node {
    this.skipWs()
    const ch = this.peek()
    if (ch === '') this.err('Unexpected end of expression.')

    // parenthesis
    if (ch === '(') {
      this.pos++
      const node = this.parseExpression()
      this.skipWs()
      this.expectChar(')')
      return node
    }
    // list
    if (ch === '[') {
      this.pos++
      const items: Node[] = []
      this.skipWs()
      if (this.peek() !== ']') {
        for (;;) {
          items.push(this.parseExpression())
          this.skipWs()
          if (this.peek() === ',') {
            this.pos++
            continue
          }
          break
        }
      }
      this.skipWs()
      this.expectChar(']')
      return { kind: 'list', items }
    }
    // string
    if (ch === '"' || ch === "'") {
      return { kind: 'str', value: this.readString(ch) }
    }
    // number
    if (/[0-9]/.test(ch) || (ch === '.' && /[0-9]/.test(this.src[this.pos + 1] ?? ''))) {
      return { kind: 'num', value: this.readNumber() }
    }
    // identifier / keyword / call
    if (/[A-Za-z_]/.test(ch)) {
      const name = this.readIdent()
      if (name === 'True') return { kind: 'bool', value: true }
      if (name === 'False') return { kind: 'bool', value: false }
      if (name === 'None') return { kind: 'none' }
      this.skipWs()
      if (this.peek() === '(') {
        this.pos++
        const args: Node[] = []
        this.skipWs()
        if (this.peek() !== ')') {
          for (;;) {
            args.push(this.parseExpression())
            this.skipWs()
            if (this.peek() === ',') {
              this.pos++
              continue
            }
            break
          }
        }
        this.skipWs()
        this.expectChar(')')
        return { kind: 'call', name, args }
      }
      return { kind: 'ident', name }
    }
    this.err(`Unexpected character "${ch}".`)
  }

  expectEnd() {
    this.skipWs()
    if (this.pos < this.src.length) {
      // Common beginner mistake: single "=" used as comparison.
      if (this.peek() === '=') {
        throw new InterpError(
          'syntax',
          '"=" assigns a value. To compare two values, use "==".',
          this.lineNo
        )
      }
      this.err(`Unexpected extra characters: "${this.src.slice(this.pos)}".`)
    }
  }

  // --- low level ---
  private peek(): string {
    return this.src[this.pos] ?? ''
  }
  private skipWs() {
    while (/\s/.test(this.src[this.pos] ?? '')) this.pos++
  }
  private expectChar(c: string) {
    this.skipWs()
    if (this.peek() !== c) this.err(`Expected "${c}".`)
    this.pos++
  }
  private matchKeyword(kw: string): boolean {
    this.skipWs()
    const slice = this.src.slice(this.pos, this.pos + kw.length)
    const after = this.src[this.pos + kw.length] ?? ''
    if (slice === kw && !/[A-Za-z0-9_]/.test(after)) {
      this.pos += kw.length
      return true
    }
    return false
  }
  private matchOperator(ops: string[]): string | null {
    this.skipWs()
    for (const op of ops) {
      if (this.src.startsWith(op, this.pos)) {
        // avoid matching "=" inside "=="
        this.pos += op.length
        return op
      }
    }
    return null
  }
  private readString(quote: string): string {
    this.pos++ // opening quote
    let out = ''
    while (this.pos < this.src.length && this.src[this.pos] !== quote) {
      if (this.src[this.pos] === '\\') {
        this.pos++
        const esc = this.src[this.pos]
        out += esc === 'n' ? '\n' : esc === 't' ? '\t' : esc
      } else {
        out += this.src[this.pos]
      }
      this.pos++
    }
    if (this.src[this.pos] !== quote) this.err('A string is missing its closing quote.')
    this.pos++ // closing quote
    return out
  }
  private readNumber(): number {
    const start = this.pos
    while (/[0-9.]/.test(this.src[this.pos] ?? '')) this.pos++
    return parseFloat(this.src.slice(start, this.pos))
  }
  private readIdent(): string {
    const start = this.pos
    while (/[A-Za-z0-9_]/.test(this.src[this.pos] ?? '')) this.pos++
    return this.src.slice(start, this.pos)
  }
  private err(msg: string): never {
    throw new InterpError('syntax', msg, this.lineNo)
  }
}

// ============================================================================
// ERRORS
// ============================================================================
class InterpError extends Error {
  constructor(
    public kind: CodeError['kind'],
    public friendly: string,
    public lineNo?: number
  ) {
    super(friendly)
  }
  toCodeError(): CodeError {
    return { kind: this.kind, line: this.lineNo, message: this.friendly }
  }
}
class StepLimit extends Error {}

// ============================================================================
// PURE HELPERS
// ============================================================================
function stripComment(line: string): string {
  let inStr = false
  let quote = ''
  for (let i = 0; i < line.length; i++) {
    const c = line[i]
    if (inStr) {
      if (c === quote && line[i - 1] !== '\\') inStr = false
    } else {
      if (c === '"' || c === "'") {
        inStr = true
        quote = c
      } else if (c === '#') {
        return line.slice(0, i)
      }
    }
  }
  return line
}

function countIndent(line: string): number {
  let n = 0
  for (const c of line) {
    if (c === ' ') n++
    else if (c === '\t') n += 4
    else break
  }
  return n
}

function extractCondition(line: { text: string; lineNo: number }, kw: string): string {
  const t = line.text.slice(kw.length).trim()
  if (!t.endsWith(':')) {
    throw new InterpError(
      'syntax',
      `A "${kw}" statement must end with a colon ":".`,
      line.lineNo
    )
  }
  return t.slice(0, -1).trim()
}

function matchAssignment(
  text: string
): { target: string; index: string | null; exprText: string } | null {
  // find a top-level single "=" that is not == != <= >=
  let depth = 0
  let inStr = false
  let quote = ''
  for (let i = 0; i < text.length; i++) {
    const c = text[i]
    if (inStr) {
      if (c === quote) inStr = false
      continue
    }
    if (c === '"' || c === "'") {
      inStr = true
      quote = c
      continue
    }
    if (c === '(' || c === '[') depth++
    else if (c === ')' || c === ']') depth--
    else if (c === '=' && depth === 0) {
      const prev = text[i - 1]
      const next = text[i + 1]
      if (prev === '=' || prev === '!' || prev === '<' || prev === '>' || next === '=') {
        continue
      }
      const lhs = text.slice(0, i).trim()
      const rhs = text.slice(i + 1).trim()
      const idxMatch = lhs.match(/^([A-Za-z_]\w*)\s*\[(.+)\]$/)
      if (idxMatch) {
        return { target: idxMatch[1], index: idxMatch[2], exprText: rhs }
      }
      if (/^[A-Za-z_]\w*$/.test(lhs)) {
        return { target: lhs, index: null, exprText: rhs }
      }
      return null
    }
  }
  return null
}

function truthy(v: Value): boolean {
  if (v === null) return false
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  if (typeof v === 'string') return v.length > 0
  if (Array.isArray(v)) return v.length > 0
  return true
}

function looseEqual(a: Value, b: Value): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    return a.length === b.length && a.every((x, i) => looseEqual(x, b[i]))
  }
  return a === b
}

function describeType(v: Value): string {
  if (v === null) return 'None'
  if (Array.isArray(v)) return 'a list'
  if (typeof v === 'string') return 'a string'
  if (typeof v === 'boolean') return 'a boolean'
  return 'a number'
}

function reprForPrint(v: Value): string {
  if (v === null) return 'None'
  if (typeof v === 'boolean') return v ? 'True' : 'False'
  if (Array.isArray(v)) return '[' + v.map(reprForPrint).join(', ') + ']'
  return String(v)
}

function clone(v: Value): Value {
  if (Array.isArray(v)) return v.map(clone)
  return v
}
