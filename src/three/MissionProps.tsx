// ============================================================================
// MISSION PROPS — the city objects that visibly REACT to the player's code.
// ----------------------------------------------------------------------------
// This is the heart of the game: CODE -> WORLD. Each prop subscribes to the
// world event bus and animates when the matching GameAction arrives. A loop in
// the editor produces staggered actions, so drones/dampeners shut down one by
// one, exactly as the learner intended.
// ============================================================================

import { useEffect, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import { subscribeWorld } from '@/state/worldEvents'
import type { GameAction } from '@/types'
import { playSfx } from '@/audio/sound'

// ---------------------------------------------------------------------------
// Monorail train
// ---------------------------------------------------------------------------
export function MonorailTrain({ position }: { position: [number, number, number] }) {
  const train = useRef<THREE.Group>(null!)
  const [launched, setLaunched] = useState(false)
  const [doorsClosed, setDoorsClosed] = useState(false)
  const offset = useRef(0)

  useEffect(() =>
    subscribeWorld((a: GameAction) => {
      if (a.type === 'ACTIVATE_TRAIN') {
        setLaunched(true)
        playSfx('reactor')
      }
      if (a.type === 'CLOSE_DOORS') {
        setDoorsClosed(true)
        playSfx('door')
      }
    })
  , [])

  useFrame((_, dt) => {
    if (launched && train.current) {
      offset.current += dt * 10
      train.current.position.x = position[0] + ((offset.current % 100) - 20)
    }
  })

  return (
    <group>
      {/* rail */}
      <mesh position={[position[0] + 20, position[1] - 0.3, position[2]]}>
        <boxGeometry args={[80, 0.3, 2.4]} />
        <meshStandardMaterial color="#1a2140" metalness={0.6} roughness={0.4} />
      </mesh>
      <group ref={train} position={position}>
        <mesh castShadow>
          <boxGeometry args={[5, 1.8, 2]} />
          <meshStandardMaterial
            color="#122047"
            emissive={launched ? '#00f0ff' : '#071024'}
            emissiveIntensity={launched ? 0.8 : 0.15}
            metalness={0.7}
            roughness={0.3}
          />
        </mesh>
        {/* windows */}
        <mesh position={[0, 0.3, 1.01]}>
          <planeGeometry args={[4, 0.7]} />
          <meshStandardMaterial
            color={launched ? '#aef6ff' : '#0a1428'}
            emissive={launched ? '#00f0ff' : '#000'}
            emissiveIntensity={launched ? 0.9 : 0}
            toneMapped={false}
          />
        </mesh>
        {/* doors */}
        <mesh position={[doorsClosed ? -1 : -1.6, 0, 1.02]}>
          <planeGeometry args={[0.9, 1.6]} />
          <meshStandardMaterial color="#1e2d55" metalness={0.5} />
        </mesh>
        <mesh position={[doorsClosed ? 1 : 1.6, 0, 1.02]}>
          <planeGeometry args={[0.9, 1.6]} />
          <meshStandardMaterial color="#1e2d55" metalness={0.5} />
        </mesh>
      </group>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Laser gate + shield
// ---------------------------------------------------------------------------
export function LaserGate({ position }: { position: [number, number, number] }) {
  const [shield, setShield] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const laser = useRef<THREE.Mesh>(null!)

  useEffect(() =>
    subscribeWorld((a) => {
      if (a.type === 'ACTIVATE_SHIELD') { setShield(true); playSfx('laser') }
      if (a.type === 'DISABLE_LASER') { setDisabled(true); playSfx('laser') }
      if (a.type === 'PLAYER_JUMP') playSfx('ui')
    })
  , [])

  useFrame((state) => {
    if (laser.current) {
      const mat = laser.current.material as THREE.MeshStandardMaterial
      mat.emissiveIntensity = disabled ? 0 : 1 + Math.sin(state.clock.elapsedTime * 10) * 0.5
      laser.current.visible = !disabled
    }
  })

  return (
    <group position={position}>
      {/* pillars */}
      {[-1.5, 1.5].map((x) => (
        <mesh key={x} position={[x, 1.5, 0]} castShadow>
          <boxGeometry args={[0.4, 3, 0.4]} />
          <meshStandardMaterial color="#1a1030" metalness={0.6} />
        </mesh>
      ))}
      {/* laser beam */}
      <mesh ref={laser} position={[0, 1.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.06, 3, 8]} />
        <meshStandardMaterial color="#ff2a4d" emissive="#ff2a4d" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      {/* shield */}
      {shield && (
        <mesh position={[0, 1.5, 0.5]}>
          <planeGeometry args={[3, 3]} />
          <meshStandardMaterial
            color="#00f0ff"
            emissive="#00f0ff"
            emissiveIntensity={0.6}
            transparent
            opacity={0.35}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Reactor with 5 dampeners that drain one by one
// ---------------------------------------------------------------------------
export function Reactor({ position }: { position: [number, number, number] }) {
  const [drained, setDrained] = useState<Set<number>>(new Set())
  const [stable, setStable] = useState(false)
  const core = useRef<THREE.Mesh>(null!)

  useEffect(() =>
    subscribeWorld((a) => {
      if (a.type === 'DRAIN_DAMPENER') {
        setDrained((prev) => new Set(prev).add(a.index))
        playSfx('reactor')
      }
      if (a.type === 'STABILIZE_REACTOR') { setStable(true); playSfx('success') }
    })
  , [])

  useFrame((state, dt) => {
    if (core.current) {
      core.current.rotation.y += dt * (stable ? 0.5 : 2)
      const mat = core.current.material as THREE.MeshStandardMaterial
      mat.emissive.set(stable ? '#7cff00' : '#ff6a00')
      mat.emissiveIntensity = 1 + Math.sin(state.clock.elapsedTime * (stable ? 2 : 8)) * 0.4
    }
  })

  return (
    <group position={position}>
      <mesh ref={core} position={[0, 2, 0]} castShadow>
        <icosahedronGeometry args={[1, 1]} />
        <meshStandardMaterial color="#2a1200" emissive="#ff6a00" emissiveIntensity={1} toneMapped={false} />
      </mesh>
      {/* 5 dampeners in a ring */}
      {[0, 1, 2, 3, 4].map((i) => {
        const ang = (i / 5) * Math.PI * 2
        const isDrained = drained.has(i)
        return (
          <mesh key={i} position={[Math.cos(ang) * 2.6, 0.6, Math.sin(ang) * 2.6]} castShadow>
            <cylinderGeometry args={[0.35, 0.35, 1.2, 10]} />
            <meshStandardMaterial
              color={isDrained ? '#0a2a0a' : '#301500'}
              emissive={isDrained ? '#7cff00' : '#ff3b00'}
              emissiveIntensity={isDrained ? 0.6 : 0.9}
              toneMapped={false}
            />
          </mesh>
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------------------------
// Data Vault with 3 keys
// ---------------------------------------------------------------------------
const VAULT_KEYS = ['NOVA', 'ECHO', 'FLUX']
export function DataVault({ position }: { position: [number, number, number] }) {
  const [highlighted, setHighlighted] = useState<Set<number>>(new Set())
  const [open, setOpen] = useState(false)

  useEffect(() =>
    subscribeWorld((a) => {
      if (a.type === 'HIGHLIGHT_KEY') {
        setHighlighted((prev) => {
          const next = new Set(prev)
          const idx = VAULT_KEYS.indexOf(a.label)
          next.add(idx >= 0 ? idx : a.index)
          return next
        })
        playSfx('ui')
      }
      if (a.type === 'OPEN_VAULT') { setOpen(true); playSfx('door') }
    })
  , [])

  return (
    <group position={position}>
      <mesh position={[0, 1.5, -0.5]} castShadow>
        <boxGeometry args={[4, 3, 1]} />
        <meshStandardMaterial color="#140a28" metalness={0.6} roughness={0.4} emissive={open ? '#b400ff' : '#000'} emissiveIntensity={open ? 0.4 : 0} />
      </mesh>
      {VAULT_KEYS.map((label, i) => {
        const on = highlighted.has(i)
        return (
          <group key={label} position={[(i - 1) * 1.1, 1.5, 0.2]}>
            <mesh castShadow>
              <boxGeometry args={[0.7, 0.9, 0.2]} />
              <meshStandardMaterial
                color={on ? '#b400ff' : '#241038'}
                emissive={on ? '#d070ff' : '#140a28'}
                emissiveIntensity={on ? 1 : 0.2}
                toneMapped={false}
              />
            </mesh>
            <Html position={[0, 0, 0.2]} center distanceFactor={9}>
              <div style={{ fontFamily: 'Consolas, monospace', fontSize: 11, color: on ? '#fff' : '#8a93b8', fontWeight: 700 }}>{label}</div>
            </Html>
          </group>
        )
      })}
    </group>
  )
}

// ---------------------------------------------------------------------------
// AI Lab door + 4 drones
// ---------------------------------------------------------------------------
export function AILab({ position }: { position: [number, number, number] }) {
  const [open, setOpen] = useState(false)
  const [disabled, setDisabled] = useState<Set<number>>(new Set())
  const leftDoor = useRef<THREE.Mesh>(null!)
  const rightDoor = useRef<THREE.Mesh>(null!)

  useEffect(() =>
    subscribeWorld((a) => {
      if (a.type === 'OPEN_DOOR') { setOpen(true); playSfx('door') }
      if (a.type === 'DISABLE_DRONE') {
        setDisabled((prev) => new Set(prev).add(a.index))
        playSfx('laser')
      }
    })
  , [])

  useFrame(() => {
    if (leftDoor.current && rightDoor.current) {
      const t = open ? 1 : 0
      leftDoor.current.position.x = THREE.MathUtils.lerp(leftDoor.current.position.x, -1 - t, 0.1)
      rightDoor.current.position.x = THREE.MathUtils.lerp(rightDoor.current.position.x, 1 + t, 0.1)
    }
  })

  return (
    <group position={position}>
      {/* door frame */}
      <mesh position={[0, 2, -0.6]}>
        <boxGeometry args={[4.4, 4, 0.3]} />
        <meshStandardMaterial color="#0c1430" metalness={0.6} />
      </mesh>
      <mesh ref={leftDoor} position={[-1, 1.6, -0.4]}>
        <boxGeometry args={[2, 3.2, 0.2]} />
        <meshStandardMaterial color="#17224a" emissive="#00f0ff" emissiveIntensity={0.2} metalness={0.7} />
      </mesh>
      <mesh ref={rightDoor} position={[1, 1.6, -0.4]}>
        <boxGeometry args={[2, 3.2, 0.2]} />
        <meshStandardMaterial color="#17224a" emissive="#00f0ff" emissiveIntensity={0.2} metalness={0.7} />
      </mesh>
      {/* drones */}
      {[0, 1, 2, 3].map((i) => {
        const off = disabled.has(i)
        return <Drone key={i} position={[(i - 1.5) * 1.5, 2.6, 1.6]} disabled={off} />
      })}
    </group>
  )
}

function Drone({ position, disabled }: { position: [number, number, number]; disabled: boolean }) {
  const g = useRef<THREE.Group>(null!)
  useFrame((state) => {
    if (!g.current) return
    if (disabled) {
      g.current.position.y = THREE.MathUtils.lerp(g.current.position.y, 0.4, 0.05)
      g.current.rotation.z += 0.1
    } else {
      g.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2 + position[0]) * 0.2
    }
  })
  return (
    <group ref={g} position={position}>
      <mesh castShadow>
        <sphereGeometry args={[0.3, 12, 12]} />
        <meshStandardMaterial
          color={disabled ? '#331010' : '#102040'}
          emissive={disabled ? '#330000' : '#00f0ff'}
          emissiveIntensity={disabled ? 0.1 : 0.8}
          toneMapped={false}
        />
      </mesh>
      <mesh position={[0, 0, 0.31]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color={disabled ? '#550000' : '#ff3b6b'} emissive={disabled ? '#220000' : '#ff3b6b'} emissiveIntensity={1} toneMapped={false} />
      </mesh>
    </group>
  )
}

// ---------------------------------------------------------------------------
// Chrono Titan (boss) — damaged by DAMAGE_BOSS actions
// ---------------------------------------------------------------------------
export function ChronoTitan({ position, onHp }: { position: [number, number, number]; onHp?: (hp: number) => void }) {
  const body = useRef<THREE.Group>(null!)
  const [hp, setHp] = useState(100)
  const flash = useRef(0)

  useEffect(() =>
    subscribeWorld((a) => {
      if (a.type === 'DAMAGE_BOSS') {
        setHp((prev) => {
          const n = Math.max(0, prev - a.amount)
          onHp?.(n)
          return n
        })
        flash.current = 1
        playSfx('boss')
      }
    })
  , [onHp])

  useFrame((state, dt) => {
    if (!body.current) return
    body.current.position.y = position[1] + Math.sin(state.clock.elapsedTime) * 0.3
    body.current.rotation.y += dt * 0.3
    flash.current = Math.max(0, flash.current - dt * 2)
    body.current.traverse((o) => {
      const m = (o as THREE.Mesh).material as THREE.MeshStandardMaterial
      if (m && m.emissive) {
        m.emissiveIntensity = 0.8 + flash.current * 2
      }
    })
  })

  const dead = hp <= 0
  return (
    <group position={position}>
      <group ref={body}>
        <mesh position={[0, 3, 0]} castShadow>
          <octahedronGeometry args={[2.2, 0]} />
          <meshStandardMaterial color={dead ? '#1a1a1a' : '#2a0010'} emissive={dead ? '#111' : '#ff2a2a'} emissiveIntensity={0.8} metalness={0.5} toneMapped={false} />
        </mesh>
        <mesh position={[0, 3, 0]}>
          <torusGeometry args={[3, 0.15, 8, 48]} />
          <meshStandardMaterial color={dead ? '#222' : '#ff2a2a'} emissive={dead ? '#111' : '#ff2a2a'} emissiveIntensity={1} toneMapped={false} />
        </mesh>
      </group>
      <Html position={[0, 7, 0]} center distanceFactor={14}>
        <div style={{ textAlign: 'center', fontFamily: 'Consolas, monospace' }}>
          <div style={{ color: '#ff2a2a', fontWeight: 700, letterSpacing: 2, textShadow: '0 0 8px #ff2a2a' }}>
            {dead ? 'TITAN OFFLINE' : 'CHRONO TITAN'}
          </div>
          <div style={{ width: 160, height: 10, background: '#2a0010', border: '1px solid #ff2a2a', borderRadius: 5, margin: '4px auto' }}>
            <div style={{ width: `${hp}%`, height: '100%', background: 'linear-gradient(90deg,#ff2a2a,#ff8a00)', borderRadius: 5, transition: 'width 0.3s' }} />
          </div>
        </div>
      </Html>
    </group>
  )
}
