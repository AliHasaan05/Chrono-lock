// ============================================================================
// AUDIO SYSTEM
// ----------------------------------------------------------------------------
// Lightweight WebAudio synth for UI/game SFX and an ambient cyberpunk pad.
// No external audio files required — tones are generated procedurally so the
// game ships self-contained. Volumes respect the player's settings.
// ============================================================================

import { useGameStore } from '@/state/gameStore'

type SfxName =
  | 'ui'
  | 'type'
  | 'terminal'
  | 'run'
  | 'success'
  | 'fail'
  | 'xp'
  | 'levelup'
  | 'door'
  | 'laser'
  | 'reactor'
  | 'boss'
  | 'footstep'

let ctx: AudioContext | null = null
let ambientGain: GainNode | null = null
let ambientNodes: OscillatorNode[] = []

function audio(): AudioContext {
  if (!ctx) {
    const AC = window.AudioContext || (window as any).webkitAudioContext
    ctx = new AC()
  }
  if (ctx.state === 'suspended') void ctx.resume()
  return ctx
}

function settings() {
  return useGameStore.getState().settings
}

export function playSfx(name: SfxName) {
  const s = settings()
  if (s.muted || s.sfxVolume <= 0) return
  const a = audio()
  const now = a.currentTime
  const gain = a.createGain()
  gain.connect(a.destination)

  const vol = s.sfxVolume

  const beep = (freq: number, dur: number, type: OscillatorType = 'sine', peak = 0.2) => {
    const osc = a.createOscillator()
    osc.type = type
    osc.frequency.value = freq
    const g = a.createGain()
    g.gain.setValueAtTime(0, now)
    g.gain.linearRampToValueAtTime(peak * vol, now + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + dur)
    osc.connect(g)
    g.connect(a.destination)
    osc.start(now)
    osc.stop(now + dur)
  }

  switch (name) {
    case 'ui':
      beep(660, 0.08, 'triangle', 0.12)
      break
    case 'type':
      beep(1200 + Math.random() * 300, 0.03, 'square', 0.05)
      break
    case 'terminal':
      beep(300, 0.15, 'sawtooth', 0.15)
      beep(600, 0.2, 'sine', 0.1)
      break
    case 'run':
      beep(440, 0.1, 'square', 0.12)
      break
    case 'success':
      beep(523, 0.12, 'triangle', 0.2)
      setTimeout(() => beep(659, 0.12, 'triangle', 0.2), 90)
      setTimeout(() => beep(784, 0.2, 'triangle', 0.2), 180)
      break
    case 'fail':
      beep(220, 0.18, 'sawtooth', 0.18)
      setTimeout(() => beep(160, 0.25, 'sawtooth', 0.18), 120)
      break
    case 'xp':
      beep(880, 0.08, 'sine', 0.12)
      setTimeout(() => beep(1320, 0.1, 'sine', 0.12), 60)
      break
    case 'levelup':
      ;[523, 659, 784, 1046].forEach((f, i) =>
        setTimeout(() => beep(f, 0.18, 'triangle', 0.22), i * 110)
      )
      break
    case 'door':
      beep(120, 0.4, 'sawtooth', 0.14)
      break
    case 'laser':
      beep(1400, 0.12, 'square', 0.1)
      break
    case 'reactor':
      beep(90, 0.5, 'sawtooth', 0.16)
      break
    case 'boss':
      beep(70, 0.6, 'sawtooth', 0.22)
      setTimeout(() => beep(55, 0.7, 'sawtooth', 0.22), 150)
      break
    case 'footstep':
      beep(90, 0.05, 'sine', 0.05)
      break
  }
  void gain
}

export function startAmbient() {
  const s = settings()
  if (ambientNodes.length > 0) return
  const a = audio()
  ambientGain = a.createGain()
  ambientGain.gain.value = s.muted ? 0 : s.musicVolume * 0.12
  ambientGain.connect(a.destination)

  // layered low drone + slow detuned pad = cyberpunk ambience
  const freqs = [55, 82.4, 110, 164.8]
  freqs.forEach((f, i) => {
    const osc = a.createOscillator()
    osc.type = i % 2 === 0 ? 'sine' : 'triangle'
    osc.frequency.value = f
    const lfo = a.createOscillator()
    lfo.frequency.value = 0.05 + i * 0.02
    const lfoGain = a.createGain()
    lfoGain.gain.value = 1.5
    lfo.connect(lfoGain)
    lfoGain.connect(osc.detune)
    osc.connect(ambientGain!)
    osc.start()
    lfo.start()
    ambientNodes.push(osc, lfo)
  })
}

export function stopAmbient() {
  ambientNodes.forEach((n) => {
    try {
      n.stop()
    } catch {
      /* already stopped */
    }
  })
  ambientNodes = []
  ambientGain = null
}

export function refreshAmbientVolume() {
  const s = settings()
  if (ambientGain) {
    ambientGain.gain.value = s.muted ? 0 : s.musicVolume * 0.12
  }
}
