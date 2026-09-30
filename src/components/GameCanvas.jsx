import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Environment, ContactShadows, Stars } from '@react-three/drei'
import * as THREE from 'three'
import Arena from './Arena'
import Mino from './Mino'
import EnemyFighter from './EnemyFighter'
import HitSparks from './HitSparks'
import { playerPos, enemyPos } from '../game/refs'
import { useGame } from '../game/store'

// Kamera mengikuti Mino (third person, cocok untuk HP landscape/portrait)
function CameraRig() {
  const shake = useRef(0)
  useFrame((state, dt) => {
    const s = useGame.getState()
    const p = playerPos.current
    const e = enemyPos.current
    // titik tengah kedua petarung
    const mid = new THREE.Vector3().addVectors(p, e).multiplyScalar(0.5)
    const dist = Math.min(6, Math.max(2.5, p.distanceTo(e)))
    const isPortrait = window.innerHeight > window.innerWidth
    const back = (isPortrait ? 8.5 : 7) + dist * 0.7
    const height = (isPortrait ? 7 : 5.6) + dist * 0.25
    const desired = new THREE.Vector3(mid.x * 0.6, height, mid.z * 0.6 + back)
    // KO slow zoom
    if (s.phase === 'roundEnd' || s.phase === 'gameover') {
      desired.multiplyScalar(0.82)
      desired.y = Math.max(3, desired.y * 0.85)
    }
    state.camera.position.lerp(desired, Math.min(1, dt * 3.2))
    // shake saat pukulan terakhir
    const sinceHit = performance.now() / 1000 - (window.__lastHitT ?? -10)
    void sinceHit
    state.camera.lookAt(mid.x * 0.7, 1.1, mid.z * 0.7)
  })
  return null
}

export default function GameCanvas() {
  return (
    <Canvas
      shadows
      dpr={[1, 2]}
      camera={{ position: [0, 6, 9], fov: 55 }}
      gl={{ antialias: true }}
      style={{ touchAction: 'none' }}
    >
      <color attach="background" args={['#0b0e1a']} />
      <fog attach="fog" args={['#0b0e1a', 18, 40]} />
      <ambientLight intensity={0.5} />
      <directionalLight position={[6, 10, 4]} intensity={1.4} castShadow shadow-mapSize={[1024, 1024]} />
      <Stars radius={60} depth={30} count={2500} factor={3} fade speed={0.6} />
      <Physics gravity={[0, -14, 0]} timeStep={1 / 60}>
        <Arena />
        <Mino />
        <EnemyFighter />
      </Physics>
      <HitSparks />
      <ContactShadows position={[0, 0.12, 0]} opacity={0.55} scale={18} blur={2.4} far={4} color="#000" />
      <Environment preset="city" />
      <CameraRig />
    </Canvas>
  )
}
