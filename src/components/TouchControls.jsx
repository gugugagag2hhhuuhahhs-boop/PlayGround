import { useEffect, useRef } from 'react'
import { useGame } from '../game/store'

// Joystick kiri + tombol pukul kanan. Juga dukung keyboard (WASD + J/K/L + Space block).
export default function TouchControls() {
  const joyBase = useRef(null)
  const knob = useRef(null)
  const joyId = useRef(null)
  const joyCenter = useRef({ x: 0, y: 0 })
  const phase = useGame((s) => s.phase)

  const setInput = useGame((s) => s.setInput)
  const requestPunch = useGame((s) => s.requestPunch)

  // keyboard buat tes desktop
  useEffect(() => {
    const keys = new Set()
    const apply = () => {
      let x = 0, z = 0
      if (keys.has('a') || keys.has('arrowleft')) x -= 1
      if (keys.has('d') || keys.has('arrowright')) x += 1
      if (keys.has('w') || keys.has('arrowup')) z -= 1
      if (keys.has('s') || keys.has('arrowdown')) z += 1
      const l = Math.hypot(x, z) || 1
      setInput({ x: x / l, z: z / l, block: keys.has(' ') || keys.has('shift') })
    }
    const dn = (e) => {
      const k = e.key.toLowerCase()
      if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault()
      keys.add(k === ' ' ? ' ' : k)
      if (k === 'j') requestPunch('jab')
      if (k === 'k') requestPunch('hook')
      if (k === 'l') requestPunch('upper')
      apply()
    }
    const up = (e) => {
      const k = e.key.toLowerCase()
      keys.delete(k === ' ' ? ' ' : k)
      apply()
    }
    window.addEventListener('keydown', dn)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', dn)
      window.removeEventListener('keyup', up)
    }
  }, [setInput, requestPunch])

  if (phase !== 'fight') return null

  const onJoyStart = (e) => {
    const t = e.changedTouches[0]
    joyId.current = t.identifier
    const r = joyBase.current.getBoundingClientRect()
    joyCenter.current = { x: r.left + r.width / 2, y: r.top + r.height / 2 }
    moveKnob(t)
  }
  const moveKnob = (t) => {
    const dx = t.clientX - joyCenter.current.x
    const dy = t.clientY - joyCenter.current.y
    const max = 48
    const len = Math.hypot(dx, dy) || 1
    const cl = Math.min(1, len / max)
    const nx = (dx / len) * cl
    const ny = (dy / len) * cl
    if (knob.current) knob.current.style.transform = `translate(${nx * max}px, ${ny * max}px)`
    setInput({ x: nx, z: ny })
  }
  const onJoyMove = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId.current) moveKnob(t)
    }
  }
  const onJoyEnd = (e) => {
    for (const t of e.changedTouches) {
      if (t.identifier === joyId.current) {
        joyId.current = null
        if (knob.current) knob.current.style.transform = 'translate(0px,0px)'
        setInput({ x: 0, z: 0 })
      }
    }
  }

  const holdBlock = (on) => setInput({ block: on })

  return (
    <div className="touch-ui">
      {/* joystick */}
      <div
        ref={joyBase}
        className="joy-base"
        onTouchStart={onJoyStart}
        onTouchMove={onJoyMove}
        onTouchEnd={onJoyEnd}
        onTouchCancel={onJoyEnd}
      >
        <div ref={knob} className="joy-knob">🕹️</div>
      </div>
      {/* tombol pukul */}
      <div className="punch-pad">
        <button
          className="pbtn block"
          onTouchStart={(e) => { e.preventDefault(); holdBlock(true) }}
          onTouchEnd={() => holdBlock(false)}
          onMouseDown={() => holdBlock(true)}
          onMouseUp={() => holdBlock(false)}
        >🛡️<span>BLOCK</span></button>
        <button className="pbtn jab" onTouchStart={(e) => { e.preventDefault(); requestPunch('jab') }} onClick={() => requestPunch('jab')}>👊<span>JAB</span></button>
        <button className="pbtn hook" onTouchStart={(e) => { e.preventDefault(); requestPunch('hook') }} onClick={() => requestPunch('hook')}>🥊<span>HOOK</span></button>
        <button className="pbtn upper" onTouchStart={(e) => { e.preventDefault(); requestPunch('upper') }} onClick={() => requestPunch('upper')}>💥<span>UPPER</span></button>
      </div>
    </div>
  )
}
