import type { CodexEntry } from '@/types'

export const CODEX: CodexEntry[] = [
  {
    concept: 'variables',
    title: 'Variables',
    purpose: 'Store information so you can use it later.',
    syntax: 'name = value',
    example: 'speed = 60\nengine = "ready"',
  },
  {
    concept: 'print',
    title: 'print()',
    purpose: 'Show a value in the output console.',
    syntax: 'print(value)',
    example: 'print("Launch sequence started")',
  },
  {
    concept: 'conditions',
    title: 'if / elif / else',
    purpose: 'Make the program choose between actions.',
    syntax: 'if condition:\n    action()\nelse:\n    other()',
    example: 'if laser == "red":\n    activate_shield()\nelse:\n    jump()',
  },
  {
    concept: 'comparison',
    title: 'Comparison operators',
    purpose: 'Compare two values. "==" checks equality, "=" assigns.',
    syntax: '==  !=  <  >  <=  >=',
    example: 'if energy > 50:\n    stabilize()',
  },
  {
    concept: 'loops-for',
    title: 'for loop',
    purpose: 'Repeat an action for every item in a collection.',
    syntax: 'for item in things:\n    process(item)',
    example: 'for dampener in dampeners:\n    drain(dampener)',
  },
  {
    concept: 'lists',
    title: 'Lists & indexing',
    purpose: 'Store many values in order. Index starts at 0.',
    syntax: 'items = [a, b, c]\nitems[0]',
    example: 'keys = ["NOVA", "ECHO", "FLUX"]\nprint(keys[1])  # ECHO',
  },
  {
    concept: 'functions',
    title: 'Functions',
    purpose: 'Package reusable behavior you can call by name.',
    syntax: 'def name():\n    action()',
    example: 'def open_door():\n    unlock()\n    slide_door()\n\nopen_door()',
  },
]
