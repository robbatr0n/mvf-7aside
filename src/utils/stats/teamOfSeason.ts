import type { Event, Game, GamePlayer, GoalkeeperStats, Player, PlayerStats } from '../../types'
import type { TeamOfTheSeason } from './types'
import { calcGameScore, calcSeasonScore } from './scoring'
import { MIN_GAMES_COHORT } from '../constants'

export function calculateTeamOfTheSeason(
    stats: PlayerStats[],
    goalkeeperStats: GoalkeeperStats[],
    minGames: number = MIN_GAMES_COHORT,
): TeamOfTheSeason {
    const bestKeeper =
        goalkeeperStats.sort((a, b) => b.savePercentage - a.savePercentage)[0] ?? null

    const qualifiedOutfield = stats.filter(s => s.games_played >= minGames)

    const scored = qualifiedOutfield
        .map(s => ({
            player: s.player,
            score: Math.round(calcSeasonScore(s) * 100) / 100,
            role: 'outfield' as const,
        }))
        .sort((a, b) => b.score - a.score)

    const hasKeeper = bestKeeper !== null
    return {
        goalkeeper: hasKeeper
            ? { player: bestKeeper!.player, score: bestKeeper!.savePercentage, role: 'goalkeeper' }
            : null,
        outfield: scored.slice(0, hasKeeper ? 6 : 7),
    }
}

export function calculateTeamOfTheWeek(
    gameId: string,
    players: Player[],
    events: Event[],
    gamePlayers: GamePlayer[],
): TeamOfTheSeason {
    const gameEvents = events.filter(e => e.game_id === gameId)
    const gamePlayerEntries = gamePlayers.filter(gp => gp.game_id === gameId)

    const outfieldEntries = gamePlayerEntries.filter(gp => {
        const player = players.find(p => p.id === gp.player_id)
        return player && !player.is_guest && !player.is_goalkeeper
    })

    const scored = outfieldEntries
        .map(gp => {
            const player = players.find(p => p.id === gp.player_id)!
            const playerEvents = gameEvents.filter(e => e.player_id === gp.player_id)
            return {
                player,
                score: Math.round(calcGameScore(playerEvents) * 100) / 100,
                role: 'outfield' as const,
            }
        })
        .sort((a, b) => b.score - a.score)

    const keeperEntry = gamePlayerEntries.find(gp => {
        const player = players.find(p => p.id === gp.player_id)
        return player?.is_goalkeeper
    })

    const goalkeeper = keeperEntry
        ? (() => {
            const player = players.find(p => p.id === keeperEntry.player_id)!
            return { player, score: 0, role: 'goalkeeper' as const }
        })()
        : null

    return {
        goalkeeper,
        outfield: scored.slice(0, goalkeeper ? 6 : 7),
    }
}

export function getTeamOfSeasonPlayerIds(
    stats: PlayerStats[],
    goalkeeperStats: GoalkeeperStats[],
): Set<string> {
    const team = calculateTeamOfTheSeason(stats, goalkeeperStats)
    const ids = new Set<string>()
    team.outfield.forEach(p => ids.add(p.player.id))
    if (team.goalkeeper) ids.add(team.goalkeeper.player.id)
    return ids
}

export function calculateMotmForGame(
    gameId: string,
    players: Player[],
    events: Event[],
    gamePlayers: GamePlayer[],
): Player | null {
    const gameEvents = events.filter(e => e.game_id === gameId)
    const gamePlayerEntries = gamePlayers.filter(gp => gp.game_id === gameId)

    const outfieldEntries = gamePlayerEntries.filter(gp => {
        const player = players.find(p => p.id === gp.player_id)
        return player && !player.is_guest && !player.is_goalkeeper
    })

    if (outfieldEntries.length === 0) return null

    const scored = outfieldEntries.map(gp => {
        const player = players.find(p => p.id === gp.player_id)!
        const playerEvents = gameEvents.filter(e => e.player_id === gp.player_id)
        const goals = playerEvents.filter(e => e.event_type === 'goal').length
        const assists = playerEvents.filter(e => e.event_type === 'assist').length
        const sot = playerEvents.filter(e => e.event_type === 'shot_on_target').length
        const tackles = playerEvents.filter(e => e.event_type === 'tackle').length
        return { player, score: calcGameScore(playerEvents), goals, assists, sot, tackles }
    })

    scored.sort((a, b) => {
        if (b.score !== a.score) return b.score - a.score
        if (b.goals !== a.goals) return b.goals - a.goals
        if (b.assists !== a.assists) return b.assists - a.assists
        if (b.sot !== a.sot) return b.sot - a.sot
        return b.tackles - a.tackles
    })

    return scored[0]?.player ?? null
}

export function calculateMotmAppearances(
    players: Player[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): Map<string, number> {
    const appearances = new Map<string, number>()
    games.forEach(game => {
        const motm = calculateMotmForGame(game.id, players, events, gamePlayers)
        if (motm) appearances.set(motm.id, (appearances.get(motm.id) ?? 0) + 1)
    })
    return appearances
}

export function calculateMotmByGame(
    players: Player[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): Map<string, Player> {
    const byGame = new Map<string, Player>()
    games.forEach(game => {
        const motm = calculateMotmForGame(game.id, players, events, gamePlayers)
        if (motm) byGame.set(game.id, motm)
    })
    return byGame
}

export function calculateTotwAppearances(
    players: Player[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): Map<string, number> {
    const appearances = new Map<string, number>()

    const sortedGames = [...games].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    )

    sortedGames.forEach(game => {
        const team = calculateTeamOfTheWeek(game.id, players, events, gamePlayers)
        team.outfield.forEach(p => {
            appearances.set(p.player.id, (appearances.get(p.player.id) ?? 0) + 1)
        })
        if (team.goalkeeper) {
            appearances.set(
                team.goalkeeper.player.id,
                (appearances.get(team.goalkeeper.player.id) ?? 0) + 1
            )
        }
    })

    return appearances
}