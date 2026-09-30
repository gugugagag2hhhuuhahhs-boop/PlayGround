import { RigidBody, CuboidCollider } from '@react-three/rapier'
import { useGame } from '../game/store'
import { LEVELS } from '../game/levels'

export default function Arena() {
  const levelIndex = useGame((s) => s.levelIndex)
  const lv = LEVELS[levelIndex] ?? LEVELS[0]
  return (
    <group>
      {/* lantai ring */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[8, 0.5, 8]} position={[0, -0.5, 0]} friction={1.2} />
        <mesh receiveShadow position={[0, -0.02, 0]}>
          <boxGeometry args={[16, 0.1, 16]} />
          <meshStandardMaterial color="#141a2e" roughness={0.9} />
        </mesh>
        {/* kanvas ring */}
        <mesh receiveShadow position={[0, 0.04, 0]}>
          <boxGeometry args={[13.6, 0.06, 13.6]} />
          <meshStandardMaterial color="#1d2542" roughness={0.8} />
        </mesh>
        {/* garis ring */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[12.4, 0.02, 12.4]} />
          <meshStandardMaterial color={lv.color} emissive={lv.color} emissiveIntensity={0.55} />
        </mesh>
        <mesh position={[0, 0.09, 0]}>
          <boxGeometry args={[10.8, 0.025, 10.8]} />
          <meshStandardMaterial color="#0b0e1a" />
        </mesh>
        {/* logo tengah */}
        <mesh position={[0, 0.1, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[1.2, 1.6, 48]} />
          <meshStandardMaterial color={lv.color} emissive={lv.color} emissiveIntensity={0.8} />
        </mesh>
      </RigidBody>
      {/* dinding tak terlihat */}
      <RigidBody type="fixed" colliders={false}>
        <CuboidCollider args={[0.5, 3, 8]} position={[-7.2, 2, 0]} />
        <CuboidCollider args={[0.5, 3, 8]} position={[7.2, 2, 0]} />
        <CuboidCollider args={[8, 3, 0.5]} position={[0, 2, -7.2]} />
        <CuboidCollider args={[8, 3, 0.5]} position={[0, 2, 7.2]} />
      </RigidBody>
      {/* 4 tiang + tali */}
      {[[-6, -6], [6, -6], [-6, 6], [6, 6]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.1, z]}>
          <cylinderGeometry args={[0.09, 0.09, 2.2, 12]} />
          <meshStandardMaterial color={lv.color} emissive={lv.color} emissiveIntensity={0.4} />
        </mesh>
      ))}
      {[0.7, 1.2, 1.7].map((y) => (
        <group key={y}>
          <mesh position={[0, y, -6]}><boxGeometry args={[12, 0.06, 0.06]} /><meshStandardMaterial color="#e2e8f0" roughness={0.4} /></mesh>
          <mesh position={[0, y, 6]}><boxGeometry args={[12, 0.06, 0.06]} /><meshStandardMaterial color="#e2e8f0" roughness={0.4} /></mesh>
          <mesh position={[-6, y, 0]}><boxGeometry args={[0.06, 0.06, 12]} /><meshStandardMaterial color="#e2e8f0" roughness={0.4} /></mesh>
          <mesh position={[6, y, 0]}><boxGeometry args={[0.06, 0.06, 12]} /><meshStandardMaterial color="#e2e8f0" roughness={0.4} /></mesh>
        </group>
      ))}
      {/* lampu sorot */}
      <pointLight position={[0, 8, 0]} intensity={60} color="#ffffff" distance={30} />
      <pointLight position={[-5, 4, -5]} intensity={20} color={lv.color} distance={25} />
      <pointLight position={[5, 4, 5]} intensity={20} color={lv.color} distance={25} />
    </group>
  )
}
