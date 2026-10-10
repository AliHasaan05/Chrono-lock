// ============================================================================
// NPC CHARACTER
// ----------------------------------------------------------------------------
// A clearly visible, stylized humanoid built from lit meshes so every NPC
// (Professor Byte, Kira, LOOP-9, Vault Keeper, the Titan contact) reads as an
// actual character — not just a ground ring. It is tinted with the NPC's
// signature color, gently idles/bobs, and shows a floating name tag with an
// "[E] TALK" prompt when the player is near. The tag hides while a UI overlay
// is open so it never bleeds over the 2D interface.
// ============================================================================

import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'

interface NPCCharacterProps {
  position: [number, number, number]
  color: string
  name: string
  near: boolean
  rotation?: number
  labelsVisible?: boolean
}

export function NPCCharacter({
  position,
  color,
  name,
  near,
  rotation = 0,
  labelsVisible = true,
}: NPCCharacterProps) {
  const group = useRef<THREE.Group>(null!)
  const ring = useRef<THREE.Mesh>(null!)
  const head = useRef<THREE.Group>(null!)
  const leftArm = useRef<THREE.Mesh>(null!)

  useFrame((state) => {
    const t = state.clock.elapsedTime
    if (ring.current) ring.current.rotation.z += 0.01
    if (group.current) {
      // face the player roughly + idle bob
      group.current.position.y = position[1] + Math.sin(t * 1.5) * 0.04
    }
    if (head.current) head.current.rotation.y = Math.sin(t * 0.8) * 0.3
    // a friendly wave when the player is near
    if (leftArm.current) {
      leftArm.current.rotation.z = near
        ? -0.4 + Math.sin(t * 6) * 0.5
        : THREE.MathUtils.lerp(leftArm.current.rotation.z, 0.15, 0.08)
    }
  })

  const bodyColor = '#141b33'
  const emissive = new THREE.Color(color)

  return (
    <group ref={group} position={position} rotation={[0, rotation, 0]}>
      {/* ---- Humanoid body ---- */}
      {/* legs */}
      <mesh position={[-0.18, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.7, 4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0.18, 0.55, 0]} castShadow>
        <capsuleGeometry args={[0.14, 0.7, 4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* torso with glowing chest emblem */}
      <mesh position={[0, 1.35, 0]} castShadow>
        <capsuleGeometry args={[0.34, 0.7, 6, 12]} />
        <meshStandardMaterial color={bodyColor} metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.45, 0.33]}>
        <circleGeometry args={[0.12, 20]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.4} toneMapped={false} />
      </mesh>
      {/* shoulder trim */}
      <mesh position={[0, 1.75, 0]}>
        <torusGeometry args={[0.36, 0.05, 8, 24]} />
        <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={0.8} toneMapped={false} />
      </mesh>

      {/* arms */}
      <mesh ref={leftArm} position={[-0.46, 1.5, 0]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.6} />
      </mesh>
      <mesh position={[0.46, 1.4, 0]} rotation={[0, 0, 0.15]} castShadow>
        <capsuleGeometry args={[0.1, 0.6, 4, 8]} />
        <meshStandardMaterial color={bodyColor} metalness={0.4} roughness={0.6} />
      </mesh>

      {/* head + visor */}
      <group ref={head} position={[0, 2.05, 0]}>
        <mesh castShadow>
          <sphereGeometry args={[0.26, 16, 16]} />
          <meshStandardMaterial color="#1c2444" metalness={0.5} roughness={0.4} />
        </mesh>
        {/* glowing visor */}
        <mesh position={[0, 0.02, 0.2]}>
          <boxGeometry args={[0.34, 0.1, 0.06]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        {/* antenna */}
        <mesh position={[0, 0.32, 0]}>
          <cylinderGeometry args={[0.015, 0.015, 0.2, 6]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={1} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0.44, 0]}>
          <sphereGeometry args={[0.04, 8, 8]} />
          <meshStandardMaterial color={color} emissive={emissive} emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>

      {/* a soft colored key light so the NPC is always readable */}
      <pointLight position={[0, 1.8, 1]} intensity={near ? 1.2 : 0.5} distance={5} color={color} />

      {/* holographic ground ring */}
      <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.8, 1.0, 48]} />
        <meshBasicMaterial color={color} transparent opacity={near ? 0.9 : 0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* name tag (hidden while a UI overlay is open) */}
      {labelsVisible && (
        <Html
          position={[0, 2.7, 0]}
          center
          distanceFactor={10}
          occlude={false}
          zIndexRange={[10, 0]}
          style={{ pointerEvents: 'none' }}
        >
          <div
            style={{
              fontFamily: 'Consolas, monospace',
              fontSize: 12,
              color: '#fff',
              background: 'rgba(5,7,20,0.8)',
              border: `1px solid ${color}`,
              borderRadius: 6,
              padding: '3px 8px',
              whiteSpace: 'nowrap',
              textShadow: `0 0 6px ${color}`,
              boxShadow: `0 0 12px ${color}66`,
            }}
          >
            {name}
            {near && <span style={{ color, marginLeft: 6 }}>[E] TALK</span>}
          </div>
        </Html>
      )}
    </group>
  )
}
