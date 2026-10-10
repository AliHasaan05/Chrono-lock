import type { NPC } from '@/types'

export const NPCS: Record<string, NPC> = {
  chrono: {
    id: 'chrono',
    name: 'CHRONO',
    role: 'AI Companion',
    color: '#00f0ff',
    intro: [
      'Systems online. I am CHRONO, your companion AI.',
      'The city is failing. But every broken machine can be repaired... with code.',
      'Stay close. I will teach you what you need, exactly when you need it.',
    ],
  },
  byte: {
    id: 'byte',
    name: 'Professor Byte',
    role: 'Programming Mentor',
    color: '#ffcc00',
    intro: [
      'Welcome to the Chrono Academy, Chrononaut.',
      'You do not need to know everything. You need to learn one thing at a time.',
      'Let us start where every program starts: with a single instruction.',
    ],
  },
  kira: {
    id: 'kira',
    name: 'Kira',
    role: 'Security Specialist',
    color: '#ff3b6b',
    intro: [
      'The security grid went rogue. Lasers everywhere.',
      'You will need decisions — real if/else logic — to get through.',
    ],
  },
  loop9: {
    id: 'loop9',
    name: 'LOOP-9',
    role: 'Robot Assistant',
    color: '#7cff00',
    intro: [
      'Beep. The reactor has many dampeners. Too many to touch one by one.',
      'A loop repeats work. One instruction, many machines.',
    ],
  },
  vault: {
    id: 'vault',
    name: 'Vault Keeper',
    role: 'Data Specialist',
    color: '#b400ff',
    intro: [
      'The vault stores the city keys in a list.',
      'Lists remember order. Indexing lets you reach the exact one you need.',
    ],
  },
  titan: {
    id: 'titan',
    name: 'CHRONO TITAN',
    role: 'Rogue AI',
    color: '#ff2a2a',
    intro: [
      'YOU CANNOT CODE WHAT YOU DO NOT UNDERSTAND.',
      'Everything you learned ends here, Chrononaut.',
    ],
  },
}
