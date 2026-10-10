// ============================================================================
// LANGUAGE VARIANTS
// ----------------------------------------------------------------------------
// Each task is authored once (concept, tests, rewards, game actions in
// tasks.ts, with Python as the base). This file provides the JavaScript and
// C++ presentation for every task: real starter code, teaching syntax, and
// progressive hint text in that language. The tests are language-agnostic
// (they check variables and emitted game actions), so the same mission works
// identically across all three languages.
// ============================================================================

import type { Language, LanguageVariant } from '@/types'

type VariantMap = Record<string, LanguageVariant>

// ---------------------------------------------------------------------------
// JAVASCRIPT
// ---------------------------------------------------------------------------
const JS: VariantMap = {
  'monorail-1': {
    starterCode: '// Print the startup message exactly:\n// Monorail online\n',
    syntax: 'console.log("your text here");',
    hintText: [
      'Your program needs to display a line of text.',
      'JavaScript shows text with console.log(...). Text goes in quotes.',
      'console.log("____");  — fill in the exact message.',
      'console.log("Monorail online");',
    ],
  },
  'monorail-2': {
    starterCode: '// Create a variable called speed with the value 60\n',
    syntax: 'let name = value;',
    hintText: [
      'You need to remember a number for later: the target speed.',
      'Store a value with let name = value;',
      'let speed = ____;  (the target is 60)',
      'let speed = 60;',
    ],
  },
  'monorail-3': {
    starterCode: '// 1) set engine to "ready"\n// 2) close_doors()\n// 3) launch_train()\n',
    syntax: 'let engine = "ready";\nclose_doors();\nlaunch_train();',
    hintText: [
      'Three steps must happen in a safe order.',
      'Call a function with its name and (). Store engine with let.',
      'let engine = "ready";\nclose_doors();\nlaunch_train();',
      'Set engine = "ready", then close_doors(), then launch_train().',
    ],
  },
  'laser-1': {
    starterCode: 'let laser = "red";\n\n// if the laser is red, activate_shield()\n// otherwise, jump()\n',
    syntax: 'if (condition) {\n  action();\n} else {\n  other();\n}',
    hintText: [
      'Your program needs to decide based on the laser color.',
      'JavaScript makes decisions with if (...) { }. Compare with "==".',
      'if (laser == "red") {\n  ____\n} else {\n  ____\n}',
      'if (laser == "red") {\n  activate_shield();\n} else {\n  jump();\n}',
    ],
  },
  'laser-2': {
    starterCode: 'let laser = "blue";\n\n// red  -> activate_shield()\n// blue -> jump()\n// else -> disable_laser("safe")\n',
    syntax: 'if (a) { } else if (b) { } else { }',
    hintText: [
      'There are three possible colors, so three branches.',
      'Use if, then else if for the middle case, then else.',
      'if (laser == "red") { ... } else if (laser == "blue") { ... } else { ... }',
      'For "blue" call jump(). The else branch calls disable_laser("safe").',
    ],
  },
  'reactor-1': {
    starterCode: 'let dampeners = ["D1", "D2", "D3", "D4", "D5"];\n\n// drain every dampener with a loop\n',
    syntax: 'for (let item of things) {\n  do_something(item);\n}',
    hintText: [
      'You need the same action on every dampener.',
      'A for-of loop repeats: for (let x of list) { }',
      'for (let d of dampeners) {\n  drain(____);\n}',
      'for (let d of dampeners) {\n  drain(d);\n}',
    ],
  },
  'reactor-2': {
    starterCode: 'let energy = 5;\n\n// while energy > 0: drain("core") and reduce energy by 1\n// then stabilize()\n',
    syntax: 'while (condition) {\n  work();\n  update();\n}',
    hintText: [
      'Keep draining until energy reaches zero.',
      'while (energy > 0) { ... } and reduce energy each pass.',
      'while (energy > 0) {\n  drain("core");\n  energy = energy - 1;\n}',
      'After the loop, call stabilize().',
    ],
  },
  'vault-1': {
    starterCode: 'let keys = ["NOVA", "ECHO", "FLUX"];\n\n// highlight the middle key using its index\n// remember: the first index is 0\n',
    syntax: 'items[index]  // items[0] is the first',
    hintText: [
      'You need the item in the middle of the list.',
      'Reach an item with keys[index]. Counting starts at 0.',
      'highlight(keys[____]);  — which index is the middle?',
      'highlight(keys[1]);  // ECHO',
    ],
  },
  'vault-2': {
    starterCode: 'let keys = ["NOVA", "ECHO", "FLUX"];\n\n// highlight every key, then open_vault()\n',
    syntax: 'for (let key of keys) {\n  highlight(key);\n}',
    hintText: [
      'Every key should be highlighted, one after another.',
      'Combine a for-of loop with highlight().',
      'for (let key of keys) {\n  highlight(key);\n}\nopen_vault();',
      'Loop first, then call open_vault() after the loop.',
    ],
  },
  'ailab-1': {
    starterCode: '// define open_door() to unlock() then slide_door()\n// then call open_door()\n',
    syntax: 'function open_door() {\n  unlock();\n  slide_door();\n}\n\nopen_door();',
    hintText: [
      'Bundle two steps into one reusable ability.',
      'Define with function name() { } and call with name().',
      'function open_door() {\n  unlock();\n  slide_door();\n}\n\nopen_door();',
      'Remember to CALL open_door() after defining it.',
    ],
  },
  'ailab-2': {
    starterCode: 'let drones = ["R1", "R2", "R3", "R4"];\n\n// define clear(group) that disables each drone in group\n// then call clear(drones)\n',
    syntax: 'function clear(group) {\n  for (let d of group) {\n    disable(d);\n  }\n}\n\nclear(drones);',
    hintText: [
      'Combine a function, a parameter, and a loop.',
      'function clear(group) { ... } then loop over group inside.',
      'function clear(group) {\n  for (let d of group) {\n    disable(d);\n  }\n}',
      'Call it with the drones list: clear(drones);',
    ],
  },
  'titan-1': {
    starterCode: 'let shield = "fire";\n\n// fire shield -> use_water_weapon()\n// otherwise   -> use_fire_weapon()\n',
    syntax: 'if (shield == "fire") {\n  use_water_weapon();\n}',
    hintText: [
      'Pick the weapon that counters the shield.',
      'Decide with if (shield == "fire") { }',
      'if (shield == "fire") {\n  use_water_weapon();\n} else {\n  use_fire_weapon();\n}',
      'Water counters fire — call use_water_weapon().',
    ],
  },
  'titan-2': {
    starterCode: '// strike() three times using a loop\n',
    syntax: 'for (let i = 0; i < 3; i = i + 1) {\n  strike();\n}',
    hintText: [
      'Strike exactly three times.',
      'A counted for loop runs a fixed number of times.',
      'for (let i = 0; i < 3; i = i + 1) {\n  strike();\n}',
      'for (let i = 0; i < 3; i = i + 1) {\n  strike();\n}',
    ],
  },
  'titan-3': {
    starterCode: '// define finish() that strikes 3 times with a loop\n// then call finish()\n',
    syntax: 'function finish() {\n  for (let i = 0; i < 3; i = i + 1) {\n    strike();\n  }\n}\n\nfinish();',
    hintText: [
      'Wrap a counted loop inside a function.',
      'function finish() { } with a for loop inside.',
      'function finish() {\n  for (let i = 0; i < 3; i = i + 1) {\n    strike();\n  }\n}\n\nfinish();',
      'Do not forget to CALL finish() at the end.',
    ],
  },
}

// ---------------------------------------------------------------------------
// C++
// ---------------------------------------------------------------------------
const CPP: VariantMap = {
  'monorail-1': {
    starterCode: '// Print the startup message exactly:\n// Monorail online\n',
    syntax: 'cout << "your text here";',
    hintText: [
      'Your program needs to display a line of text.',
      'C++ shows text with cout << ... ; Text goes in quotes.',
      'cout << "____";  — fill in the exact message.',
      'cout << "Monorail online";',
    ],
  },
  'monorail-2': {
    starterCode: '// Create a variable called speed with the value 60\n',
    syntax: 'int name = value;',
    hintText: [
      'You need to remember a number for later: the target speed.',
      'Store a whole number with int name = value;',
      'int speed = ____;  (the target is 60)',
      'int speed = 60;',
    ],
  },
  'monorail-3': {
    starterCode: '// 1) set engine to "ready"\n// 2) close_doors()\n// 3) launch_train()\n',
    syntax: 'string engine = "ready";\nclose_doors();\nlaunch_train();',
    hintText: [
      'Three steps must happen in a safe order.',
      'Call a function with its name and (). Store engine with string.',
      'string engine = "ready";\nclose_doors();\nlaunch_train();',
      'Set engine = "ready", then close_doors(), then launch_train().',
    ],
  },
  'laser-1': {
    starterCode: 'string laser = "red";\n\n// if the laser is red, activate_shield()\n// otherwise, jump()\n',
    syntax: 'if (condition) {\n  action();\n} else {\n  other();\n}',
    hintText: [
      'Your program needs to decide based on the laser color.',
      'C++ makes decisions with if (...) { }. Compare with "==".',
      'if (laser == "red") {\n  ____\n} else {\n  ____\n}',
      'if (laser == "red") {\n  activate_shield();\n} else {\n  jump();\n}',
    ],
  },
  'laser-2': {
    starterCode: 'string laser = "blue";\n\n// red  -> activate_shield()\n// blue -> jump()\n// else -> disable_laser("safe")\n',
    syntax: 'if (a) { } else if (b) { } else { }',
    hintText: [
      'There are three possible colors, so three branches.',
      'Use if, then else if for the middle case, then else.',
      'if (laser == "red") { ... } else if (laser == "blue") { ... } else { ... }',
      'For "blue" call jump(). The else branch calls disable_laser("safe").',
    ],
  },
  'reactor-1': {
    starterCode: 'string dampeners[] = {"D1", "D2", "D3", "D4", "D5"};\n\n// drain every dampener with a loop\n',
    syntax: 'for (auto item : things) {\n  do_something(item);\n}',
    hintText: [
      'You need the same action on every dampener.',
      'A range-for repeats: for (auto x : list) { }',
      'for (auto d : dampeners) {\n  drain(____);\n}',
      'for (auto d : dampeners) {\n  drain(d);\n}',
    ],
  },
  'reactor-2': {
    starterCode: 'int energy = 5;\n\n// while energy > 0: drain("core") and reduce energy by 1\n// then stabilize()\n',
    syntax: 'while (condition) {\n  work();\n  update();\n}',
    hintText: [
      'Keep draining until energy reaches zero.',
      'while (energy > 0) { ... } and reduce energy each pass.',
      'while (energy > 0) {\n  drain("core");\n  energy = energy - 1;\n}',
      'After the loop, call stabilize().',
    ],
  },
  'vault-1': {
    starterCode: 'string keys[] = {"NOVA", "ECHO", "FLUX"};\n\n// highlight the middle key using its index\n// remember: the first index is 0\n',
    syntax: 'items[index]  // items[0] is the first',
    hintText: [
      'You need the item in the middle of the list.',
      'Reach an item with keys[index]. Counting starts at 0.',
      'highlight(keys[____]);  — which index is the middle?',
      'highlight(keys[1]);  // ECHO',
    ],
  },
  'vault-2': {
    starterCode: 'string keys[] = {"NOVA", "ECHO", "FLUX"};\n\n// highlight every key, then open_vault()\n',
    syntax: 'for (auto key : keys) {\n  highlight(key);\n}',
    hintText: [
      'Every key should be highlighted, one after another.',
      'Combine a range-for loop with highlight().',
      'for (auto key : keys) {\n  highlight(key);\n}\nopen_vault();',
      'Loop first, then call open_vault() after the loop.',
    ],
  },
  'ailab-1': {
    starterCode: '// define open_door() to unlock() then slide_door()\n// then call open_door()\n',
    syntax: 'void open_door() {\n  unlock();\n  slide_door();\n}\n\nopen_door();',
    hintText: [
      'Bundle two steps into one reusable ability.',
      'Define with void name() { } and call with name().',
      'void open_door() {\n  unlock();\n  slide_door();\n}\n\nopen_door();',
      'Remember to CALL open_door() after defining it.',
    ],
  },
  'ailab-2': {
    starterCode: 'string drones[] = {"R1", "R2", "R3", "R4"};\n\n// define clear(group) that disables each drone in group\n// then call clear(drones)\n',
    syntax: 'void clear(auto group) {\n  for (auto d : group) {\n    disable(d);\n  }\n}\n\nclear(drones);',
    hintText: [
      'Combine a function, a parameter, and a loop.',
      'void clear(auto group) { ... } then loop over group inside.',
      'void clear(auto group) {\n  for (auto d : group) {\n    disable(d);\n  }\n}',
      'Call it with the drones list: clear(drones);',
    ],
  },
  'titan-1': {
    starterCode: 'string shield = "fire";\n\n// fire shield -> use_water_weapon()\n// otherwise   -> use_fire_weapon()\n',
    syntax: 'if (shield == "fire") {\n  use_water_weapon();\n}',
    hintText: [
      'Pick the weapon that counters the shield.',
      'Decide with if (shield == "fire") { }',
      'if (shield == "fire") {\n  use_water_weapon();\n} else {\n  use_fire_weapon();\n}',
      'Water counters fire — call use_water_weapon().',
    ],
  },
  'titan-2': {
    starterCode: '// strike() three times using a loop\n',
    syntax: 'for (int i = 0; i < 3; i = i + 1) {\n  strike();\n}',
    hintText: [
      'Strike exactly three times.',
      'A counted for loop runs a fixed number of times.',
      'for (int i = 0; i < 3; i = i + 1) {\n  strike();\n}',
      'for (int i = 0; i < 3; i = i + 1) {\n  strike();\n}',
    ],
  },
  'titan-3': {
    starterCode: '// define finish() that strikes 3 times with a loop\n// then call finish()\n',
    syntax: 'void finish() {\n  for (int i = 0; i < 3; i = i + 1) {\n    strike();\n  }\n}\n\nfinish();',
    hintText: [
      'Wrap a counted loop inside a function.',
      'void finish() { } with a for loop inside.',
      'void finish() {\n  for (int i = 0; i < 3; i = i + 1) {\n    strike();\n  }\n}\n\nfinish();',
      'Do not forget to CALL finish() at the end.',
    ],
  },
}

const VARIANTS: Record<Exclude<Language, 'python'>, VariantMap> = {
  javascript: JS,
  cpp: CPP,
}

export function getVariant(taskId: string, language: Language): LanguageVariant | null {
  if (language === 'python') return null
  return VARIANTS[language][taskId] ?? null
}
