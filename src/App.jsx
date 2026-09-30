import GameCanvas from './components/GameCanvas'
import HUD from './components/HUD'
import TouchControls from './components/TouchControls'
import Screens from './components/Screens'
import { playerBodyRef } from './game/refs'
import { useEffect } from 'react'

// daftarkan body Mino ke global agar musuh bisa kasih knockback
function BodyBridge() {
  useEffect(() => {
    window.__playerBodyRef = playerBodyRef
  }, [])
  return null
}

export default function App() {
  return (
    <div className="game-root">
      <GameCanvas />
      <BodyBridge />
      <HUD />
      <TouchControls />
      <Screens />
    </div>
  )
}
