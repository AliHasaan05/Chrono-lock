# Chrono-Lock: Coding Adventure

**Code the city. Learn programming by changing the world.**

A 3D cyberpunk adventure game where you learn **real Python programming** by writing
code that controls and repairs a futuristic city. You do not answer quizzes — you
write actual code, run it, and watch the 3D world react.

## How to Play

### Easiest way (Windows)
Double-click **`Play-ChronoLock.bat`**. It will:
1. Check that Node.js is installed.
2. Install dependencies the first time (one-time, a couple of minutes).
3. Launch the game and open it in your browser at `http://localhost:5173`.

Keep the console window open while playing. Close it to stop the game.

### Manual way
```bash
npm install
npm run start
```

> Requires **Node.js 18+** (https://nodejs.org).

## Controls
| Action | Key |
| --- | --- |
| Move | `W` `A` `S` `D` |
| Sprint | `Shift` |
| Jump | `Space` |
| Look | Click + drag the mouse |
| Interact (NPC / Terminal) | `E` |
| Pause / Menu | `Esc` |
| Map / Skills / Codex / Inventory / Base | `M` `K` `C` `I` `B` |

## The Gameplay Loop
`EXPLORE → TALK → LEARN → CODE → HINT → DEBUG → RUN → WORLD REACTS → REWARD → UNLOCK`

Walk up to a glowing **terminal**, press `E`, read the teaching card
(WHAT / HOW / WHY), write real code, and hit **Run**. Correct code physically
changes the city: the monorail launches, lasers drop, reactor dampeners drain one
by one, vault keys light up, lab doors slide open, and the Chrono Titan takes damage.

## Sectors (Curriculum)
1. **Monorail** — sequence & variables
2. **Laser Corridor** — if / elif / else, comparison, logic
3. **Power Generator** — for & while loops
4. **Data Vault** — lists & indexing
5. **AI Lab** — functions & parameters
6. **Chrono Titan** — combine everything (boss)

## Learning Features
- **Real sandboxed interpreter** — your code is actually parsed and executed
  (never `eval`-ed), producing output, variables, a debug trace, and world actions.
- **Progressive learning** across 7 stages (recognize → complete → rearrange →
  guided → partial → free coding → open problem).
- **Contextual hints** — every task has 3–4 progressive hints. CHRONO turns
  mistakes (`=` vs `==`, bad indentation, misspelled names) into teaching moments.
- **Step-by-step debugger** — pause execution and inspect each line and variable.
- **Teach-Me mode** — CHRONO builds the solution with you, one question at a time.
- **Mastery, skill tree, codex, trophies** — RPG-style progression that tracks
  real understanding. Progress auto-saves to your browser.

## Architecture
The education engine and the 3D engine are **fully decoupled**:

```
CODE  →  INTERPRETER  →  LEARNING RESULT  →  GAME ACTIONS  →  WORLD EVENT BUS  →  3D WORLD REACTS
```

- `src/engine/` — the safe interpreter + evaluator (no DOM, no network).
- `src/content/` — sectors, tasks, hints, NPCs, codex, mission game-functions.
- `src/state/` — persistent game store (Zustand) + UI store + world event bus.
- `src/three/` — the 3D city, player, NPCs, terminals, and reactive mission props.
- `src/ui/` — HUD, terminal/coding interface, menus, dialogue.

## 3D Assets
Real glTF models are downloaded into `public/models/`:
- `RobotExpressive.glb` — animated player (three.js example asset).
- `CesiumMan.glb` — animated NPCs (Khronos glTF sample asset).

No placeholder/dummy models are used.
