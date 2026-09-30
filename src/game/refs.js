import * as THREE from 'three'

// Posisi dunia yang dibaca antar fighter (tanpa re-render React)
export const playerPos = { current: new THREE.Vector3(-2.5, 0, 0) }
export const enemyPos = { current: new THREE.Vector3(2.5, 0, 0) }
export const playerBodyRef = { current: null }
export const enemyBodyRef = { current: null }
// efek pukulan terakhir buat spark
export const lastHit = { pos: new THREE.Vector3(), time: -10, color: '#fff' }
