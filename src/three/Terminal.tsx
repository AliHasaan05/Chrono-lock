// ============================================================================
// CODING TERMINAL (3D)
// ----------------------------------------------------------------------------
// A futuristic terminal object. When the player is near, it glows and shows
// a "[E] ACCESS" prompt. Completed terminals turn green. Pressing E opens the
// coding interface (handled by the parent via proximity + key).
// ============================================================================

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface TerminalProps {
  position: [number, number, number]
  label: string
  near: boolean
  completed: boolean
  locked: boolean
  labelsVisible?: boolean
}

export function Terminal({ position, label, near, completed, locked, labelsVisible = true }: TerminalProps) {
  const screen = useRef<THREE.Mesh>(null!)
  const glowColor = locked ? '#555b7a' : completed ? '#7cff00' : near ? '#00f0ff' : '#2aa6c0'

  useFrame((state) => {
    if (screen.current) {
      const mat = screen.current.material as THREE.MeshStandardMaterial
      const pulse = 0.5 + Math.sin(state.clock.elapsedTime * 3) * 0.3
      mat.emissiveIntensity = locked ? 0.2 : near ? pulse + 0.6 : 0.5
    }
  })

  return (
    <group position={position}>
      {/* base */}
      <mesh position={[0, 0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.6, 0.2, 1.2]} />
        <meshStandardMaterial color="#11162b" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* pedestal */}
      <mesh position={[0, 0.9, -0.3]} castShadow>
        <boxGeometry args={[1.4, 1.6, 0.3]} />
        <meshStandardMaterial color="#0c1022" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* screen */}
      <mesh ref={screen} position={[0, 1.3, -0.12]} rotation={[-0.18, 0, 0]}>
        <planeGeometry args={[1.2, 0.8]} />
        <meshStandardMaterial
          color={glowColor}
          emissive={glowColor}
          emissiveIntensity={0.6}
          toneMapped={false}
        />
      </mesh>
      {/* side light strips */}
      <mesh position={[0, 0.9, 0.6]}>
        <boxGeometry args={[1.5, 0.04, 0.04]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={1} toneMapped={false} />
      </mesh>

      {labelsVisible && (
        <Html
          position={[0, 2.3, 0]}
          center
          distanceFactor={11}
          occlude={false}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: 12,
              textAlign: 'center',
              whiteSpace: 'nowrap',
              color: '#dff6ff',
              background: 'rgba(5,7,20,0.78)',
              border: `1px solid ${glowColor}`,
              borderRadius: 6,
              padding: '3px 9px',
              boxShadow: `0 0 12px ${glowColor}66`,
            }}
          >
            <div style={{ color: glowColor, fontWeight: 700 }}>{label}</div>
            {locked ? (
              <div style={{ color: '#8a93b8' }}>LOCKED</div>
            ) : completed ? (
              <div style={{ color: '#7cff00' }}>✓ REPAIRED</div>
            ) : near ? (
              <div style={{ color: '#00f0ff' }}>[E] ACCESS TERMINAL</div>
            ) : null}
          </div>
        </Html>
      )}
    </group>
  )
}
