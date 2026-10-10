// ============================================================================
// PLAYER — GTA-style third-person controllable character.
// ----------------------------------------------------------------------------
// Loads the downloaded RobotExpressive.glb and drives it with SkeletonUtils
// clone so the Idle/Walking/Running/Jump clips animate correctly. Movement has
// momentum (smooth acceleration + deceleration) and the character turns toward
// its travel direction. The camera is a smooth third-person follow with
// free-look (yaw + pitch) via Pointer Lock, with a click-drag fallback.
//
// IMPORTANT: control-enabled state is read live from the Zustand stores (not a
// prop closure) so movement never silently stops working after a re-render.
// ============================================================================

import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF, useAnimations } from '@react-three/drei'
import * as THREE from 'three'
import { SkeletonUtils } from 'three-stdlib'
import { playSfx } from '@/audio/sound'
import { useUIStore } from '@/state/uiStore'

const WALK = 4.5
const RUN = 9
const ACCEL = 28 // how fast we reach target speed
const DECEL = 20 // how fast we stop
const GRAVITY = 24
const JUMP_V = 9

interface PlayerProps {
  onPosition: (pos: THREE.Vector3) => void
  startPosition?: [number, number, number]
}

export function Player({ onPosition, startPosition = [0, 0, 8] }: PlayerProps) {
  const group = useRef<THREE.Group>(null!)
  const inner = useRef<THREE.Group>(null!)
  const { scene, animations } = useGLTF('/models/RobotExpressive.glb')
  const model = useMemo(() => SkeletonUtils.clone(scene) as THREE.Group, [scene])
  const { actions } = useAnimations(animations, model)
  const { camera, gl } = useThree()

  // ---- live control-enabled check (reads stores directly) --------------
  const enabledRef = useRef(true)
  useEffect(() => {
    const update = () => {
      const ui = useUIStore.getState()
      enabledRef.current = ui.overlay === null && ui.screen === 'world'
    }
    update()
    const unsub = useUIStore.subscribe(update)
    return () => unsub()
  }, [])

  // ---- keyboard (bound once) -------------------------------------------
  const keys = useRef({ f: false, b: false, l: false, r: false, sprint: false, jump: false })
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.f = true; break
        case 'KeyS': case 'ArrowDown': keys.current.b = true; break
        case 'KeyA': case 'ArrowLeft': keys.current.l = true; break
        case 'KeyD': case 'ArrowRight': keys.current.r = true; break
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = true; break
        case 'Space': keys.current.jump = true; break
      }
    }
    const up = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW': case 'ArrowUp': keys.current.f = false; break
        case 'KeyS': case 'ArrowDown': keys.current.b = false; break
        case 'KeyA': case 'ArrowLeft': keys.current.l = false; break
        case 'KeyD': case 'ArrowRight': keys.current.r = false; break
        case 'ShiftLeft': case 'ShiftRight': keys.current.sprint = false; break
        case 'Space': keys.current.jump = false; break
      }
    }
    // reset keys when the window loses focus so nothing sticks
    const blur = () => (keys.current = { f: false, b: false, l: false, r: false, sprint: false, jump: false })
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    window.addEventListener('blur', blur)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
      window.removeEventListener('blur', blur)
    }
  }, [])

  // ---- camera look (pointer lock + drag fallback) ----------------------
  const yaw = useRef(0)
  const pitch = useRef(0.22)
  useEffect(() => {
    const canvas = gl.domElement
    const enabled = () => enabledRef.current

    const requestLock = () => {
      if (enabled() && document.pointerLockElement !== canvas) {
        try { canvas.requestPointerLock?.() } catch { /* ignore */ }
      }
    }
    const onMove = (e: MouseEvent) => {
      if (!enabled()) return
      if (document.pointerLockElement === canvas) {
        yaw.current -= e.movementX * 0.0022
        pitch.current = THREE.MathUtils.clamp(pitch.current - e.movementY * 0.0022, -0.4, 0.85)
      }
    }
    let dragging = false
    let lx = 0, ly = 0
    const onDown = (e: PointerEvent) => {
      if (enabled() && e.target === canvas) { dragging = true; lx = e.clientX; ly = e.clientY }
    }
    const onDrag = (e: PointerEvent) => {
      if (!dragging || document.pointerLockElement === canvas) return
      yaw.current -= (e.clientX - lx) * 0.005
      pitch.current = THREE.MathUtils.clamp(pitch.current - (e.clientY - ly) * 0.005, -0.4, 0.85)
      lx = e.clientX; ly = e.clientY
    }
    const onUp = () => (dragging = false)

    canvas.addEventListener('click', requestLock)
    document.addEventListener('mousemove', onMove)
    window.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onDrag)
    window.addEventListener('pointerup', onUp)

    const lockWatcher = setInterval(() => {
      if (!enabled() && document.pointerLockElement) document.exitPointerLock?.()
    }, 150)

    return () => {
      canvas.removeEventListener('click', requestLock)
      document.removeEventListener('mousemove', onMove)
      window.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onDrag)
      window.removeEventListener('pointerup', onUp)
      clearInterval(lockWatcher)
    }
  }, [gl])

  // shadows
  useEffect(() => {
    model.traverse((o) => {
      if ((o as THREE.Mesh).isMesh) { o.castShadow = true; o.receiveShadow = true }
    })
  }, [model])

  // animation helper
  const currentAnim = useRef('')
  const play = (name: string) => {
    if (currentAnim.current === name) return
    const next = actions[name]
    if (!next) return
    const prev = currentAnim.current ? actions[currentAnim.current] : null
    next.reset().fadeIn(0.18).play()
    if (prev && prev !== next) prev.fadeOut(0.18)
    currentAnim.current = name
  }
  useEffect(() => { play('Idle') /* eslint-disable-next-line */ }, [actions])

  // ---- physics state ----
  const vel = useRef(new THREE.Vector3()) // horizontal velocity (world)
  const vy = useRef(0)
  const grounded = useRef(true)
  const stepTimer = useRef(0)

  useFrame((_, dtRaw) => {
    const g = group.current
    if (!g) return
    const dt = Math.min(dtRaw, 0.05)
    const enabled = enabledRef.current
    const k = keys.current

    // --- camera-relative movement ------------------------------------
    // Derive forward/right from the CAMERA's actual world orientation so the
    // mapping is always correct no matter where the mouse has turned the view.
    // forward = where the camera looks, flattened onto the ground.
    // right    = camera's right vector, flattened. This avoids any handedness
    // or sign mistakes from doing the trig by hand.
    const camFwd = new THREE.Vector3()
    camera.getWorldDirection(camFwd)
    camFwd.y = 0
    if (camFwd.lengthSq() < 1e-6) camFwd.set(0, 0, -1)
    camFwd.normalize()
    // right = forward x up  -> (-fz, 0, fx) gives screen-right in three.js
    const camRight = new THREE.Vector3(-camFwd.z, 0, camFwd.x).normalize()

    let moveF = 0 // W = +1 (into screen), S = -1
    let moveR = 0 // D = +1 (screen right), A = -1
    if (enabled) {
      if (k.f) moveF += 1
      if (k.b) moveF -= 1
      if (k.r) moveR += 1
      if (k.l) moveR -= 1
    }
    const hasInput = moveF !== 0 || moveR !== 0

    // target world-space velocity
    const target = new THREE.Vector3()
    if (hasInput) {
      const dir = new THREE.Vector3()
      dir.addScaledVector(camFwd, moveF)
      dir.addScaledVector(camRight, moveR)
      if (dir.lengthSq() > 0) dir.normalize()
      const speed = k.sprint ? RUN : WALK
      target.set(dir.x * speed, 0, dir.z * speed)
    }

    // smooth accelerate / decelerate toward target (GTA-like momentum)
    const rate = hasInput ? ACCEL : DECEL
    vel.current.x = THREE.MathUtils.damp(vel.current.x, target.x, rate, dt)
    vel.current.z = THREE.MathUtils.damp(vel.current.z, target.z, rate, dt)

    g.position.x += vel.current.x * dt
    g.position.z += vel.current.z * dt

    const horizSpeed = Math.hypot(vel.current.x, vel.current.z)

    // face travel direction
    if (horizSpeed > 0.15 && inner.current) {
      const targetRot = Math.atan2(vel.current.x, vel.current.z)
      inner.current.rotation.y = lerpAngle(inner.current.rotation.y, targetRot, 0.2)
    }

    // footsteps
    if (horizSpeed > 0.5 && grounded.current) {
      stepTimer.current -= dt
      if (stepTimer.current <= 0) {
        playSfx('footstep')
        stepTimer.current = k.sprint ? 0.26 : 0.4
      }
    }

    // jump + gravity
    if (enabled && k.jump && grounded.current) {
      vy.current = JUMP_V
      grounded.current = false
      play('Jump')
    }
    vy.current -= GRAVITY * dt
    g.position.y += vy.current * dt
    if (g.position.y <= 0) { g.position.y = 0; vy.current = 0; grounded.current = true }

    // bounds (keep inside the city plaza area)
    g.position.x = THREE.MathUtils.clamp(g.position.x, -58, 58)
    g.position.z = THREE.MathUtils.clamp(g.position.z, -58, 58)

    // animation state
    if (!grounded.current) {
      // keep jump in the air
    } else if (horizSpeed > 6) {
      play('Running')
    } else if (horizSpeed > 0.4) {
      play('Walking')
    } else {
      play('Idle')
    }

    // ---- GTA-style follow camera ----
    const camDist = 6.5
    const horiz = camDist * Math.cos(pitch.current)
    const desired = new THREE.Vector3(
      g.position.x - Math.sin(yaw.current) * horiz,
      g.position.y + 3.0 + pitch.current * 4.5,
      g.position.z - Math.cos(yaw.current) * horiz
    )
    // damp each axis for a smooth, lag-free-but-cushioned follow
    camera.position.x = THREE.MathUtils.damp(camera.position.x, desired.x, 8, dt)
    camera.position.y = THREE.MathUtils.damp(camera.position.y, desired.y, 8, dt)
    camera.position.z = THREE.MathUtils.damp(camera.position.z, desired.z, 8, dt)
    camera.lookAt(g.position.x, g.position.y + 1.5, g.position.z)

    onPosition(g.position)
  })

  return (
    <group ref={group} position={startPosition}>
      <group ref={inner} scale={0.5}>
        <primitive object={model} />
      </group>
    </group>
  )
}

function lerpAngle(a: number, b: number, t: number) {
  let diff = b - a
  while (diff > Math.PI) diff -= Math.PI * 2
  while (diff < -Math.PI) diff += Math.PI * 2
  return a + diff * t
}

useGLTF.preload('/models/RobotExpressive.glb')
