import { useRef, useEffect } from 'react'
import { useFrame } from '@react-three/fiber'
import { RigidBody, CapsuleCollider } from '@react-three/rapier'
import * as THREE from 'three'
import gsap from 'gsap'
import { useGame } from '../game/store'
import { PUNCHES } from '../game/levels'
import { playerPos, enemyPos, playerBodyRef, enemyBodyRef, lastHit } from '../game/refs'
import { punchSound, blockSound } from '../game/audio'

const tmp = new THREE.Vector3()

// MINO — petinju utama. Cuma punya TINJU: jab / hook / uppercut.
export default function Mino() {
  const body = useRef(null)
  const group = useRef(null)
  const gloveL = useRef(null)
  const gloveR = useRef(null)
  const torso = useRef(null)
  const lastPunchAt = useRef(0)
  const punchId = useRef(0)
  const flash = useRef(null)

  useEffect(() => {
    playerBodyRef.current = body.current
    window.__playerBodyRef = playerBodyRef
  }, [])

  // Animasi pukulan via GSAP saat ada request dari tombol / keyboard
  useEffect(() => {
    const unsub = useGame.subscribe((s) => {
      const req = s.punchRequest
      if (!req || req.id === punchId.current) return
      punchId.current = req.id
      doPunch(req.type)
    })
    return unsub
  }, [])

  const doPunch = (type) => {
    const s = useGame.getState()
    if (s.phase !== 'fight') return
    const now = performance.now() / 1000
    const cfg = PUNCHES[type] || PUNCHES.jab
    if (now - lastPunchAt.current < cfg.cooldown) return
    lastPunchAt.current = now

    const target = type === 'jab' ? gloveL.current : gloveR.current
    if (!target) return
    sfxPunch()
    // gerakan sarung tinju maju-mundur
    gsap.killTweensOf(target.position)
    const fwd = type === 'upper' ? { y: '+=0.55', z: '+=0.15' } : { z: '-=0.9' }
    // orientasi: musuh ada di depan (z+ / z- tergantung posisi) — sederhanakan: pukul ke arah musuh
    const dir = new THREE.Vector3().subVectors(enemyPos.current, playerPos.current)
    const yaw = Math.atan2(dir.x, dir.z)
    gsap.to(target.position, {
      ...punchOffset(type),
      duration: 0.1,
      ease: 'power3.out',
      onComplete: () => {
        gsap.to(target.position, { ...restPose(type), duration: 0.22, ease: 'power2.inOut' })
      },
    })
    // badan sedikit membungkuk + putar ke arah musuh
    if (group.current) {
      gsap.fromTo(
        group.current.rotation,
        { y: yaw },
        { y: yaw + (type === 'hook' ? 0.5 : 0.15), duration: 0.12, yoyo: true, repeat: 1, ease: 'power2.out' }
      )
    }
    // hit detection sesaat setelah ayunan
    setTimeout(() => {
      const st = useGame.getState()
      if (st.phase !== 'fight') return
      const d = playerPos.current.distanceTo(enemyPos.current)
      if (d <= cfg.range + 0.35) {
        st.damageEnemy(cfg.dmg + Math.floor(st.combo / 4))
        lastHit.pos.copy(enemyPos.current).add(new THREE.Vector3(0, 1.5, 0))
        lastHit.time = performance.now() / 1000
        lastHit.color = type === 'upper' ? '#fde047' : '#fff'
        // knockback musuh
        const eb = enemyBodyRef.current
        try {
          const dirn = new THREE.Vector3().subVectors(enemyPos.current, playerPos.current).normalize()
          dirn.y = type === 'upper' ? 0.6 : 0.1
          // impulse via refs body
          importBodyImpulse(dirn.multiplyScalar(cfg.knock))
        } catch {}
        // flash sarung
        if (flash.current) {
          gsap.fromTo(flash.current.material, { opacity: 0.9 }, { opacity: 0, duration: 0.3 })
        }
      }
    }, 90)
  }

  const sfxPunch = () => punchSound(useGame.getState().muted)

  useFrame((state, dt) => {
    const rb = body.current
    if (!rb) return
    const s = useGame.getState()
    if (s.phase !== 'fight' && s.phase !== 'roundEnd') {
      try { rb.setLinvel({ x: 0, y: 0, z: 0 }, true) } catch {}
      return
    }
    const t = rb.translation()
    playerPos.current.set(t.x, 0, t.z)
    // clamp arena
    const cx = THREE.MathUtils.clamp(t.x, -6.5, 6.5)
    const cz = THREE.MathUtils.clamp(t.z, -6.5, 6.5)
    if (cx !== t.x || cz !== t.z) {
      try { rb.setTranslation({ x: cx, y: t.y, z: cz }, true) } catch {}
    }
    if (s.phase !== 'fight') return
    // gerak dari joystick / keyboard
    const { x, z, block } = s.input
    const speed = block ? 1.6 : 4.2
    try {
      const v = rb.linvel()
      rb.setLinvel({ x: x * speed, y: v.y, z: z * speed }, true)
    } catch {}
    // hadap musuh
    if (group.current) {
      tmp.subVectors(enemyPos.current, playerPos.current)
      const yaw = Math.atan2(tmp.x, tmp.z)
      group.current.rotation.y += (yaw - group.current.rotation.y) * Math.min(1, dt * 10)
    }
    // pose block: sarung naik ke wajah
    const guardY = block ? 1.55 : 1.25
    ;[gloveL.current, gloveR.current].forEach((g, i) => {
      if (!g || gsap.isTweening(g.position)) return
      g.position.y += (guardY - g.position.y) * Math.min(1, dt * 8)
    })
    // bob jalan
    if (torso.current && (Math.abs(x) + Math.abs(z) > 0.1)) {
      torso.current.position.y = 1.05 + Math.sin(state.clock.elapsedTime * 10) * 0.04
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      position={[-2.5, 1, 0]}
      enabledRotations={[false, false, false]}
      linearDamping={6}
      angularDamping={10}
      friction={1}
    >
      <CapsuleCollider args={[0.45, 0.45]} position={[0, 0.4, 0]} />
      <group ref={group}>
        {/* bayangan glow */}
        <mesh ref={flash} position={[0, 1.4, 0]}>
          <sphereGeometry args={[1.1, 16, 16]} />
          <meshBasicMaterial color="#38bdf8" transparent opacity={0} />
        </mesh>
        {/* kaki */}
        <mesh position={[-0.22, -0.35, 0]}>
          <capsuleGeometry args={[0.13, 0.35, 6, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        <mesh position={[0.22, -0.35, 0]}>
          <capsuleGeometry args={[0.13, 0.35, 6, 12]} />
          <meshStandardMaterial color="#1e293b" roughness={0.7} />
        </mesh>
        {/* torso Mino — biru */}
        <mesh ref={torso} position={[0, 0.55, 0]}>
          <capsuleGeometry args={[0.38, 0.5, 8, 16]} />
          <meshStandardMaterial color="#2563eb" roughness={0.5} />
        </mesh>
        {/* sabuk */}
        <mesh position={[0, 0.15, 0]} rotation={[0, 0, 0]}>
          <torusGeometry args={[0.36, 0.07, 10, 24]} />
          <meshStandardMaterial color="#fbbf24" roughness={0.4} />
        </mesh>
        {/* kepala */}
        <mesh position={[0, 1.35, 0]}>
          <sphereGeometry args={[0.32, 24, 24]} />
          <meshStandardMaterial color="#fcd7b0" roughness={0.6} />
        </mesh>
        {/* rambut mohawk mino */}
        <mesh position={[0, 1.68, -0.05]} rotation={[0.3, 0, 0]}>
          <boxGeometry args={[0.14, 0.22, 0.5]} />
          <meshStandardMaterial color="#ef4444" roughness={0.5} />
        </mesh>
        {/* mata */}
        <mesh position={[-0.12, 1.4, 0.27]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        <mesh position={[0.12, 1.4, 0.27]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#111" />
        </mesh>
        {/* SARUNG TINJU — senjata satu-satunya */}
        <mesh ref={gloveL} position={[-0.55, 1.25, 0.35]}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#ef4444" roughness={0.35} />
        </mesh>
        <mesh ref={gloveR} position={[0.55, 1.25, 0.35]}>
          <sphereGeometry args={[0.24, 20, 20]} />
          <meshStandardMaterial color="#ef4444" roughness={0.35} />
        </mesh>
        {/* lengan */}
        <mesh position={[-0.45, 0.9, 0.15]} rotation={[0.4, 0, 0.5]}>
          <capsuleGeometry args={[0.1, 0.35, 6, 10]} />
          <meshStandardMaterial color="#fcd7b0" />
        </mesh>
        <mesh position={[0.45, 0.9, 0.15]} rotation={[0.4, 0, -0.5]}>
          <capsuleGeometry args={[0.1, 0.35, 6, 10]} />
          <meshStandardMaterial color="#fcd7b0" />
        </mesh>
        {/* label nama */}
        <mesh position={[0, 2.05, 0]}>
          <boxGeometry args={[0.01, 0.01, 0.01]} />
          <meshBasicMaterial transparent opacity={0} />
        </mesh>
      </group>
    </RigidBody>
  )
}

function restPose(type) {
  if (type === 'jab') return { x: -0.55, y: 1.25, z: 0.35 }
  return { x: 0.55, y: 1.25, z: 0.35 }
}
function punchOffset(type) {
  if (type === 'jab') return { x: -0.35, y: 1.45, z: 1.15 }
  if (type === 'upper') return { x: 0.2, y: 1.9, z: 0.9 }
  return { x: 0.1, y: 1.45, z: 1.2 } // hook menyilang
}
function importBodyImpulse(dirn) {
  // dorong musuh via body ref
  const eb = enemyBodyRef.current
  if (eb) {
    try { eb.applyImpulse({ x: dirn.x, y: dirn.y, z: dirn.z }, true) } catch {}
  }
}
export { blockSound }
