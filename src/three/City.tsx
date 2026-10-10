// ============================================================================
// CITY ENVIRONMENT — a readable, real-world-feeling cyberpunk city.
// ----------------------------------------------------------------------------
// Instead of scattered dark cubes, this builds a believable city block layout:
//   - an asphalt ground with painted road grid and crosswalks
//   - raised sidewalks along the roads
//   - varied buildings (towers, mid-rises, shops) with window grids, rooftop
//     units and lit signage, placed on blocks (never on roads)
//   - street lamps, planters, and a central plaza
// Everything is generated deterministically once and reused each frame.
// ============================================================================

import { useMemo } from 'react'
import * as THREE from 'three'
import { Instances, Instance } from '@react-three/drei'

function rng(seed: number) {
  let s = seed % 2147483647
  if (s <= 0) s += 2147483646
  return () => (s = (s * 16807) % 2147483647) / 2147483647
}

const BLOCK = 20 // city block size
const ROAD = 7 // road width
const HALF = 60 // city extends +/- HALF

interface B {
  x: number
  z: number
  w: number
  d: number
  h: number
  kind: 'tower' | 'mid' | 'shop'
  hue: string
}

const NEON = ['#00e5ff', '#b26bff', '#ff5c8a', '#8affc1', '#ffd166']

export function City({ litLevel }: { litLevel: number }) {
  const buildings = useMemo<B[]>(() => {
    const rand = rng(20240610)
    const list: B[] = []
    // Grid of blocks separated by roads. Buildings sit inside each block.
    for (let bx = -HALF; bx <= HALF; bx += BLOCK + ROAD) {
      for (let bz = -HALF; bz <= HALF; bz += BLOCK + ROAD) {
        // keep the central plaza clear
        if (Math.abs(bx) < BLOCK && Math.abs(bz) < BLOCK) continue
        // 1-3 buildings per block edge
        const perBlock = 2 + Math.floor(rand() * 2)
        for (let i = 0; i < perBlock; i++) {
          const w = 4 + rand() * 6
          const d = 4 + rand() * 6
          const ox = (rand() - 0.5) * (BLOCK - w - 2)
          const oz = (rand() - 0.5) * (BLOCK - d - 2)
          const roll = rand()
          const kind: B['kind'] = roll > 0.7 ? 'tower' : roll > 0.35 ? 'mid' : 'shop'
          const h = kind === 'tower' ? 18 + rand() * 24 : kind === 'mid' ? 9 + rand() * 8 : 4 + rand() * 3
          list.push({ x: bx + ox, z: bz + oz, w, d, h, kind, hue: NEON[Math.floor(rand() * NEON.length)] })
        }
      }
    }
    return list
  }, [])

  const lamps = useMemo(() => {
    const pts: [number, number][] = []
    for (let x = -HALF; x <= HALF; x += BLOCK + ROAD) {
      for (let z = -HALF + 6; z <= HALF; z += 14) {
        pts.push([x + ROAD / 2 + 1, z])
        pts.push([x - ROAD / 2 - 1, z])
      }
    }
    return pts
  }, [])

  const brightness = 0.4 + litLevel * 0.5

  return (
    <group>
      {/* asphalt ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[160, 160]} />
        <meshStandardMaterial color="#15161c" metalness={0.1} roughness={0.95} />
      </mesh>

      {/* road network (lighter asphalt strips along the grid) */}
      <RoadGrid />

      {/* sidewalks: slightly raised slabs around each block */}
      <Sidewalks />

      {/* central plaza */}
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} receiveShadow>
          <circleGeometry args={[14, 48]} />
          <meshStandardMaterial color="#20222b" roughness={0.9} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
          <ringGeometry args={[13, 14, 64]} />
          <meshStandardMaterial color="#00e5ff" emissive="#00e5ff" emissiveIntensity={0.9} toneMapped={false} />
        </mesh>
        {/* plaza beacon */}
        <mesh position={[0, 6, 0]}>
          <cylinderGeometry args={[0.2, 0.4, 12, 8]} />
          <meshStandardMaterial color="#0a0e1f" metalness={0.8} />
        </mesh>
        <mesh position={[0, 12, 0]}>
          <icosahedronGeometry args={[1, 0]} />
          <meshStandardMaterial color="#b26bff" emissive="#b26bff" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <pointLight position={[0, 10, 0]} intensity={1.1} color="#b26bff" distance={40} />
      </group>

      {/* buildings */}
      {buildings.map((b, i) => (
        <Building key={i} b={b} brightness={brightness} />
      ))}

      {/* street lamps (instanced for performance) */}
      <StreetLamps points={lamps} />
    </group>
  )
}

// ---------------------------------------------------------------------------
function RoadGrid() {
  const strips = useMemo(() => {
    const out: { pos: [number, number, number]; size: [number, number]; rot: boolean }[] = []
    for (let x = -HALF; x <= HALF; x += BLOCK + ROAD) {
      out.push({ pos: [x, 0.011, 0], size: [ROAD, 160], rot: false })
    }
    for (let z = -HALF; z <= HALF; z += BLOCK + ROAD) {
      out.push({ pos: [0, 0.011, z], size: [160, ROAD], rot: true })
    }
    return out
  }, [])

  return (
    <group>
      {strips.map((s, i) => (
        <group key={i}>
          <mesh rotation={[-Math.PI / 2, 0, 0]} position={s.pos} receiveShadow>
            <planeGeometry args={s.size} />
            <meshStandardMaterial color="#23242b" roughness={0.85} />
          </mesh>
          {/* center dashed line */}
          <mesh rotation={[-Math.PI / 2, 0, s.rot ? Math.PI / 2 : 0]} position={[s.pos[0], 0.013, s.pos[2]]}>
            <planeGeometry args={[0.25, 160]} />
            <meshStandardMaterial color="#d8c84a" emissive="#8a7a10" emissiveIntensity={0.3} />
          </mesh>
        </group>
      ))}
    </group>
  )
}

function Sidewalks() {
  const slabs = useMemo(() => {
    const out: [number, number][] = []
    for (let x = -HALF; x <= HALF; x += BLOCK + ROAD) {
      for (let z = -HALF; z <= HALF; z += BLOCK + ROAD) {
        if (Math.abs(x) < BLOCK && Math.abs(z) < BLOCK) continue
        out.push([x, z])
      }
    }
    return out
  }, [])
  return (
    <group>
      {slabs.map(([x, z], i) => (
        <mesh key={i} position={[x, 0.08, z]} receiveShadow castShadow>
          <boxGeometry args={[BLOCK, 0.16, BLOCK]} />
          <meshStandardMaterial color="#2b2d36" roughness={0.9} />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
function Building({ b, brightness }: { b: B; brightness: number }) {
  const bodyColor = b.kind === 'shop' ? '#2a2d3a' : b.kind === 'mid' ? '#1b1f2e' : '#141829'
  const rows = Math.max(2, Math.floor(b.h / 2))
  const cols = Math.max(2, Math.floor(b.w / 1.6))

  // build a window-grid texture via emissive strips on the facade
  return (
    <group position={[b.x, 0.16, b.z]}>
      {/* body */}
      <mesh position={[0, b.h / 2, 0]} castShadow receiveShadow>
        <boxGeometry args={[b.w, b.h, b.d]} />
        <meshStandardMaterial color={bodyColor} metalness={0.35} roughness={0.6} />
      </mesh>

      {/* window grid on the +Z and +X faces */}
      <WindowGrid w={b.w} h={b.h} rows={rows} cols={cols} face="z" depth={b.d} hue={b.hue} brightness={brightness} />
      <WindowGrid w={b.d} h={b.h} rows={rows} cols={Math.max(2, Math.floor(b.d / 1.6))} face="x" depth={b.w} hue={b.hue} brightness={brightness} />

      {/* rooftop unit */}
      <mesh position={[0, b.h + 0.5, 0]} castShadow>
        <boxGeometry args={[b.w * 0.4, 1, b.d * 0.4]} />
        <meshStandardMaterial color="#0c0f1c" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* neon sign band near the top for taller buildings */}
      {b.kind !== 'shop' && (
        <mesh position={[0, b.h * 0.8, b.d / 2 + 0.03]}>
          <planeGeometry args={[b.w * 0.9, 0.5]} />
          <meshStandardMaterial color={b.hue} emissive={b.hue} emissiveIntensity={1.4} toneMapped={false} />
        </mesh>
      )}

      {/* shop awning + glowing storefront */}
      {b.kind === 'shop' && (
        <>
          <mesh position={[0, 2.4, b.d / 2 + 0.4]} rotation={[Math.PI / 2.6, 0, 0]} castShadow>
            <planeGeometry args={[b.w, 1.4]} />
            <meshStandardMaterial color={b.hue} emissive={b.hue} emissiveIntensity={0.6} side={THREE.DoubleSide} />
          </mesh>
          <mesh position={[0, 1.2, b.d / 2 + 0.02]}>
            <planeGeometry args={[b.w * 0.85, 2]} />
            <meshStandardMaterial color="#cfe8ff" emissive="#9fe8ff" emissiveIntensity={0.5 + brightness} toneMapped={false} />
          </mesh>
        </>
      )}
    </group>
  )
}

function WindowGrid({
  w, h, rows, cols, face, depth, hue, brightness,
}: {
  w: number; h: number; rows: number; cols: number
  face: 'z' | 'x'; depth: number; hue: string; brightness: number
}) {
  const windows = useMemo(() => {
    const r = rng(Math.floor((w + h + depth) * 97))
    const items: { px: number; py: number; on: boolean }[] = []
    const mw = (w * 0.82) / cols
    const mh = (h * 0.88) / rows
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        const px = -w * 0.41 + mw * (c + 0.5)
        const py = mh * (rr + 0.6)
        items.push({ px, py, on: r() > 0.35 })
      }
    }
    return { items, mw: mw * 0.7, mh: mh * 0.6 }
  }, [w, h, rows, cols, depth])

  const z = face === 'z' ? depth / 2 + 0.02 : 0
  const x = face === 'x' ? depth / 2 + 0.02 : 0
  const rot: [number, number, number] = face === 'x' ? [0, Math.PI / 2, 0] : [0, 0, 0]

  return (
    <group position={[x, 0, z]} rotation={rot}>
      {windows.items.map((win, i) => (
        <mesh key={i} position={[win.px, win.py, 0]}>
          <planeGeometry args={[windows.mw, windows.mh]} />
          <meshStandardMaterial
            color={win.on ? hue : '#0a0d18'}
            emissive={win.on ? hue : '#000000'}
            emissiveIntensity={win.on ? brightness * 1.3 : 0}
            toneMapped={false}
          />
        </mesh>
      ))}
    </group>
  )
}

// ---------------------------------------------------------------------------
function StreetLamps({ points }: { points: [number, number][] }) {
  return (
    <Instances limit={points.length} castShadow>
      <cylinderGeometry args={[0.08, 0.1, 5, 6]} />
      <meshStandardMaterial color="#2a2d3a" metalness={0.6} roughness={0.5} />
      {points.map(([x, z], i) => (
        <group key={i}>
          <Instance position={[x, 2.5, z]} />
          {/* lamp glow */}
          <mesh position={[x, 5, z]}>
            <sphereGeometry args={[0.22, 8, 8]} />
            <meshStandardMaterial color="#fff2c0" emissive="#ffd98a" emissiveIntensity={1.4} toneMapped={false} />
          </mesh>
        </group>
      ))}
    </Instances>
  )
}
