import { create } from 'zustand'
import { LEVELS } from './levels'

export const useGame = create((set, get) => ({
  phase: 'menu', // menu | fight | roundEnd | gameover | victory
  levelIndex: 0,
  playerHP: 100,
  playerMaxHP: 100,
  enemyHP: LEVELS[0].hp,
  enemyMaxHP: LEVELS[0].hp,
  combo: 0,
  bestCombo: 0,
  score: 0,
  wins: 0,
  banner: 'NONFIGHTER HERE',
  subBanner: 'Mino cuma punya TINJU. Buktikan!',
  koWinner: null,
  muted: false,

  // input shared (joystick + buttons write here, 3D reads here)
  input: { x: 0, z: 0, block: false },
  punchRequest: null, // {type:'jab'|'hook'|'upper', id:number}
  enemyHitRequest: null,

  setInput: (patch) => set((s) => ({ input: { ...s.input, ...patch } })),
  requestPunch: (type) =>
    set((s) => ({ punchRequest: { type, id: (s.punchRequest?.id ?? 0) + 1 } })),
  clearPunch: () => set({ punchRequest: null }),

  startGame: () =>
    set({
      phase: 'fight',
      levelIndex: 0,
      playerHP: 100,
      playerMaxHP: 100,
      enemyHP: LEVELS[0].hp,
      enemyMaxHP: LEVELS[0].hp,
      combo: 0,
      bestCombo: 0,
      score: 0,
      wins: 0,
      koWinner: null,
      banner: LEVELS[0].name,
      subBanner: LEVELS[0].taunt,
    }),

  nextLevel: () => {
    const ni = get().levelIndex + 1
    if (ni >= LEVELS.length) {
      set({ phase: 'victory', banner: 'KAMU JUARA!', subBanner: 'Mino menaklukkan Power Extreme!' })
      return
    }
    const lv = LEVELS[ni]
    set({
      phase: 'fight',
      levelIndex: ni,
      enemyHP: lv.hp,
      enemyMaxHP: lv.hp,
      playerHP: get().playerMaxHP,
      combo: 0,
      koWinner: null,
      banner: lv.name,
      subBanner: lv.taunt,
    })
  },

  damageEnemy: (dmg) => {
    const s = get()
    if (s.phase !== 'fight') return
    const nhp = Math.max(0, s.enemyHP - dmg)
    const combo = s.combo + 1
    set({
      enemyHP: nhp,
      combo,
      bestCombo: Math.max(s.bestCombo, combo),
      score: s.score + dmg + combo * 2,
    })
    if (nhp <= 0) {
      set({
        phase: 'roundEnd',
        koWinner: 'mino',
        wins: s.wins + 1,
        score: s.score + 500,
        banner: 'K.O.!',
        subBanner: 'Mino menang dengan TINJU!',
        combo: 0,
      })
    }
  },

  damagePlayer: (dmg) => {
    const s = get()
    if (s.phase !== 'fight') return
    const blocked = s.input.block
    const real = blocked ? Math.ceil(dmg * 0.3) : dmg
    const nhp = Math.max(0, s.playerHP - real)
    set({ playerHP: nhp, combo: 0 })
    if (nhp <= 0) {
      set({
        phase: 'gameover',
        koWinner: 'enemy',
        banner: 'K.O.!',
        subBanner: `${LEVELS[s.levelIndex].name} mengalahkan Mino...`,
      })
    }
  },

  resetCombo: () => set({ combo: 0 }),
  backToMenu: () => set({ phase: 'menu', koWinner: null }),
  toggleMute: () => set((s) => ({ muted: !s.muted })),
}))
