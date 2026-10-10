// ============================================================================
// CHRONO-LOCK CORE TYPE DEFINITIONS
// ----------------------------------------------------------------------------
// These types form the contract between the EDUCATION engine and the GAME
// engine. The code evaluator produces a LearningResult + GameActions. The 3D
// world consumes GameActions. Neither side imports the other's rendering code.
// ============================================================================

export type Language = 'python' | 'javascript' | 'cpp'

export type Difficulty = 'easy' | 'medium' | 'hard'

export type ConceptId =
  | 'print'
  | 'variables'
  | 'strings'
  | 'numbers'
  | 'booleans'
  | 'arithmetic'
  | 'conditions'
  | 'comparison'
  | 'logical'
  | 'loops-for'
  | 'loops-while'
  | 'lists'
  | 'indexing'
  | 'dictionaries'
  | 'functions'
  | 'parameters'
  | 'return'
  | 'objects'
  | 'algorithms'
  | 'debugging'

// ----------------------------------------------------------------------------
// GAME ACTIONS: the only language the 3D world speaks.
// ----------------------------------------------------------------------------
export type GameAction =
  | { type: 'ACTIVATE_TRAIN'; trainId: string }
  | { type: 'SET_VARIABLE'; name: string; value: unknown }
  | { type: 'CLOSE_DOORS'; trainId: string }
  | { type: 'DISABLE_LASER'; laserId: string }
  | { type: 'ACTIVATE_SHIELD' }
  | { type: 'PLAYER_JUMP' }
  | { type: 'DRAIN_DAMPENER'; dampenerId: string; index: number }
  | { type: 'STABILIZE_REACTOR'; reactorId: string }
  | { type: 'HIGHLIGHT_KEY'; vaultId: string; index: number; label: string }
  | { type: 'OPEN_VAULT'; vaultId: string }
  | { type: 'OPEN_DOOR'; doorId: string }
  | { type: 'DISABLE_DRONE'; droneId: string; index: number }
  | { type: 'DAMAGE_BOSS'; amount: number }
  | { type: 'BOSS_ATTACK'; reason: string }
  | { type: 'LOG'; message: string }

// ----------------------------------------------------------------------------
// ERRORS: differentiated so CHRONO can teach instead of just saying "wrong".
// ----------------------------------------------------------------------------
export type ErrorKind =
  | 'syntax'
  | 'logic'
  | 'name'
  | 'type'
  | 'runtime'
  | 'none'

export interface CodeError {
  kind: ErrorKind
  line?: number
  message: string      // beginner-friendly explanation
  rawMessage?: string  // technical detail (optional)
}

// ----------------------------------------------------------------------------
// DEBUG TRACE: produced by the evaluator so DEBUG mode can step line-by-line.
// ----------------------------------------------------------------------------
export interface DebugStep {
  line: number
  code: string
  variables: Record<string, unknown>
  note?: string
  action?: GameAction
}

// ----------------------------------------------------------------------------
// HINTS: every task must have progressive, contextual hints.
// ----------------------------------------------------------------------------
export interface Hint {
  level: 1 | 2 | 3 | 4
  kind: 'concept' | 'syntax' | 'structure' | 'near-solution'
  text: string
  cost: number // Shards; level 1 is always 0
}

// ----------------------------------------------------------------------------
// TESTS: how we know the learner's code actually works.
// ----------------------------------------------------------------------------
export interface TestCase {
  description: string
  // A predicate run against the evaluation result's output/variables.
  check: (ctx: EvalContext) => boolean
}

// ----------------------------------------------------------------------------
// EVAL CONTEXT: the shared result surface the sandbox exposes to tests.
// ----------------------------------------------------------------------------
export interface EvalContext {
  output: string[]                     // things the program "printed"
  variables: Record<string, unknown>   // final variable state
  actions: GameAction[]                // game actions emitted
  steps: DebugStep[]                   // debug trace
}

// ----------------------------------------------------------------------------
// LEARNING RESULT: output of the evaluator.
// ----------------------------------------------------------------------------
export interface LearningResult {
  success: boolean
  error: CodeError | null
  context: EvalContext
  passedTests: boolean[]
  contextualHint?: string // generated from the player's actual mistake
}

// ----------------------------------------------------------------------------
// CODING TASK: the structured data model for every challenge.
// ----------------------------------------------------------------------------
export interface CodingTask {
  id: string
  sectorId: string
  title: string
  description: string
  concept: ConceptId
  conceptLabel: string
  language: Language
  difficulty: Difficulty
  // Progressive learning stage 1..7 (recognize -> open problem)
  stage: number
  starterCode: string
  expectedConcepts: string[]
  hints: Hint[]
  tests: TestCase[]
  successActions: GameAction[]
  failureFeedback: string
  learningExplanation: string
  // The WHAT / HOW / WHY teaching card.
  teaching: {
    what: string
    how: string
    why: string
    syntax: string
  }
  rewards: {
    xp: number
    shards: number
    cores?: number
  }
  // Teach-Me guided steps (optional).
  teachMe?: TeachMeStep[]
}

// Per-language presentation of a task: the starter code, teaching syntax, and
// hint text differ by language, but the concept, tests, rewards and game
// actions are shared. Produced by applying a LanguageVariant to a CodingTask.
export interface LanguageVariant {
  starterCode: string
  syntax: string
  hintText: string[] // up to 4 progressive hint texts; falls back to base hints
}

export interface TeachMeStep {
  prompt: string
  options: string[]
  correctIndex: number
  response: string
}

// ----------------------------------------------------------------------------
// SECTOR: a district / mission area of the city.
// ----------------------------------------------------------------------------
export interface Sector {
  id: string
  index: number
  name: string
  subtitle: string
  concepts: ConceptId[]
  description: string
  taskIds: string[]
  unlockedByDefault: boolean
}

// ----------------------------------------------------------------------------
// NPC
// ----------------------------------------------------------------------------
export interface NPC {
  id: string
  name: string
  role: string
  color: string
  intro: string[]
}

// ----------------------------------------------------------------------------
// CODEX ENTRY
// ----------------------------------------------------------------------------
export interface CodexEntry {
  concept: ConceptId
  title: string
  purpose: string
  syntax: string
  example: string
}
