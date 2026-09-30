import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGame } from '../game/store'
import { LEVELS } from '../game/levels'
import { playerPos, enemyPos, enemyBodyRef, lastHit } from '../game/refs'
import { punchSound } from '../game/audio'

const tmp = new THREE.Vector3()

export default function EnemyFighter() {
  const body = useRef(null)
  const group = useRef(null)
  const gloveL = useRef(null)
  const gloveR = useRef(null)
  const torso = useRef(null)
  const lastAttack = useRef(0)
  const strafeDir = useRef(1)
  const strafeT = useRef(0)

  const levelIndex = useGame((s) => s.levelIndex)

  useEffect(() => {
    enemyBodyRef.current = body.current
    window.__enemyBodyRef = enemyBodyRef
    // reset posisi tiap ganti level
    try { body.current?.setTranslation({ x: 2.5, y: 1, z: 0 }, true) } catch {}
    try { body.current?.setLinvel({ x: 0, y: 0, z: 0 }, true) } catch {}
  }, [levelIndex])

  useEffect(() => {
    enemyBodyRef.current = body.current
    window.__enemyBodyRef = enemyBodyRef
  }, [])

  useFrame((state, dt) => {
    const rb = body.current
    if (!rb) return
    const s = useGame.getState()
    const lv = LEVELS[s.levelIndex]
    try {
      const t = rb.translation()
      enemyPos.current.set(t.x, 0, t.z)
    } catch { return }

    if (s.phase !== 'fight') {
      try { rb.setLinvel({ x: 0, y: 0, z: 0 }, true) } catch {}
      // animasi KO: jatuh
      if ((s.phase === 'roundEnd' || s.phase === 'gameover' || s.phase === 'victory') && group.current) {
        const targetRot = s.koWinner === 'mino' ? -Math.PI / 2.2 : 0
        group.current.rotation.x += (targetRot - group.current.rotation.x) * Math.min(1, dt * 4)
        if (s.koWinner === 'mino') group.current.position.y += (-0.5 - group.current.position.y) * Math.min(1, dt * 4)
      }
      return
    }
    // reset pose saat fight
    if (group.current && Math.abs(group.current.rotation.x) > 0.01 && s.enemyHP === s.enemyMaxHP) {
      group.current.rotation.x *= 0.9
      group.current.position.y *= 0.9
    }

    tmp.subVectors(playerPos.current, enemyPos.current)
    const dist = tmp.length()
    tmp.normalize()

    // strafe agar tidak monoton (ekstrem lebih lincah)
    strafeT.current += dt
    if (strafeT.current > 1.5) {
      strafeT.current = 0
      strafeDir.current = Math.random() > 0.5 ? 1 : -1
    }
    const strafe = s.levelIndex >= 3 ? 1.2 : 0.5
    const px = -tmp.z * strafeDir.current * strafe
    const pz = tmp.x * strafeDir.current * strafe

    let mx = 0, mz = 0
    if (dist > lv.attackRange) {
      mx = tmp.x * lv.speed + px * 0.4
      mz = tmp.z * lv.speed + pz * 0.4
    } else {
      // dalam jangkauan: tahan + strafe
      mx = px * 0.6
      mz = pz * 0.6
      // serang
      const now = state.clock.elapsedTime
      if (now - lastAttack.current > lv.attackCooldown) {
        lastAttack.current = now
        enemyAttack(gloveR, gloveL, s, lv)
      }
    }
    // clamp arena
    const t = rb.translation()
    if (Math.abs(t.x) > 6.5 || Math.abs(t.z) > 6.5) {
      const cx = THREE.MathUtils.clamp(t.x, -6.5, 6.5)
      const cz = THREE.MathUtils.clamp(t.z, -6.5, 6.5)
      try { rb.setTranslation({ x: cx, y: t.y, z: cz }, true) } catch {}
    }
    try {
      const v = rb.linvel()
      rb.setLinvel({ x: mx, y: v.y, z: mz }, true)
    } catch {}

    // hadap Mino
    if (group.current) {
      const yaw = Math.atan2(-tmp.x, -tmp.z)
      group.current.rotation.y += (yaw - group.current.rotation.y) * Math.min(1, dt * 8)
    }
    // bob
    if (torso.current) {
      torso.current.position.y = 0.55 + Math.sin(state.clock.elapsedTime * (6 + s.levelIndex)) * 0.04
    }
  })

  const enemyAttack = (gr, gl, s, lv) => {
    const g = Math.random() > 0.5 ? gr.current : gl.current
    if (!g) return
    punchSound(s.muted)
    gsap.killTweensOf(g.position)
    const ox = g.position.x, oy = g.position.y, oz = g.position.z
    gsap.to(g.position, {
      x: ox * 0.3, y: oy + 0.15, z: oz + 0.9,
      duration: 0.14, ease: 'power3.in',
      onComplete: () => {
        gsap.to(g.position, { x: ox, y: oy, z: oz, duration: 0.3, ease: 'power2.out' })
        // kena?
        const st = useGame.getState()
        if (st.phase !== 'fight') return
        const d = playerPos.current.distanceTo(enemyPos.current)
        if (d <= lv.attackRange + 0.4) {
          const crit = lv.id === 'extreme' && Math.random() < 0.25
          st.damagePlayer(crit ? lv.dmg + 8 : lv.dmg)
          lastHit.pos.copy(playerPos.current).add(new THREE.Vector3(0, 1.5, 0))
          lastHit.time = performance.now() / 1000
          lastHit.color = '#ef4444'
          // knockback Mino
          try {
            const pb = window.__playerBodyRef?.current
            if (pb) {
              const dirn = new THREE.Vector3().subVectors(playerPos.current, enemyPos.current).normalize()
              const kb = 1 + lv.dmg * 0.08
              pb.applyImpulse({ x: dirn.x * kb, y: 0.5, z: dirn.z * kb }, true)
            }
          } catch {}
        }
      },
    })
  }

  const lv = LEVELS[levelIndex] ?? LEVELS[0]

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[2.5, 1, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={6}
      angularDamping={10}
      friction={1}
    >
      <CapsuleCollider args={[0.45, 0.45]} position={[0, 0.4, 0]} />
      <group ref={group}>
        <mesh position={[-0.22, -0.35, 0]}>
          <capsuleGeometry args={[0.13, 0.35, 6, 12]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh position={[0.22, -0.35, 0]}>
          <capsuleGeometry args={[0.13, 0.35, 6, 12]} />
          <meshStandardMaterial color="#111827" roughness={0.7} />
        </mesh>
        <mesh ref={torso} position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.38, 0.5, 8, 16]} />
          <meshStandardMaterial color={lv.color} roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.15, 0]}>
          <torusGeometry args={[0.36, 0.07, 10, 24]} />
          <meshStandardMaterial color="#111827" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.35, 0]}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color="#e8b98d" roughness={0.6} />
        </mesh>
        {/* mata marah */}
        <mesh position={[-0.12, 1.42, 0.27]} rotation={[0, 0, 0.3]}>
          <boxGeometry args={[0.12, 0.03, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.12, 1.42, 0.27]} rotation={[0, 0, -0.3]}>
          <boxGeometry args={[0.12, 0.03, 0.02]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[-0.11, 1.32, 0.28]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color={lv.id === 'extreme' ? '#ff0000' : '#111'} emissive={lv.id === 'extreme' ? '#ff0000' : '#000'} emissiveIntensity={lv.id === 'extreme' ? 1 : 0} />
        </mesh>
        <mesh position={[0.11, 1.32, 0.28]}>
          <sphereGeometry args={[0.05, 10, 10]} />
          <meshStandardMaterial color={lv.id === 'extreme' ? '#ff0000' : '#111'} emissive={lv.id === 'extreme' ? '#ff0000' : '#000'} emissiveIntensity={lv.id === 'extreme' ? 1 : 0} />
        </mesh>
        <mesh ref={gloveL} position={[-0.55, 1.25, 0.35]}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#1f2937" roughness={0.35} />
        </mesh>
        <mesh ref={gloveR} position={[0.55, 1.25, 0.35]}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#1f2937" roughness={0.35} />
        </mesh>
        <mesh position={[-0.45, 0.9, 0.15]} rotation={[0.4, 0, 0.5]}>
          <capsuleGeometry args={[0.1, 0.35, 6, 10]} />
          <meshStandardMaterial color="#e8b98d" />
        </mesh>
        <mesh position={[0.45, 0.9, 0.15]} rotation={[0.4, 0, -0.5]}>
          <capsuleGeometry args={[0.1, 0.35, 6, 10]} />
          <meshStandardMaterial color="#e8b98d" />
        </mesh>
      </group>
    </RigidBody>
  )
}
