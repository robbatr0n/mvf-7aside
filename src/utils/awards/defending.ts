import type { PlayerStats, Player, Event } from '../../types'
import type { Award } from './types'
import { topN, bestSingleGameStat, MIN_GAMES } from './helpers'

export function buildDefendingAwards(
    eligibleStats: PlayerStats[],
    qualified: PlayerStats[],
    events: Event[],
    players: Player[],
): Award[] {
    const hardmanWinners = topN(eligibleStats, 'tackles')
    const hardman: Award = {
        emoji: '💪',
        title: 'Hardman',
        description: 'Most tackles',
        winners: hardmanWinners.map(s => s.player.name),
        value: `${hardmanWinners[0]?.tackles ?? 0} tackles`,
        noWinner: !hardmanWinners[0] || hardmanWinners[0].tackles === 0,
    }

    const sweeperWinners = topN(eligibleStats, 'interceptions')
    const sweeper: Award = {
        emoji: '✋',
        title: 'Sweeper',
        description: 'Most interceptions',
        winners: sweeperWinners.map(s => s.player.name),
        value: `${sweeperWinners[0]?.interceptions ?? 0} interceptions`,
        noWinner: !sweeperWinners[0] || sweeperWinners[0].interceptions === 0,
    }

    const enforcerWinners = topN(eligibleStats, 'defensive_actions')
    const enforcer: Award = {
        emoji: '🛡️',
        title: 'Enforcer',
        description: 'Most tackles + interceptions combined',
        winners: enforcerWinners.map(s => s.player.name),
        value: `${enforcerWinners[0]?.defensive_actions ?? 0} defensive actions`,
        noWinner: !enforcerWinners[0] || enforcerWinners[0].defensive_actions === 0,
    }

    const tackleHeroResult = bestSingleGameStat('tackle', eligibleStats, events, players)
    const tackleHero: Award = {
        emoji: '🦵',
        title: 'Tackle Hero',
        description: 'Most tackles in a single game',
        winners: tackleHeroResult.winners,
        value: `${tackleHeroResult.best} tackles in one game`,
        noWinner: tackleHeroResult.winners.length === 0,
    }

    const interceptionHeroResult = bestSingleGameStat('interception', eligibleStats, events, players)
    const interceptionHero: Award = {
        emoji: '🕵️',
        title: 'Interception Hero',
        description: 'Most interceptions in a single game',
        winners: interceptionHeroResult.winners,
        value: `${interceptionHeroResult.best} interceptions in one game`,
        noWinner: interceptionHeroResult.winners.length === 0,
    }

    const tacklesPerGameWinners = topN(qualified, 'tackles_per_game')
    const terminator: Award = {
        emoji: '💪',
        title: 'Terminator',
        description: `Best tackles per game rate (min ${MIN_GAMES} games)`,
        winners: tacklesPerGameWinners.map(s => s.player.name),
        value: `${tacklesPerGameWinners[0]?.tackles_per_game ?? 0} per game`,
        noWinner: !tacklesPerGameWinners[0] || tacklesPerGameWinners[0].tackles_per_game === 0,
    }

    const interceptionsPerGameWinners = topN(qualified, 'interceptions_per_game')
    const theInterceptor: Award = {
        emoji: '✋',
        title: 'The Interceptor',
        description: `Best interceptions per game rate (min ${MIN_GAMES} games)`,
        winners: interceptionsPerGameWinners.map(s => s.player.name),
        value: `${interceptionsPerGameWinners[0]?.interceptions_per_game ?? 0} per game`,
        noWinner: !interceptionsPerGameWinners[0] || interceptionsPerGameWinners[0].interceptions_per_game === 0,
    }

    return [hardman, sweeper, enforcer, tackleHero, interceptionHero, terminator, theInterceptor]
}