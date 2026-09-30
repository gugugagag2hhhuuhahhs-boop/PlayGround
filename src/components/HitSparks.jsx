import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { lastHit } from '../game/refs'

// Partikel spark sederhana saat pukulan kena
export default function HitSparks() {
  const mesh = useRef(null)
  const mat = useRef(null)
  const shownAt = useRef(-10)
  const lastT = useRef(-10)

  useFrame((state) => {
    if (!mesh.current) return
    const now = performance.now() / 1000
    if (lastHit.time !== lastT.current) {
      lastT.current = lastHit.time
      shownAt.current = now
      mesh.current.position.copy(lastHit.pos)
      mesh.current.visible = true
      if (mat.current) mat.current.color.set(lastHit.color)
      window.__lastHitT = now
    }
    const age = now - shownAt.current
    if (age > 0.45) {
      mesh.current.visible = false
      return
    }
    const k = age / 0.45
    const sc = 0.4 + k * 1.6
    mesh.current.scale.setScalar(sc)
    mesh.current.rotation.y += 0.3
    mesh.current.rotation.x += 0.2
    if (mat.current) mat.current.opacity = 0.9 * (1 - k)
  })

  return (
    <group>
      <mesh ref={mesh} visible={false}>
        <icosahedronGeometry args={[0.35, 1]} />
        <meshBasicMaterial ref={mat} color="#fff" transparent opacity={0.9} wireframe />
      </mesh>
    </group>
  )
}
