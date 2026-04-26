import type { Event, Game, GamePlayer, Player } from '../../types'
import type { GoalEntry, GameSummary, PlayerGameStats, TeamStats } from './types'
import { calculateMotmForGame } from './teamOfSeason'

function calcTeamStats(
    teamPlayers: Player[],
    gameEvents: Event[],
    teamGoals: number,
): TeamStats {
    const playerIds = new Set(teamPlayers.map(p => p.id))
    const allShots = gameEvents.filter(
        e => playerIds.has(e.player_id) &&
            (e.event_type === 'shot_on_target' || e.event_type === 'shot_off_target')
    )
    const shotsOnTarget = allShots.filter(e => e.event_type === 'shot_on_target').length
    const totalShots = allShots.length
    const keyPasses = gameEvents.filter(
        e => playerIds.has(e.player_id) && e.event_type === 'key_pass'
    ).length
    const tackles = gameEvents.filter(
        e => playerIds.has(e.player_id) && e.event_type === 'tackle'
    ).length
    const interceptions = gameEvents.filter(
        e => playerIds.has(e.player_id) && e.event_type === 'interception'
    ).length
    const passesCompleted = gameEvents.filter(
        e => playerIds.has(e.player_id) && e.event_type === 'pass_completed'
    ).length
    const passesFailed = gameEvents.filter(
        e => playerIds.has(e.player_id) && e.event_type === 'pass_failed'
    ).length
    const passAttempts = passesCompleted + passesFailed

    return {
        shots: totalShots,
        shotsOnTarget,
        shotAccuracy: totalShots > 0 ? Math.round((shotsOnTarget / totalShots) * 100) : 0,
        shotConversion: totalShots > 0 ? Math.round((teamGoals / totalShots) * 100) : 0,
        keyPasses,
        tackles,
        interceptions,
        passesCompleted,
        passAccuracy: passAttempts > 0 ? Math.round((passesCompleted / passAttempts) * 100) : 0,
    }
}

export function calculateGameSummaries(
    games: Game[],
    players: Player[],
    events: Event[],
    gamePlayers: GamePlayer[],
): GameSummary[] {
    return [...games]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .map(game => {
            const gameEvents = events.filter(e => e.game_id === game.id)
            const gpEntries = gamePlayers.filter(gp => gp.game_id === game.id)

            const team1Players = gpEntries
                .filter(gp => gp.team === 1)
                .map(gp => players.find(p => p.id === gp.player_id))
                .filter(Boolean) as Player[]

            const team2Players = gpEntries
                .filter(gp => gp.team === 2)
                .map(gp => players.find(p => p.id === gp.player_id))
                .filter(Boolean) as Player[]

            const goalEvents = gameEvents.filter(e => e.event_type === 'goal')

            const goalEntries: GoalEntry[] = goalEvents
                .map(goal => {
                    const scorer = players.find(p => p.id === goal.player_id) ?? null
                    if (!scorer) return null

                    const linkedAssist = gameEvents.find(
                        e => e.event_type === 'assist' && e.related_event_id === goal.id
                    )

                    let assister: Player | null = null
                    if (linkedAssist) {
                        assister = players.find(p => p.id === linkedAssist.player_id) ?? null
                    } else {
                        const goalTime = new Date(goal.created_at).getTime()
                        const unlinkedAssists = gameEvents.filter(
                            e => e.event_type === 'assist' && e.related_event_id === null
                        )
                        const closest = unlinkedAssists
                            .filter(a => a.player_id !== goal.player_id)
                            .filter(a => new Date(a.created_at).getTime() >= goalTime)
                            .sort(
                                (a, b) =>
                                    Math.abs(new Date(a.created_at).getTime() - goalTime) -
                                    Math.abs(new Date(b.created_at).getTime() - goalTime)
                            )[0]
                        if (closest) {
                            assister = players.find(p => p.id === closest.player_id) ?? null
                        }
                    }

                    return { scorer, assister, team_override: goal.team_override ?? null }
                })
                .filter(Boolean) as GoalEntry[]

            const team1Goals = goalEntries.filter(g => {
                if (g.team_override !== null) return g.team_override === 1
                return team1Players.some(p => p.id === g.scorer.id)
            })

            const team2Goals = goalEntries.filter(g => {
                if (g.team_override !== null) return g.team_override === 2
                return team2Players.some(p => p.id === g.scorer.id)
            })

            return {
                game,
                team1Players,
                team2Players,
                team1Goals,
                team2Goals,
                totalGoals: goalEntries.length,
                team1Stats: calcTeamStats(team1Players, gameEvents, team1Goals.length),
                team2Stats: calcTeamStats(team2Players, gameEvents, team2Goals.length),
                motm: calculateMotmForGame(game.id, players, events, gamePlayers),
            }
        })
}

export function calculatePlayerGameBreakdown(
    playerId: string,
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): PlayerGameStats[] {
    const playerGameIds = gamePlayers
        .filter(gp => gp.player_id === playerId)
        .map(gp => gp.game_id)

    return games
        .filter(g => playerGameIds.includes(g.id))
        .map(game => {
            const gameEvents = events.filter(
                e => e.player_id === playerId && e.game_id === game.id
            )
            return {
                game,
                goals: gameEvents.filter(e => e.event_type === 'goal').length,
                assists: gameEvents.filter(e => e.event_type === 'assist').length,
                key_passes: gameEvents.filter(e => e.event_type === 'key_pass').length,
                shots_on_target: gameEvents.filter(e => e.event_type === 'shot_on_target').length,
                shots_off_target: gameEvents.filter(e => e.event_type === 'shot_off_target').length,
                goal_involvements: gameEvents.filter(
                    e => e.event_type === 'goal' || e.event_type === 'assist'
                ).length,
                tackles: gameEvents.filter(e => e.event_type === 'tackle').length,
                interceptions: gameEvents.filter(e => e.event_type === 'interception').length,
                passes_completed: gameEvents.filter(e => e.event_type === 'pass_completed').length,
                passes_failed: gameEvents.filter(e => e.event_type === 'pass_failed').length,
                pass_accuracy: (() => {
                    const pc = gameEvents.filter(e => e.event_type === 'pass_completed').length
                    const pf = gameEvents.filter(e => e.event_type === 'pass_failed').length
                    const total = pc + pf
                    return total > 0 ? Math.round((pc / total) * 100) : 0
                })(),
            }
        })
        .sort((a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime())
}