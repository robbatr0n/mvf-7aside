import type { PlayerStats, Player, Event, Game, GamePlayer, GoalkeeperStats } from '../../types'
import type { Award, PartnershipAward } from './types'
import { MIN_GAMES } from './helpers'
import { buildAttackingAwards } from './attacking'
import { buildDefendingAwards } from './defending'
import { buildGoalkeepingAwards } from './goalkeeping'
import { buildConsistencyAwards } from './consistency'
import { buildPassingAwards } from './passing'

export type { Award, PartnershipAward }

export function calculateAwards(
    stats: PlayerStats[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
    players: Player[],
    goalkeeperStats: GoalkeeperStats[] = [],
    totwAppearances: Map<string, number> = new Map(),
    motmAppearances: Map<string, number> = new Map(),
): { awards: Award[]; partnership: PartnershipAward | null } {
    const eligibleStats = stats.filter(s => !s.player.exclude_from_awards)
    const qualified = eligibleStats.filter(s => s.games_played >= MIN_GAMES)

    const attacking = buildAttackingAwards(eligibleStats, events, players)
    const defending = buildDefendingAwards(eligibleStats, qualified, events, players)
    const goalkeeping = buildGoalkeepingAwards(goalkeeperStats, events, gamePlayers)
    const { awards: consistency, partnership } = buildConsistencyAwards(
        eligibleStats, qualified, totwAppearances, motmAppearances, players, events, games
    )
    const passing = buildPassingAwards(eligibleStats, events, players)

    return {
        awards: [...attacking, ...defending, ...goalkeeping, ...consistency, ...passing],
        partnership,
    }
}