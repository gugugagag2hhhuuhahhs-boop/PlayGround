import { useEffect, useRef } from 'react'
import gsap from 'gsap'
import { useGame } from '../game/store'
import { LEVELS } from '../game/levels'
import { koSound } from '../game/audio'

export default function Screens() {
  const phase = useGame((s) => s.phase)
  const banner = useGame((s) => s.banner)
  const subBanner = useGame((s) => s.subBanner)
  const levelIndex = useGame((s) => s.levelIndex)
  const score = useGame((s) => s.score)
  const bestCombo = useGame((s) => s.bestCombo)
  const wins = useGame((s) => s.wins)
  const koWinner = useGame((s) => s.koWinner)
  const startGame = useGame((s) => s.startGame)
  const nextLevel = useGame((s) => s.nextLevel)
  const backToMenu = useGame((s) => s.backToMenu)
  const muted = useGame((s) => s.muted)

  const titleRef = useRef(null)
  const cardRef = useRef(null)

  useEffect(() => {
    if (phase === 'menu' && titleRef.current) {
      gsap.fromTo(titleRef.current, { scale: 0.7, opacity: 0, y: 30 }, { scale: 1, opacity: 1, y: 0, duration: 0.8, ease: 'back.out(1.6)' })
      gsap.to('.float-fist', { y: -14, duration: 1.1, yoyo: true, repeat: -1, ease: 'sine.inOut', stagger: 0.15 })
    }
  }, [phase])

  useEffect(() => {
    if ((phase === 'roundEnd' || phase === 'gameover') && cardRef.current) {
      koSound(muted)
      gsap.fromTo(cardRef.current, { scale: 0.5, opacity: 0, rotate: -4 }, { scale: 1, opacity: 1, rotate: 0, duration: 0.6, ease: 'back.out(1.8)' })
    }
  }, [phase, muted])

  if (phase === 'fight') return null

  if (phase === 'menu') {
    return (
      <div className="screen menu-screen">
        <div ref={titleRef} className="title-wrap">
          <div className="fists"><span className="float-fist">🥊</span><span className="float-fist">🥊</span></div>
          <h1 className="game-title">NONFIGHTER<br />HERE</h1>
          <p className="subtitle">Mino cuma punya <b>TINJU</b> — tanpa tendangan, tanpa sihir.<br />Kalahkan 5 lawan: Easy → <span className="extreme">POWER EXTREME</span></p>
          <div className="level-list">
            {LEVELS.map((l) => (
              <span key={l.id} className="lvl-chip" style={{ borderColor: l.color, color: l.color }}>{l.label}</span>
            ))}
          </div>
          <button className="big-btn" onClick={startGame}>▶ MULAI BERANTEM</button>
          <p className="hint">📱 Geser joystick kiri untuk gerak • 👊 JAB / HOOK / UPPER • 🛡️ tahan BLOCK<br />⌨️ Desktop: WASD + J/K/L + Space</p>
          <div className="mino-card">🦔 <b>MINO</b> — bocah pemberani bersarung merah</div>
        </div>
      </div>
    )
  }

  if (phase === 'roundEnd') {
    const isLast = levelIndex >= LEVELS.length - 1
    return (
      <div className="screen overlay">
        <div ref={cardRef} className="ko-card win">
          <h1 className="ko-text">K.O.! 🎉</h1>
          <p>{banner} — {subBanner}</p>
          <p className="stat">Skor: ⭐ {score} • Best combo: 🔥 {bestCombo}x</p>
          {!isLast ? (
            <button className="big-btn" onClick={nextLevel}>LANJUT: {LEVELS[levelIndex + 1].label} — {LEVELS[levelIndex + 1].name} →</button>
          ) : (
            <button className="big-btn" onClick={nextLevel}>🏆 KLAIM KEMENANGAN</button>
          )}
          <button className="ghost-btn" onClick={backToMenu}>Menu</button>
        </div>
      </div>
    )
  }

  if (phase === 'gameover') {
    return (
      <div className="screen overlay">
        <div ref={cardRef} className="ko-card lose">
          <h1 className="ko-text">K.O. 😵</h1>
          <p>{subBanner}</p>
          <p className="stat">Kalah di {LEVELS[levelIndex].label} • Skor: ⭐ {score} • Menang: {wins}x</p>
          <button className="big-btn" onClick={startGame}>🔄 COBA LAGI DARI EASY</button>
          <button className="ghost-btn" onClick={backToMenu}>Menu</button>
        </div>
      </div>
    )
  }

  if (phase === 'victory') {
    return (
      <div className="screen overlay">
        <div ref={cardRef} className="ko-card win gold">
          <h1 className="ko-text">🏆 JUARA!</h1>
          <p>Mino menaklukkan <b>EXTREME X</b> hanya dengan TINJU!<br />Kamu resmi bukan nonfighter. Kamu FIGHTER.</p>
          <p className="stat">Skor akhir: ⭐ {score} • Best combo: 🔥 {bestCombo}x</p>
          <button className="big-btn" onClick={startGame}>🔄 MAIN LAGI</button>
          <button className="ghost-btn" onClick={backToMenu}>Menu</button>
        </div>
      </div>
    )
  }
  return null
}
