import { useGame } from '../game/store'
import { LEVELS } from '../game/levels'

function Bar({ value, max, mine }) {
  const pct = Math.max(0, (value / max) * 100)
  return (
    <div className={`hpbar ${mine ? 'mine' : 'foe'}`}>
      <div className="hpfill" style={{ width: pct + '%' }} />
    </div>
  )
}

export default function HUD() {
  const phase = useGame((s) => s.phase)
  const levelIndex = useGame((s) => s.levelIndex)
  const playerHP = useGame((s) => s.playerHP)
  const playerMaxHP = useGame((s) => s.playerMaxHP)
  const enemyHP = useGame((s) => s.enemyHP)
  const enemyMaxHP = useGame((s) => s.enemyMaxHP)
  const combo = useGame((s) => s.combo)
  const score = useGame((s) => s.score)
  const banner = useGame((s) => s.banner)
  const subBanner = useGame((s) => s.subBanner)
  const muted = useGame((s) => s.muted)
  const toggleMute = useGame((s) => s.toggleMute)
  const lv = LEVELS[levelIndex]

  if (phase === 'menu') return null

  return (
    <div className="hud">
      <div className="hud-top">
        <div className="fighter-card mino">
          <div className="fname">🥊 MINO</div>
          <Bar value={playerHP} max={playerMaxHP} mine />
          <div className="hpnum">{Math.ceil(playerHP)} HP</div>
        </div>
        <div className="hud-mid">
          <div className="stage-pill" style={{ borderColor: lv.color, color: lv.color }}>
            {lv.label}
          </div>
          <div className="vs">VS</div>
          <div className="score">⭐ {score}</div>
          {combo >= 2 && <div className="combo">{combo}x COMBO! 🔥</div>}
        </div>
        <div className="fighter-card foe">
          <div className="fname">{lv.name.toUpperCase()}</div>
          <Bar value={enemyHP} max={enemyMaxHP} />
          <div className="hpnum">{Math.ceil(enemyHP)} HP</div>
        </div>
      </div>
      {(phase === 'fight' && combo === 0) && (
        <div className="taunt">{banner} — {subBanner}</div>
      )}
      <button className="mute-btn" onClick={toggleMute}>{muted ? '🔇' : '🔊'}</button>
    </div>
  )
}
