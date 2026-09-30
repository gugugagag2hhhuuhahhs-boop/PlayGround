// SFX super ringan pakai WebAudio, tanpa file eksternal.
let ctx = null
function ac() {
  if (!ctx) {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return null
    ctx = new AC()
  }
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}
export function punchSound(muted) {
  if (muted) return
  try {
    const c = ac()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'square'
    o.frequency.setValueAtTime(180, c.currentTime)
    o.frequency.exponentialRampToValueAtTime(60, c.currentTime + 0.12)
    g.gain.setValueAtTime(0.2, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.15)
    o.connect(g).connect(c.destination)
    o.start()
    o.stop(c.currentTime + 0.16)
  } catch {}
}
export function blockSound(muted) {
  if (muted) return
  try {
    const c = ac()
    if (!c) return
    const o = c.createOscillator()
    const g = c.createGain()
    o.type = 'triangle'
    o.frequency.setValueAtTime(500, c.currentTime)
    g.gain.setValueAtTime(0.12, c.currentTime)
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + 0.08)
    o.connect(g).connect(c.destination)
    o.start()
    o.stop(c.currentTime + 0.09)
  } catch {}
}
export function koSound(muted) {
  if (muted) return
  try {
    const c = ac()
    if (!c) return
    ;[220, 175, 130, 90].forEach((f, i) => {
      const o = c.createOscillator()
      const g = c.createGain()
      o.type = 'sawtooth'
      o.frequency.setValueAtTime(f, c.currentTime + i * 0.14)
      g.gain.setValueAtTime(0.16, c.currentTime + i * 0.14)
      g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + i * 0.14 + 0.16)
      o.connect(g).connect(c.destination)
      o.start(c.currentTime + i * 0.14)
      o.stop(c.currentTime + i * 0.14 + 0.18)
    })
  } catch {}
}
