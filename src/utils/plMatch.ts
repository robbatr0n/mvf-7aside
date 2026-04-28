import plPlayers from '../data/players.json'
import type { GoalkeeperStats, PlayerStats } from '../types'

export type PLPlayer = typeof plPlayers[0]

const plShoMin = Math.min(...plPlayers.map(p => p.SHO))
const plShoMax = Math.max(...plPlayers.map(p => p.SHO))
const plPasMin = Math.min(...plPlayers.map(p => p.PAS))
const plPasMax = Math.max(...plPlayers.map(p => p.PAS))
const plDefMin = Math.min(...plPlayers.map(p => p.DEF))
const plDefMax = Math.max(...plPlayers.map(p => p.DEF))

const squadNorm = (val: number, vals: number[]): number => {
  const min = Math.min(...vals)
  const max = Math.max(...vals)
  return max > min ? (val - min) / (max - min) : 0.5
}

const plNorm = (v: number, min: number, max: number) => (v - min) / (max - min)

type DistEntry = { id: string; player: PLPlayer; dist: number }

function greedyAssign(dists: DistEntry[], totalMvf: number): Map<string, PLPlayer> {
  dists.sort((a, b) => a.dist - b.dist)
  const assignedMvf = new Set<string>()
  const assignedPl = new Set<string>()
  const result = new Map<string, PLPlayer>()
  for (const { id, player } of dists) {
    if (assignedMvf.has(id) || assignedPl.has(player.name)) continue
    result.set(id, player)
    assignedMvf.add(id)
    assignedPl.add(player.name)
    if (assignedMvf.size === totalMvf) break
  }
  return result
}

export function computeAllPLMatches(
  stats: PlayerStats[],
  goalkeeperStats: GoalkeeperStats[],
): Map<string, PLPlayer> {
  const result = new Map<string, PLPlayer>()

  // --- Outfield ---
  const outfieldPL = plPlayers.filter(p => p.position !== 'GK')
  const eligible = stats.filter(s => !s.player.is_goalkeeper && s.games_played >= 5)

  if (eligible.length > 0) {
    const totalSh = (s: PlayerStats) => s.shots_on_target + s.shots_off_target
    const defPg = (s: PlayerStats) => s.defensive_actions / s.games_played

    const playerRaw = eligible.map(s => ({
      id: s.player.id,
      sho: totalSh(s) >= 5 ? s.shot_accuracy : undefined,
      pas: s.pass_attempts > 0 ? s.pass_accuracy : undefined,
      def: defPg(s),
    }))

    const shoVals = playerRaw.map(p => p.sho).filter((v): v is number => v !== undefined)
    const pasVals = playerRaw.map(p => p.pas).filter((v): v is number => v !== undefined)
    const defVals = playerRaw.map(p => p.def)

    const dists: DistEntry[] = []
    for (const p of playerRaw) {
      type Dim = { mvf: number; pl: (pp: PLPlayer) => number }
      const dims: Dim[] = []
      if (p.sho !== undefined && shoVals.length > 1) dims.push({ mvf: squadNorm(p.sho, shoVals), pl: pp => plNorm(pp.SHO, plShoMin, plShoMax) })
      if (p.pas !== undefined && pasVals.length > 1) dims.push({ mvf: squadNorm(p.pas, pasVals), pl: pp => plNorm(pp.PAS, plPasMin, plPasMax) })
      dims.push({ mvf: squadNorm(p.def, defVals), pl: pp => plNorm(pp.DEF, plDefMin, plDefMax) })

      for (const plP of outfieldPL) {
        const dist = Math.sqrt(dims.reduce((sum, d) => sum + (d.mvf - d.pl(plP)) ** 2, 0))
        dists.push({ id: p.id, player: plP, dist })
      }
    }

    for (const [id, plP] of greedyAssign(dists, eligible.length)) {
      result.set(id, plP)
    }
  }

  // --- Goalkeepers ---
  const gkPL = plPlayers.filter(p => p.position === 'GK')
  const eligibleGKs = goalkeeperStats.filter(g => g.games >= 5)

  if (eligibleGKs.length > 0 && gkPL.length > 0) {
    const saveVals = eligibleGKs.map(g => g.savePercentage)
    const gkOvrMin = Math.min(...gkPL.map(p => p.overall))
    const gkOvrMax = Math.max(...gkPL.map(p => p.overall))

    const dists: DistEntry[] = []
    for (const g of eligibleGKs) {
      const mvfNorm = squadNorm(g.savePercentage, saveVals)
      for (const plP of gkPL) {
        const dist = Math.abs(mvfNorm - plNorm(plP.overall, gkOvrMin, gkOvrMax))
        dists.push({ id: g.player.id, player: plP, dist })
      }
    }

    for (const [id, plP] of greedyAssign(dists, eligibleGKs.length)) {
      result.set(id, plP)
    }
  }

  return result
}
