// ============================================================================
// WORLD — the 3D scene graph + interaction loop.
// ----------------------------------------------------------------------------
// Places districts (one per sector), their terminals, NPCs, and reactive
// mission props. Each frame it measures the player's distance to interactables
// and reports the nearest one so the HUD can show "[E]" and E can trigger it.
// ============================================================================

import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Environment, Stars } from '@react-three/drei'
import * as THREE from 'three'
import { Player } from './Player'
import { City } from './City'
import { Terminal } from './Terminal'
import { NPCCharacter } from './NPCCharacter'
import {
  MonorailTrain,
  LaserGate,
  Reactor,
  DataVault,
  AILab,
  ChronoTitan,
} from './MissionProps'
import { SECTORS } from '@/content/sectors'
import { TASKS } from '@/content/tasks'
import { NPCS } from '@/content/npcs'
import { storyFor } from '@/content/storyline'
import { useGameStore } from '@/state/gameStore'
import { useUIStore } from '@/state/uiStore'

// District layout around the central plaza (one per sector).
const DISTRICTS: Record<string, { pos: [number, number, number]; npc: string }> = {
  monorail: { pos: [-24, 0, -10], npc: 'byte' },
  laser: { pos: [24, 0, -10], npc: 'kira' },
  reactor: { pos: [-24, 0, 20], npc: 'loop9' },
  vault: { pos: [24, 0, 20], npc: 'vault' },
  ailab: { pos: [0, 0, -28], npc: 'byte' },
  titan: { pos: [0, 0, 34], npc: 'titan' },
}

export interface Interactable {
  id: string
  kind: 'terminal' | 'npc'
  taskId?: string
  npcId?: string
  sectorId?: string
  position: THREE.Vector3
  label: string
}

export function World() {
  const overlay = useUIStore((s) => s.overlay)
  const screen = useUIStore((s) => s.screen)
  const unlockedSectors = useGameStore((s) => s.unlockedSectors)
  const completedTasks = useGameStore((s) => s.completedTasks)
  const reducedMotion = useGameStore((s) => s.settings.reducedMotion)

  const controlsEnabled = () => overlay === null && screen === 'world'

  const litLevel = Math.min(1, unlockedSectors.length / SECTORS.length)

  return (
    <Canvas
      shadows
      dpr={[1, reducedMotion ? 1 : 1.6]}
      camera={{ fov: 60, near: 0.1, far: 300, position: [0, 5, 14] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0a0e1a']} />
      <fog attach="fog" args={['#0a0e1a', 70, 150]} />

      {/* lighting — dusk city: cool sky light + warm key so streets read well */}
      <hemisphereLight args={['#9fb8ff', '#1a1d2a', 0.7]} />
      <ambientLight intensity={0.45} color="#8aa0ff" />
      <directionalLight
        position={[30, 50, 20]}
        intensity={1.5}
        color="#ffe6c0"
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-80}
        shadow-camera-right={80}
        shadow-camera-top={80}
        shadow-camera-bottom={-80}
        shadow-bias={-0.0004}
      />
      {!reducedMotion && <Stars radius={160} depth={70} count={1200} factor={4} fade speed={0.4} />}
      <Environment preset="city" />

      <SceneContents
        controlsEnabled={controlsEnabled}
        litLevel={litLevel}
        unlockedSectors={unlockedSectors}
        completedTasks={completedTasks}
        labelsVisible={overlay === null}
      />
    </Canvas>
  )
}

function SceneContents({
  controlsEnabled,
  litLevel,
  unlockedSectors,
  completedTasks,
  labelsVisible,
}: {
  controlsEnabled: () => boolean
  litLevel: number
  unlockedSectors: string[]
  completedTasks: string[]
  labelsVisible: boolean
}) {
  const playerPos = useRef(new THREE.Vector3(0, 0, 8))
  const [nearId, setNearId] = useState<string | null>(null)
  const openTerminal = useUIStore((s) => s.openTerminal)
  const openDialogue = useUIStore((s) => s.openDialogue)

  // Build the list of interactables from unlocked sectors.
  const interactables = useMemo<Interactable[]>(() => {
    const list: Interactable[] = []
    for (const sector of SECTORS) {
      if (!unlockedSectors.includes(sector.id)) continue
      const district = DISTRICTS[sector.id]
      if (!district) continue
      const [dx, , dz] = district.pos

      // NPC
      list.push({
        id: `npc-${sector.id}`,
        kind: 'npc',
        npcId: district.npc,
        sectorId: sector.id,
        position: new THREE.Vector3(dx + 3, 0, dz + 3),
        label: NPCS[district.npc]?.name ?? 'NPC',
      })

      // one terminal per task, lined up in the district
      const tasks = TASKS.filter((t) => t.sectorId === sector.id)
      tasks.forEach((task, i) => {
        list.push({
          id: `term-${task.id}`,
          kind: 'terminal',
          taskId: task.id,
          position: new THREE.Vector3(dx - 3 + i * 3, 0, dz - 2),
          label: task.title,
        })
      })
    }
    return list
  }, [unlockedSectors])

  // E key triggers nearest interactable
  useFrameInteraction(nearId, interactables, openTerminal, openDialogue)

  // proximity check each frame
  useFrame(() => {
    let closest: string | null = null
    let closestDist = 3.2 // interaction radius
    for (const it of interactables) {
      const d = playerPos.current.distanceTo(it.position)
      if (d < closestDist) {
        closestDist = d
        closest = it.id
      }
    }
    if (closest !== nearId) setNearId(closest)
  })

  return (
    <>
      <City litLevel={litLevel} />

      <Player
        onPosition={(p) => playerPos.current.copy(p)}
        startPosition={[0, 0, 8]}
      />

      {/* district props */}
      {unlockedSectors.includes('monorail') && <MonorailTrain position={[-24, 1, -14]} />}
      {unlockedSectors.includes('laser') && <LaserGate position={[24, 0, -14]} />}
      {unlockedSectors.includes('reactor') && <Reactor position={[-24, 0, 24]} />}
      {unlockedSectors.includes('vault') && <DataVault position={[24, 0, 24]} />}
      {unlockedSectors.includes('ailab') && <AILab position={[0, 0, -32]} />}
      {unlockedSectors.includes('titan') && <ChronoTitan position={[0, 0, 40]} />}

      {/* interactables */}
      {interactables.map((it) => {
        const near = it.id === nearId
        if (it.kind === 'terminal') {
          const completed = completedTasks.includes(it.taskId!)
          return (
            <group key={it.id} position={it.position.toArray()}>
              <Terminal position={[0, 0, 0]} label={it.label} near={near} completed={completed} locked={false} labelsVisible={labelsVisible} />
            </group>
          )
        }
        const npc = NPCS[it.npcId!]
        return (
          <NPCCharacter
            key={it.id}
            position={it.position.toArray() as [number, number, number]}
            color={npc?.color ?? '#00f0ff'}
            name={npc?.name ?? 'NPC'}
            near={near}
            labelsVisible={labelsVisible}
          />
        )
      })}
    </>
  )
}

// E fires the nearest interactable. Reads enabled-state live from the store so
// it keeps working after re-renders. Bound once with stable refs.
function useFrameInteraction(
  nearId: string | null,
  interactables: Interactable[],
  openTerminal: (taskId: string) => void,
  openDialogue: (npcId: string, lines: string[]) => void
) {
  const nearRef = useRef(nearId)
  nearRef.current = nearId
  const listRef = useRef(interactables)
  listRef.current = interactables

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'KeyE') return
      const ui = useUIStore.getState()
      if (ui.overlay !== null || ui.screen !== 'world') return
      const id = nearRef.current
      if (!id) return
      const it = listRef.current.find((x) => x.id === id)
      if (!it) return
      if (it.kind === 'terminal' && it.taskId) {
        openTerminal(it.taskId)
      } else if (it.kind === 'npc' && it.npcId) {
        // Build a language-flavored briefing: companion voice + sector story.
        const lang = useGameStore.getState().language
        const story = storyFor(lang)
        const sectorStory = it.sectorId ? story.sectors[it.sectorId] : undefined
        const npc = NPCS[it.npcId]
        const lines: string[] = []
        if (sectorStory) {
          lines.push(`${npc?.name}: Welcome to ${sectorStory.name}.`)
          lines.push(`${npc?.name}: ${sectorStory.briefing}`)
          lines.push(`${npc?.name}: ${story.mentorLine}`)
        } else {
          lines.push(...(npc?.intro ?? []))
        }
        openDialogue(it.npcId, lines)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openTerminal, openDialogue])
}
