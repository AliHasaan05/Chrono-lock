// ============================================================================
// CODING TASKS
// ----------------------------------------------------------------------------
// The structured data model for every coding challenge in Chrono-Lock.
// Each task teaches a real concept, provides progressive contextual hints,
// validates real code with tests, and emits GameActions on success.
// ============================================================================

import type { CodingTask, EvalContext } from '@/types'

// Helper to find a variable in the final context.
const v = (ctx: EvalContext, name: string) => ctx.variables[name]
const emitted = (ctx: EvalContext, type: string) =>
  ctx.actions.filter((a) => a.type === type)

export const TASKS: CodingTask[] = [
  // =========================================================================
  // SECTOR 1 — MONORAIL
  // =========================================================================
  {
    id: 'monorail-1',
    sectorId: 'monorail',
    title: 'First Signal',
    description:
      'The monorail control panel is dark. Send a startup message so the system knows a Chrononaut is present.',
    concept: 'print',
    conceptLabel: 'print()',
    language: 'python',
    difficulty: 'easy',
    stage: 2,
    starterCode: '# Print the startup message exactly:\n# Monorail online\n',
    expectedConcepts: ['print'],
    teaching: {
      what: 'print() shows a value in the output console.',
      how: 'Put the text inside parentheses and quotes.',
      why: 'Programs communicate results. print() is how your code "talks".',
      syntax: 'print("your text here")',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Your program needs to display a line of text.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Python shows text with print(...). Text goes in quotes.', cost: 0 },
      { level: 3, kind: 'structure', text: 'print("____")  — fill in the exact message.', cost: 5 },
      { level: 4, kind: 'near-solution', text: 'print("Monorail online")', cost: 10 },
    ],
    tests: [
      {
        description: 'Prints "Monorail online"',
        check: (ctx) => ctx.output.some((l) => l.trim() === 'Monorail online'),
      },
    ],
    successActions: [{ type: 'LOG', message: 'Panel lit.' }],
    failureFeedback: 'Make sure the message is exactly "Monorail online".',
    learningExplanation: 'print() sent text to the console — your first working instruction.',
    rewards: { xp: 100, shards: 20 },
    teachMe: [
      {
        prompt: 'What do we want the program to do?',
        options: ['Store a number', 'Show a message', 'Make a decision'],
        correctIndex: 1,
        response: 'Right — we want to display text.',
      },
      {
        prompt: 'Which instruction shows text?',
        options: ['print()', 'if', 'for'],
        correctIndex: 0,
        response: 'Exactly. print() displays a value.',
      },
    ],
  },
  {
    id: 'monorail-2',
    sectorId: 'monorail',
    title: 'Set the Speed',
    description:
      'The train needs a target speed stored before launch. Create a variable "speed" set to 60.',
    concept: 'variables',
    conceptLabel: 'Variables',
    language: 'python',
    difficulty: 'easy',
    stage: 4,
    starterCode: '# Create a variable called speed with the value 60\n',
    expectedConcepts: ['variables'],
    teaching: {
      what: 'A variable stores information under a name.',
      how: 'Write a name, then "=", then the value.',
      why: 'You can reuse and change stored values later instead of repeating them.',
      syntax: 'name = value',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'You need to remember a number for later: the target speed.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Store a value with name = value.', cost: 0 },
      { level: 3, kind: 'structure', text: 'speed = ____  (the target is 60)', cost: 5 },
      { level: 4, kind: 'near-solution', text: 'speed = 60', cost: 10 },
    ],
    tests: [
      { description: 'speed equals 60', check: (ctx) => v(ctx, 'speed') === 60 },
    ],
    successActions: [{ type: 'SET_VARIABLE', name: 'speed', value: 60 }],
    failureFeedback: 'The variable must be named speed and equal 60.',
    learningExplanation: 'You stored 60 in a variable named speed the train can read.',
    rewards: { xp: 120, shards: 25 },
  },
  {
    id: 'monorail-3',
    sectorId: 'monorail',
    title: 'Launch Sequence',
    description:
      'Bring it together. Set engine to "ready", close the doors, then launch the train in the correct order.',
    concept: 'variables',
    conceptLabel: 'Sequence',
    language: 'python',
    difficulty: 'medium',
    stage: 6,
    starterCode:
      '# 1) set engine to "ready"\n# 2) close_doors()\n# 3) launch_train()\n',
    expectedConcepts: ['variables', 'sequence'],
    teaching: {
      what: 'A program runs top to bottom, one line at a time.',
      how: 'Order matters: configure, secure, then launch.',
      why: 'Launching before closing the doors would be unsafe — sequence is logic.',
      syntax: 'engine = "ready"\nclose_doors()\nlaunch_train()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Three steps must happen in a safe order.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Call a function with its name and (). Store engine with =.', cost: 0 },
      { level: 3, kind: 'structure', text: 'engine = "ready"\nclose_doors()\nlaunch_train()', cost: 5 },
      { level: 4, kind: 'near-solution', text: 'Set engine = "ready", then close_doors(), then launch_train().', cost: 10 },
    ],
    tests: [
      { description: 'engine is "ready"', check: (ctx) => v(ctx, 'engine') === 'ready' },
      { description: 'doors are closed', check: (ctx) => emitted(ctx, 'CLOSE_DOORS').length > 0 },
      { description: 'train launches', check: (ctx) => emitted(ctx, 'ACTIVATE_TRAIN').length > 0 },
    ],
    successActions: [{ type: 'ACTIVATE_TRAIN', trainId: 'monorail-1' }],
    failureFeedback: 'Set engine to "ready", close the doors, then launch — in that order.',
    learningExplanation: 'You sequenced three instructions and the train rolled out of the station.',
    rewards: { xp: 250, shards: 50, cores: 1 },
  },

  // =========================================================================
  // SECTOR 2 — LASER CORRIDOR
  // =========================================================================
  {
    id: 'laser-1',
    sectorId: 'laser',
    title: 'Red Means Shield',
    description:
      'A laser is firing. The variable "laser" holds its color. If it is "red", activate_shield(). Otherwise jump().',
    concept: 'conditions',
    conceptLabel: 'if / else',
    language: 'python',
    difficulty: 'medium',
    stage: 5,
    starterCode:
      'laser = "red"\n\n# if the laser is red, activate_shield()\n# otherwise, jump()\n',
    expectedConcepts: ['conditions', 'comparison'],
    teaching: {
      what: 'if/else lets the program choose an action based on a condition.',
      how: 'Compare with "==", end the line with ":", indent the action.',
      why: 'Different situations need different responses — that is decision-making.',
      syntax: 'if condition:\n    action()\nelse:\n    other()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Your program needs to decide based on the laser color.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Python makes decisions with "if". Compare with "==".', cost: 0 },
      { level: 3, kind: 'structure', text: 'if laser == "red":\n    ____\nelse:\n    ____', cost: 5 },
      { level: 4, kind: 'near-solution', text: 'if laser == "red":\n    activate_shield()\nelse:\n    jump()', cost: 20 },
    ],
    tests: [
      { description: 'shield activates when laser is red', check: (ctx) => emitted(ctx, 'ACTIVATE_SHIELD').length > 0 },
      { description: 'does not jump when red', check: (ctx) => emitted(ctx, 'PLAYER_JUMP').length === 0 },
    ],
    successActions: [{ type: 'ACTIVATE_SHIELD' }],
    failureFeedback: 'When laser == "red" you should activate_shield(), not jump().',
    learningExplanation: 'Your program checked the laser color and chose the correct action.',
    rewards: { xp: 220, shards: 45 },
    teachMe: [
      {
        prompt: 'What should decide our action?',
        options: ['The train speed', 'The laser color', 'A loop'],
        correctIndex: 1,
        response: 'Right — the laser color drives the decision.',
      },
      {
        prompt: 'Which keyword makes a decision?',
        options: ['for', 'if', 'def'],
        correctIndex: 1,
        response: 'Exactly — "if" branches the program.',
      },
    ],
  },
  {
    id: 'laser-2',
    sectorId: 'laser',
    title: 'Three-Way Grid',
    description:
      'The grid cycles colors. If "red" activate_shield(); elif "blue" jump(); else disable_laser("safe").',
    concept: 'conditions',
    conceptLabel: 'if / elif / else',
    language: 'python',
    difficulty: 'hard',
    stage: 6,
    starterCode:
      'laser = "blue"\n\n# red  -> activate_shield()\n# blue -> jump()\n# else -> disable_laser("safe")\n',
    expectedConcepts: ['conditions', 'comparison'],
    teaching: {
      what: 'elif adds extra choices between if and else.',
      how: 'Chain conditions: if ... elif ... else, each ending with ":".',
      why: 'Real systems have more than two cases.',
      syntax: 'if a:\n    ...\nelif b:\n    ...\nelse:\n    ...',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'There are three possible colors, so three branches.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Use if, then elif for the middle case, then else.', cost: 0 },
      { level: 3, kind: 'structure', text: 'if laser == "red":\n    ...\nelif laser == "blue":\n    ...\nelse:\n    ...', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'For "blue" you must jump(). The else branch calls disable_laser("safe").', cost: 20 },
    ],
    tests: [
      { description: 'jumps when laser is blue', check: (ctx) => emitted(ctx, 'PLAYER_JUMP').length > 0 },
      { description: 'does not shield when blue', check: (ctx) => emitted(ctx, 'ACTIVATE_SHIELD').length === 0 },
    ],
    successActions: [{ type: 'PLAYER_JUMP' }],
    failureFeedback: 'With laser == "blue" the program should jump().',
    learningExplanation: 'You handled three cases with if / elif / else.',
    rewards: { xp: 300, shards: 60, cores: 1 },
  },

  // =========================================================================
  // SECTOR 3 — POWER GENERATOR
  // =========================================================================
  {
    id: 'reactor-1',
    sectorId: 'reactor',
    title: 'Drain Them All',
    description:
      'The reactor has 5 dampeners in a list. Loop over them and drain(each). You should see each one drain in turn.',
    concept: 'loops-for',
    conceptLabel: 'for loop',
    language: 'python',
    difficulty: 'medium',
    stage: 5,
    starterCode:
      'dampeners = ["D1", "D2", "D3", "D4", "D5"]\n\n# drain every dampener with a loop\n',
    expectedConcepts: ['loops-for', 'lists'],
    teaching: {
      what: 'A for loop repeats an action for every item in a collection.',
      how: 'for item in collection: then indent the repeated action.',
      why: 'Repeating by hand is slow and error-prone. One loop handles any count.',
      syntax: 'for item in things:\n    do_something(item)',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'You need the same action on every dampener.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'A for loop repeats: for x in list:', cost: 0 },
      { level: 3, kind: 'structure', text: 'for d in dampeners:\n    drain(____)', cost: 5 },
      { level: 4, kind: 'near-solution', text: 'for d in dampeners:\n    drain(d)', cost: 15 },
    ],
    tests: [
      { description: 'drains all 5 dampeners', check: (ctx) => emitted(ctx, 'DRAIN_DAMPENER').length === 5 },
    ],
    successActions: [{ type: 'STABILIZE_REACTOR', reactorId: 'reactor-7' }],
    failureFeedback: 'Your loop should call drain() once for each of the 5 dampeners.',
    learningExplanation: 'One loop controlled five machines with a single repeated instruction.',
    rewards: { xp: 280, shards: 55 },
    teachMe: [
      {
        prompt: 'What are we repeating?',
        options: ['Draining every dampener', 'Making one decision', 'Storing a number'],
        correctIndex: 0,
        response: 'Correct — the same action on each dampener.',
      },
      {
        prompt: 'Which structure repeats an action?',
        options: ['if', 'for loop', 'variable'],
        correctIndex: 1,
        response: 'Exactly. Let us build the loop.',
      },
    ],
  },
  {
    id: 'reactor-2',
    sectorId: 'reactor',
    title: 'Count Down to Stable',
    description:
      'Energy starts at 5. While energy is greater than 0, drain("core") and subtract 1 from energy. Then stabilize().',
    concept: 'loops-while',
    conceptLabel: 'while loop',
    language: 'python',
    difficulty: 'hard',
    stage: 6,
    starterCode:
      'energy = 5\n\n# while energy > 0: drain("core") and reduce energy by 1\n# then stabilize()\n',
    expectedConcepts: ['loops-while'],
    teaching: {
      what: 'A while loop repeats as long as a condition stays true.',
      how: 'Change something inside the loop so it eventually stops.',
      why: 'Use while when you do not know the exact count in advance.',
      syntax: 'while condition:\n    work()\n    update()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Keep draining until energy reaches zero.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'while energy > 0: ... and reduce energy each pass.', cost: 0 },
      { level: 3, kind: 'structure', text: 'while energy > 0:\n    drain("core")\n    energy = energy - 1', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'After the loop, call stabilize().', cost: 20 },
    ],
    tests: [
      { description: 'drains 5 times', check: (ctx) => emitted(ctx, 'DRAIN_DAMPENER').length === 5 },
      { description: 'reactor stabilized', check: (ctx) => emitted(ctx, 'STABILIZE_REACTOR').length > 0 },
      { description: 'energy reaches 0', check: (ctx) => v(ctx, 'energy') === 0 },
    ],
    successActions: [{ type: 'STABILIZE_REACTOR', reactorId: 'reactor-7' }],
    failureFeedback: 'Reduce energy inside the loop, or it will never stop. Then stabilize().',
    learningExplanation: 'You controlled a loop with a changing condition — a while loop.',
    rewards: { xp: 340, shards: 65, cores: 1 },
  },

  // =========================================================================
  // SECTOR 4 — DATA VAULT
  // =========================================================================
  {
    id: 'vault-1',
    sectorId: 'vault',
    title: 'The Middle Key',
    description:
      'The keys list is ["NOVA", "ECHO", "FLUX"]. The vault needs the middle key. highlight() it using its index.',
    concept: 'indexing',
    conceptLabel: 'List indexing',
    language: 'python',
    difficulty: 'medium',
    stage: 4,
    starterCode:
      'keys = ["NOVA", "ECHO", "FLUX"]\n\n# highlight the middle key using its index\n# remember: the first index is 0\n',
    expectedConcepts: ['lists', 'indexing'],
    teaching: {
      what: 'Lists store values in order. Indexing reaches one by position.',
      how: 'Positions start at 0, so the middle of three is index 1.',
      why: 'You often need one specific item, not the whole list.',
      syntax: 'items[index]  # items[0] is the first',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'You need the item in the middle of the list.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Reach an item with keys[index]. Counting starts at 0.', cost: 0 },
      { level: 3, kind: 'structure', text: 'highlight(keys[____])  — which index is the middle?', cost: 5 },
      { level: 4, kind: 'near-solution', text: 'highlight(keys[1])  # ECHO', cost: 15 },
    ],
    tests: [
      {
        description: 'highlights ECHO (index 1)',
        check: (ctx) =>
          emitted(ctx, 'HIGHLIGHT_KEY').some((a: any) => a.label === 'ECHO'),
      },
    ],
    successActions: [{ type: 'OPEN_VAULT', vaultId: 'vault-1' }],
    failureFeedback: 'The middle of three items is at index 1, which is "ECHO".',
    learningExplanation: 'Index 1 selected the second item — indexing starts at 0.',
    rewards: { xp: 260, shards: 50 },
  },
  {
    id: 'vault-2',
    sectorId: 'vault',
    title: 'Highlight Each Key',
    description:
      'Loop over the keys list and highlight() every key, then open_vault().',
    concept: 'lists',
    conceptLabel: 'Lists + loop',
    language: 'python',
    difficulty: 'medium',
    stage: 6,
    starterCode:
      'keys = ["NOVA", "ECHO", "FLUX"]\n\n# highlight every key, then open_vault()\n',
    expectedConcepts: ['lists', 'loops-for'],
    teaching: {
      what: 'Loops and lists work together to process every item.',
      how: 'for key in keys: highlight(key)',
      why: 'This scales to any number of items without extra code.',
      syntax: 'for key in keys:\n    highlight(key)',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Every key should be highlighted, one after another.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Combine a for loop with highlight().', cost: 0 },
      { level: 3, kind: 'structure', text: 'for key in keys:\n    highlight(key)\nopen_vault()', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'Loop first, then call open_vault() after the loop.', cost: 15 },
    ],
    tests: [
      { description: 'highlights all 3 keys', check: (ctx) => emitted(ctx, 'HIGHLIGHT_KEY').length === 3 },
      { description: 'opens the vault', check: (ctx) => emitted(ctx, 'OPEN_VAULT').length > 0 },
    ],
    successActions: [{ type: 'OPEN_VAULT', vaultId: 'vault-1' }],
    failureFeedback: 'Highlight all three keys with a loop, then open the vault.',
    learningExplanation: 'A loop walked the whole list and the vault opened.',
    rewards: { xp: 320, shards: 60, cores: 1 },
  },

  // =========================================================================
  // SECTOR 5 — AI LAB
  // =========================================================================
  {
    id: 'ailab-1',
    sectorId: 'ailab',
    title: 'Define an Ability',
    description:
      'Define a function open_door() that calls unlock() then slide_door(). Then call open_door().',
    concept: 'functions',
    conceptLabel: 'Functions',
    language: 'python',
    difficulty: 'medium',
    stage: 5,
    starterCode:
      '# define open_door() to unlock() then slide_door()\n# then call open_door()\n',
    expectedConcepts: ['functions'],
    teaching: {
      what: 'A function packages steps under a name you can reuse.',
      how: 'def name(): then indent the steps. Call it with name().',
      why: 'Define once, use anywhere — functions are reusable abilities.',
      syntax: 'def open_door():\n    unlock()\n    slide_door()\n\nopen_door()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Bundle two steps into one reusable ability.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Define with def name(): and call with name().', cost: 0 },
      { level: 3, kind: 'structure', text: 'def open_door():\n    unlock()\n    slide_door()\n\nopen_door()', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'Remember to CALL open_door() after defining it.', cost: 15 },
    ],
    tests: [
      { description: 'the door opens', check: (ctx) => emitted(ctx, 'OPEN_DOOR').length > 0 },
    ],
    successActions: [{ type: 'OPEN_DOOR', doorId: 'ailab-door' }],
    failureFeedback: 'Define open_door() with unlock() and slide_door(), then call it.',
    learningExplanation: 'You defined a function and calling it opened the door.',
    rewards: { xp: 300, shards: 60 },
    teachMe: [
      {
        prompt: 'What creates a reusable ability?',
        options: ['A loop', 'A function (def)', 'A variable'],
        correctIndex: 1,
        response: 'Right — def defines a function.',
      },
      {
        prompt: 'After defining it, what makes it run?',
        options: ['Calling it: open_door()', 'Nothing', 'An if statement'],
        correctIndex: 0,
        response: 'Exactly — you must call it.',
      },
    ],
  },
  {
    id: 'ailab-2',
    sectorId: 'ailab',
    title: 'Shut Down the Drones',
    description:
      'There are 4 drones in a list. Define a function clear(group) that loops and disable()s each, then call it.',
    concept: 'parameters',
    conceptLabel: 'Functions + parameters',
    language: 'python',
    difficulty: 'hard',
    stage: 7,
    starterCode:
      'drones = ["R1", "R2", "R3", "R4"]\n\n# define clear(group) that disables each drone in group\n# then call clear(drones)\n',
    expectedConcepts: ['functions', 'parameters', 'loops-for'],
    teaching: {
      what: 'Parameters let a function work on different inputs.',
      how: 'def clear(group): loops over group. Pass a list when calling.',
      why: 'One function, many inputs — maximum reuse.',
      syntax: 'def clear(group):\n    for d in group:\n        disable(d)\n\nclear(drones)',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Combine a function, a parameter, and a loop.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'def clear(group): then loop over group inside.', cost: 0 },
      { level: 3, kind: 'structure', text: 'def clear(group):\n    for d in group:\n        disable(d)', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'Call it with the drones list: clear(drones)', cost: 20 },
    ],
    tests: [
      { description: 'disables all 4 drones', check: (ctx) => emitted(ctx, 'DISABLE_DRONE').length === 4 },
    ],
    successActions: [{ type: 'OPEN_DOOR', doorId: 'ailab-door' }],
    failureFeedback: 'Define clear(group), loop and disable each, then call clear(drones).',
    learningExplanation: 'A parameterized function processed the whole drone list.',
    rewards: { xp: 380, shards: 75, cores: 1 },
  },

  // =========================================================================
  // SECTOR 6 — CHRONO TITAN (BOSS)
  // =========================================================================
  {
    id: 'titan-1',
    sectorId: 'titan',
    title: 'Phase 1: Read the Shield',
    description:
      'The Titan shield is "fire". Water beats fire. If shield == "fire": use_water_weapon(), else use_fire_weapon().',
    concept: 'conditions',
    conceptLabel: 'Conditions',
    language: 'python',
    difficulty: 'medium',
    stage: 6,
    starterCode:
      'shield = "fire"\n\n# fire shield -> use_water_weapon()\n# otherwise   -> use_fire_weapon()\n',
    expectedConcepts: ['conditions'],
    teaching: {
      what: 'Boss phases are decisions under pressure.',
      how: 'Match the weapon to the shield with if/else.',
      why: 'The right choice deals damage; the wrong one wastes the hit.',
      syntax: 'if shield == "fire":\n    use_water_weapon()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Pick the weapon that counters the shield.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'Decide with if shield == "fire":', cost: 0 },
      { level: 3, kind: 'structure', text: 'if shield == "fire":\n    use_water_weapon()\nelse:\n    use_fire_weapon()', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'Water counters fire — call use_water_weapon().', cost: 20 },
    ],
    tests: [
      { description: 'damages the Titan', check: (ctx) => emitted(ctx, 'DAMAGE_BOSS').length > 0 },
    ],
    successActions: [{ type: 'DAMAGE_BOSS', amount: 34 }],
    failureFeedback: 'A fire shield must be countered with water.',
    learningExplanation: 'You read the state and chose the correct counter.',
    rewards: { xp: 300, shards: 60 },
  },
  {
    id: 'titan-2',
    sectorId: 'titan',
    title: 'Phase 2: Barrage',
    description:
      'The Titan drops its guard for 3 strikes. Loop 3 times and strike() each time.',
    concept: 'loops-for',
    conceptLabel: 'Loops',
    language: 'python',
    difficulty: 'medium',
    stage: 6,
    starterCode: '# strike() three times using a loop\n',
    expectedConcepts: ['loops-for'],
    teaching: {
      what: 'A counted loop repeats an exact number of times.',
      how: 'for i in range(3): strike()',
      why: 'range(n) gives you exactly n repetitions.',
      syntax: 'for i in range(3):\n    strike()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Strike exactly three times.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'range(3) produces three passes.', cost: 0 },
      { level: 3, kind: 'structure', text: 'for i in range(3):\n    strike()', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'for i in range(3):\n    strike()', cost: 20 },
    ],
    tests: [
      { description: 'strikes exactly 3 times', check: (ctx) => emitted(ctx, 'DAMAGE_BOSS').length === 3 },
    ],
    successActions: [{ type: 'DAMAGE_BOSS', amount: 20 }],
    failureFeedback: 'Use range(3) so you strike exactly three times.',
    learningExplanation: 'A counted loop delivered exactly three strikes.',
    rewards: { xp: 320, shards: 65 },
  },
  {
    id: 'titan-3',
    sectorId: 'titan',
    title: 'Phase 3: Finisher',
    description:
      'Define finish() that strikes 3 times, then call it. Everything you learned, in one move.',
    concept: 'functions',
    conceptLabel: 'Functions + loops',
    language: 'python',
    difficulty: 'hard',
    stage: 7,
    starterCode:
      '# define finish() that strikes 3 times with a loop\n# then call finish()\n',
    expectedConcepts: ['functions', 'loops-for'],
    teaching: {
      what: 'Combine a function and a loop into a single finisher.',
      how: 'def finish(): loops range(3) and calls strike(). Then call finish().',
      why: 'Composition is how real programs are built from small parts.',
      syntax: 'def finish():\n    for i in range(3):\n        strike()\n\nfinish()',
    },
    hints: [
      { level: 1, kind: 'concept', text: 'Wrap a counted loop inside a function.', cost: 0 },
      { level: 2, kind: 'syntax', text: 'def finish(): then a for range(3) loop inside.', cost: 0 },
      { level: 3, kind: 'structure', text: 'def finish():\n    for i in range(3):\n        strike()\n\nfinish()', cost: 10 },
      { level: 4, kind: 'near-solution', text: 'Do not forget to CALL finish() at the end.', cost: 20 },
    ],
    tests: [
      { description: 'delivers 3 strikes via the function', check: (ctx) => emitted(ctx, 'DAMAGE_BOSS').length === 3 },
    ],
    successActions: [{ type: 'DAMAGE_BOSS', amount: 40 }],
    failureFeedback: 'Define finish() with a 3-time loop of strike(), then call finish().',
    learningExplanation: 'You composed a function and a loop to end the fight.',
    rewards: { xp: 500, shards: 100, cores: 3 },
  },
]

export function getTask(id: string): CodingTask | undefined {
  return TASKS.find((t) => t.id === id)
}

export function getTasksForSector(sectorId: string): CodingTask[] {
  return TASKS.filter((t) => t.sectorId === sectorId)
}
