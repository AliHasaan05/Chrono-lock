// ============================================================================
// STORYLINE — a DISTINCT narrative per language.
// ----------------------------------------------------------------------------
// Each language gets its own setting, antagonist flavor, companion voice, and
// per-sector mission framing. The underlying missions (concepts + code) are the
// same, but the story the player experiences is genuinely different depending
// on whether they chose Python, JavaScript, or C++.
// ============================================================================

import type { Language } from '@/types'

export interface SectorStory {
  name: string      // district name in this language's world
  briefing: string  // what's wrong + what the player must do (language-flavored)
}

export interface Story {
  codename: string
  world: string          // the name of the city/world in this story
  companion: string      // the AI companion's name
  antagonist: string     // the final boss name
  tagline: string
  intro: string[]        // world-entry dialogue
  outro: string          // shown when the whole game is complete
  mentorLine: string
  sectors: Record<string, SectorStory> // keyed by sector id
}

// ---------------------------------------------------------------------------
export const STORYLINES: Record<Language, Story> = {
  // =========================================================================
  // PYTHON — "Serpent Protocol": a calm, elegant AI-garden city.
  // =========================================================================
  python: {
    codename: 'SERPENT PROTOCOL',
    world: 'Edenion',
    companion: 'PYTHIA',
    antagonist: 'THE GREAT SERPENT',
    tagline: 'Clean code, clear mind. Edenion listens to Python.',
    intro: [
      'PYTHIA: Welcome to Edenion, Chrononaut. I am Pythia, your guide.',
      'PYTHIA: This city was grown, not built — gardens of logic laced through glass towers.',
      'PYTHIA: It fell silent when the Great Serpent corrupted the roots. We heal it with clean, indented Python.',
      'PYTHIA: No clutter. No noise. Just intent. Follow the glowing terminals.',
    ],
    outro: 'Edenion breathes again. The Great Serpent is unwound. You wrote the city back to life — the Pythonic way.',
    mentorLine: 'In Edenion we write it readable: indentation is meaning.',
    sectors: {
      monorail: { name: 'Garden Line', briefing: 'The living monorail that threads the gardens has gone dormant. Store its values and wake it with simple statements.' },
      laser: { name: 'Thorn Gate', briefing: 'The thorn-barriers react to color. Teach the garden to decide with if / elif / else.' },
      reactor: { name: 'Root Reactor', briefing: 'The reactor roots overgrew into unstable dampeners. Prune every one with a single loop.' },
      vault: { name: 'Seed Vault', briefing: 'The city seeds are stored in order. Reach the right seed by its index.' },
      ailab: { name: 'Greenhouse Lab', briefing: 'The greenhouse doors need grown abilities. Define functions and call them to open the way.' },
      titan: { name: "Serpent's Nest", briefing: 'The Great Serpent waits at the roots. Use everything Edenion taught you to unwind it.' },
    },
  },

  // =========================================================================
  // JAVASCRIPT — "Cipher Web": a neon, hyper-connected net-city.
  // =========================================================================
  javascript: {
    codename: 'CIPHER WEB',
    world: 'Nodeport',
    companion: 'ECHO.JS',
    antagonist: 'THE NULL DAEMON',
    tagline: 'Everything is connected. Nodeport runs on JavaScript.',
    intro: [
      'ECHO.JS: Booting... hey Chrononaut, Echo here. Welcome to Nodeport.',
      'ECHO.JS: This whole city is one giant event loop — streets, signs, trains, all callbacks.',
      'ECHO.JS: The Null Daemon broke the handlers. Everything is throwing errors.',
      'ECHO.JS: We fix it with JavaScript — braces, semicolons, console calls. Click a terminal and let us ship.',
    ],
    outro: 'Nodeport is back online. The Null Daemon is caught and resolved. Every handler fires again — you rebuilt the Web.',
    mentorLine: 'In Nodeport we wire it with braces and console.log.',
    sectors: {
      monorail: { name: 'Transit API', briefing: 'The transit service returns no data. Set its values and call its functions to deploy the train.' },
      laser: { name: 'Firewall Grid', briefing: 'The firewall throws on the wrong input. Route each case with if / else if / else.' },
      reactor: { name: 'Event Reactor', briefing: 'The reactor queued too many events. Flush every one with a single loop.' },
      vault: { name: 'Data Store', briefing: 'The access keys live in an array. Grab the right one by its index.' },
      ailab: { name: 'Function Foundry', briefing: 'The foundry needs reusable handlers. Define functions and call them to open the gates.' },
      titan: { name: 'The Kernel', briefing: 'The Null Daemon squats in the kernel. Combine everything Nodeport taught you to patch it out.' },
    },
  },

  // =========================================================================
  // C++ — "Iron Core": a heavy industrial fortress-city.
  // =========================================================================
  cpp: {
    codename: 'IRON CORE',
    world: 'Forge-7',
    companion: 'SENTINEL',
    antagonist: 'THE OVERLORD UNIT',
    tagline: 'Raw power, strict rules. Forge-7 obeys C++.',
    intro: [
      'SENTINEL: Chrononaut on deck. I am Sentinel. This is Forge-7.',
      'SENTINEL: A heavy-metal city — reactors, cranes, war-foundries. Nothing here forgives a mistake.',
      'SENTINEL: The Overlord Unit seized the machines. Types drifted. Memory corrupted.',
      'SENTINEL: We take it back with C++ — declare your types, brace your blocks, be exact. Move out.',
    ],
    outro: 'Forge-7 stands. The Overlord Unit is dismantled, bolt by bolt. You rebuilt the fortress in strict, exact C++.',
    mentorLine: 'On Forge-7 we build it typed, braced, and exact.',
    sectors: {
      monorail: { name: 'Rail Foundry', briefing: 'The heavy rail is cold on the tracks. Declare its values and call its routines to launch it.' },
      laser: { name: 'Turret Corridor', briefing: 'The defense turrets fire by target type. Command each case with if / else if / else.' },
      reactor: { name: 'Core Reactor', briefing: 'The reactor dampeners are redlining. Vent every one with a single loop.' },
      vault: { name: 'Armory Vault', briefing: 'The override codes sit in a fixed array. Reach the right one by its index.' },
      ailab: { name: 'Fabrication Lab', briefing: 'The blast doors need custom routines. Define functions and call them to breach through.' },
      titan: { name: 'Overlord Bay', briefing: 'The Overlord Unit powers up in the bay. Use everything Forge-7 forged in you to bring it down.' },
    },
  },
}

export function storyFor(language: Language | null): Story {
  return STORYLINES[language ?? 'python']
}
