import type { PlayerStats, Player, Event } from '../../types'
import type { Award } from './types'
import { topN, runnerUpN, bestSingleGameStat, MIN_GAMES } from './helpers'

export function buildDefendingAwards(
    eligibleStats: PlayerStats[],
    qualified: PlayerStats[],
    events: Event[],
    players: Player[],
): Award[] {
    const hardmanWinners = topN(eligibleStats, 'tackles')
    const hardmanRunnerUps = runnerUpN(eligibleStats, 'tackles')
    const hardman: Award = {
        emoji: '💪',
        title: 'Hardman',
        description: 'Most tackles',
        winners: hardmanWinners.map(s => s.player.name),
        value: `${hardmanWinners[0]?.tackles ?? 0} tackles`,
        noWinner: !hardmanWinners[0] || hardmanWinners[0].tackles === 0,
        runnerUp: hardmanRunnerUps.length > 0
            ? { names: hardmanRunnerUps.map(s => s.player.name), value: `${hardmanRunnerUps[0].tackles} tackles` }
            : undefined,
    }

    const sweeperWinners = topN(eligibleStats, 'interceptions')
    const sweeperRunnerUps = runnerUpN(eligibleStats, 'interceptions')
    const sweeper: Award = {
        emoji: '✋',
        title: 'Sweeper',
        description: 'Most interceptions',
        winners: sweeperWinners.map(s => s.player.name),
        value: `${sweeperWinners[0]?.interceptions ?? 0} interceptions`,
        noWinner: !sweeperWinners[0] || sweeperWinners[0].interceptions === 0,
        runnerUp: sweeperRunnerUps.length > 0
            ? { names: sweeperRunnerUps.map(s => s.player.name), value: `${sweeperRunnerUps[0].interceptions} interceptions` }
            : undefined,
    }

    const enforcerWinners = topN(eligibleStats, 'defensive_actions')
    const enforcerRunnerUps = runnerUpN(eligibleStats, 'defensive_actions')
    const enforcer: Award = {
        emoji: '🛡️',
        title: 'Enforcer',
        description: 'Most tackles + interceptions combined',
        winners: enforcerWinners.map(s => s.player.name),
        value: `${enforcerWinners[0]?.defensive_actions ?? 0} defensive actions`,
        noWinner: !enforcerWinners[0] || enforcerWinners[0].defensive_actions === 0,
        runnerUp: enforcerRunnerUps.length > 0
            ? { names: enforcerRunnerUps.map(s => s.player.name), value: `${enforcerRunnerUps[0].defensive_actions} defensive actions` }
            : undefined,
    }

    const tackleHeroResult = bestSingleGameStat('tackle', eligibleStats, events, players)
    const tackleHero: Award = {
        emoji: '🦵',
        title: 'Tackle Hero',
        description: 'Most tackles in a single game',
        winners: tackleHeroResult.winners,
        value: `${tackleHeroResult.best} tackles in one game`,
        noWinner: tackleHeroResult.winners.length === 0,
        runnerUp: tackleHeroResult.runnerUp
            ? { names: tackleHeroResult.runnerUp.winners, value: `${tackleHeroResult.runnerUp.best} tackles in one game` }
            : undefined,
    }

    const interceptionHeroResult = bestSingleGameStat('interception', eligibleStats, events, players)
    const interceptionHero: Award = {
        emoji: '🕵️',
        title: 'Interception Hero',
        description: 'Most interceptions in a single game',
        winners: interceptionHeroResult.winners,
        value: `${interceptionHeroResult.best} interceptions in one game`,
        noWinner: interceptionHeroResult.winners.length === 0,
        runnerUp: interceptionHeroResult.runnerUp
            ? { names: interceptionHeroResult.runnerUp.winners, value: `${interceptionHeroResult.runnerUp.best} interceptions in one game` }
            : undefined,
    }

    const tacklesPerGameWinners = topN(qualified, 'tackles_per_game')
    const tacklesPerGameRunnerUps = runnerUpN(qualified, 'tackles_per_game')
    const terminator: Award = {
        emoji: '🤖',
        title: 'Terminator',
        description: `Best tackles per game rate (min ${MIN_GAMES} games)`,
        winners: tacklesPerGameWinners.map(s => s.player.name),
        value: `${tacklesPerGameWinners[0]?.tackles_per_game ?? 0} per game`,
        noWinner: !tacklesPerGameWinners[0] || tacklesPerGameWinners[0].tackles_per_game === 0,
        runnerUp: tacklesPerGameRunnerUps.length > 0
            ? { names: tacklesPerGameRunnerUps.map(s => s.player.name), value: `${tacklesPerGameRunnerUps[0].tackles_per_game} per game` }
            : undefined,
    }

    const interceptionsPerGameWinners = topN(qualified, 'interceptions_per_game')
    const interceptionsPerGameRunnerUps = runnerUpN(qualified, 'interceptions_per_game')
    const theInterceptor: Award = {
        emoji: '🧲',
        title: 'The Interceptor',
        description: `Best interceptions per game rate (min ${MIN_GAMES} games)`,
        winners: interceptionsPerGameWinners.map(s => s.player.name),
        value: `${interceptionsPerGameWinners[0]?.interceptions_per_game ?? 0} per game`,
        noWinner: !interceptionsPerGameWinners[0] || interceptionsPerGameWinners[0].interceptions_per_game === 0,
        runnerUp: interceptionsPerGameRunnerUps.length > 0
            ? { names: interceptionsPerGameRunnerUps.map(s => s.player.name), value: `${interceptionsPerGameRunnerUps[0].interceptions_per_game} per game` }
            : undefined,
    }

    return [hardman, sweeper, enforcer, tackleHero, interceptionHero, terminator, theInterceptor]
}