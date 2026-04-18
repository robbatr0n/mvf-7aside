import type { Event, Game, GamePlayer, GoalkeeperStats, Player } from '../../types'

export function calculateGoalkeeperStats(
    players: Player[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): GoalkeeperStats[] {
    const goalkeepers = players.filter(p => p.is_goalkeeper && !p.is_guest)

    return goalkeepers
        .map(keeper => {
            let totalSaves = 0
            let totalConceded = 0
            let cleanSheets = 0
            let gamesPlayed = 0
            let wins = 0
            let losses = 0
            let draws = 0
            const formHistory: ('W' | 'L' | 'D')[] = []

            const sortedGames = [...games].sort(
                (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
            )

            sortedGames.forEach(game => {
                const keeperEntry = gamePlayers.find(
                    gp => gp.game_id === game.id && gp.player_id === keeper.id
                )
                if (!keeperEntry) return

                gamesPlayed++
                const keeperTeam = keeperEntry.team
                const gameEvents = events.filter(e => e.game_id === game.id)

                const opposingPlayerIds = new Set(
                    gamePlayers
                        .filter(gp => gp.game_id === game.id && gp.team !== keeperTeam)
                        .map(gp => gp.player_id)
                )

                const saves = gameEvents.filter(
                    e =>
                        e.event_type === 'shot_on_target' &&
                        e.related_event_id === null &&
                        opposingPlayerIds.has(e.player_id)
                ).length

                const goalsConceded = gameEvents.filter(e => {
                    if (e.event_type !== 'goal') return false
                    const override = e.team_override
                    if (override !== null) return override !== keeperTeam
                    return opposingPlayerIds.has(e.player_id)
                }).length

                totalSaves += saves
                totalConceded += goalsConceded
                if (goalsConceded === 0) cleanSheets++

                if (game.winning_team === null) return
                if (game.winning_team === 0) {
                    draws++
                    formHistory.push('D')
                } else if (game.winning_team === keeperTeam) {
                    wins++
                    formHistory.push('W')
                } else {
                    losses++
                    formHistory.push('L')
                }
            })

            const totalShots = totalSaves + totalConceded
            const savePercentage = totalShots > 0 ? Math.round((totalSaves / totalShots) * 100) : 0
            const win_rate = gamesPlayed > 0 ? Math.round((wins / gamesPlayed) * 100) : 0
            const savesPerGame = gamesPlayed > 0 ? Math.round((totalSaves / gamesPlayed) * 100) / 100 : 0
            const cleanSheetPercentage = gamesPlayed > 0 ? Math.round((cleanSheets / gamesPlayed) * 100) : 0

            return {
                player: keeper,
                games: gamesPlayed,
                saves: totalSaves,
                goalsConceded: totalConceded,
                savePercentage,
                cleanSheets,
                goalsConcededPerGame: gamesPlayed > 0 ? Math.round((totalConceded / gamesPlayed) * 100) / 100 : 0,
                wins,
                losses,
                draws,
                win_rate,
                savesPerGame,
                cleanSheetPercentage,
                form: formHistory.slice(-5),
            }
        })
        .sort((a, b) => b.savePercentage - a.savePercentage)
}