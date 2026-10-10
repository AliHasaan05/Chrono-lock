import type { Sector } from '@/types'

export const SECTORS: Sector[] = [
  {
    id: 'monorail',
    index: 1,
    name: 'Monorail Station',
    subtitle: 'Sequence & Variables',
    concepts: ['print', 'variables'],
    description:
      'The city monorail is dead on the tracks. Configure its systems with code and launch it.',
    taskIds: ['monorail-1', 'monorail-2', 'monorail-3'],
    unlockedByDefault: true,
  },
  {
    id: 'laser',
    index: 2,
    name: 'Laser Corridor',
    subtitle: 'Conditions & Logic',
    concepts: ['conditions', 'comparison', 'logical'],
    description:
      'The security grid is firing lasers. Teach your program to decide the right response.',
    taskIds: ['laser-1', 'laser-2'],
    unlockedByDefault: false,
  },
  {
    id: 'reactor',
    index: 3,
    name: 'Power Generator',
    subtitle: 'Loops',
    concepts: ['loops-for', 'loops-while'],
    description:
      'The reactor has many unstable dampeners. Drain them all with a single loop.',
    taskIds: ['reactor-1', 'reactor-2'],
    unlockedByDefault: false,
  },
  {
    id: 'vault',
    index: 4,
    name: 'Data Vault',
    subtitle: 'Lists & Indexing',
    concepts: ['lists', 'indexing'],
    description:
      'The city keys live in a locked vault. Reach the right one by its index.',
    taskIds: ['vault-1', 'vault-2'],
    unlockedByDefault: false,
  },
  {
    id: 'ailab',
    index: 5,
    name: 'AI Lab',
    subtitle: 'Functions',
    concepts: ['functions', 'parameters'],
    description:
      'The lab doors need custom abilities. Define functions and call them to open the way.',
    taskIds: ['ailab-1', 'ailab-2'],
    unlockedByDefault: false,
  },
  {
    id: 'titan',
    index: 6,
    name: 'Chrono Titan',
    subtitle: 'Final Challenge',
    concepts: ['conditions', 'loops-for', 'functions'],
    description:
      'The rogue AI awaits. Use everything you have learned to bring it down.',
    taskIds: ['titan-1', 'titan-2', 'titan-3'],
    unlockedByDefault: false,
  },
]

export function getSector(id: string): Sector | undefined {
  return SECTORS.find((s) => s.id === id)
}
