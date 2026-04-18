import type { Event, Game, GamePlayer, Player, PlayerStats } from '../../types'

export function calculatePlayerStats(
    player: Player,
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): PlayerStats {
    const playerEvents = events.filter(e => e.player_id === player.id)

    const goals = playerEvents.filter(e => e.event_type === 'goal').length
    const assists = playerEvents.filter(e => e.event_type === 'assist').length
    const key_passes = playerEvents.filter(e => e.event_type === 'key_pass').length
    const shots_on_target = playerEvents.filter(e => e.event_type === 'shot_on_target').length
    const shots_off_target = playerEvents.filter(e => e.event_type === 'shot_off_target').length
    const total_shots = shots_on_target + shots_off_target
    const shot_accuracy = total_shots > 0 ? Math.round((shots_on_target / total_shots) * 100) : 0
    const shot_conversion = total_shots > 0 ? Math.round((goals / total_shots) * 100) : 0

    const playerGameEntries = gamePlayers.filter(gp => gp.player_id === player.id)
    const games_played = playerGameEntries.length
    const goals_per_game = games_played > 0 ? Math.round((goals / games_played) * 100) / 100 : 0
    const key_passes_per_game = games_played > 0 ? Math.round((key_passes / games_played) * 100) / 100 : 0

    const goalsByGame = new Map<string, number>()
    playerEvents
        .filter(e => e.event_type === 'goal')
        .forEach(e => {
            goalsByGame.set(e.game_id, (goalsByGame.get(e.game_id) ?? 0) + 1)
        })
    const hat_tricks = Array.from(goalsByGame.values()).filter(g => g >= 3).length

    const tackles = playerEvents.filter(e => e.event_type === 'tackle').length
    const interceptions = playerEvents.filter(e => e.event_type === 'interception').length
    const defensive_actions = tackles + interceptions
    const tackles_per_game = games_played > 0 ? Math.round((tackles / games_played) * 100) / 100 : 0
    const interceptions_per_game = games_played > 0 ? Math.round((interceptions / games_played) * 100) / 100 : 0
    const defensive_actions_per_game = games_played > 0 ? Math.round((defensive_actions / games_played) * 100) / 100 : 0

    let wins = 0
    let losses = 0
    let draws = 0
    playerGameEntries.forEach(entry => {
        const game = games.find(g => g.id === entry.game_id)
        if (!game || game.winning_team === null) return
        if (game.winning_team === 0) draws++
        else if (game.winning_team === entry.team) wins++
        else losses++
    })

    const goal_involvements = goals + assists
    const win_rate = games_played > 0 ? Math.round((wins / games_played) * 100) : 0

    const playerGames = gamePlayers
        .filter(gp => gp.player_id === player.id)
        .map(gp => {
            const game = games.find(g => g.id === gp.game_id)
            return game ? { game, team: gp.team } : null
        })
        .filter(Boolean) as { game: Game; team: number }[]

    const sortedPlayerGames = playerGames.sort(
        (a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime()
    )

    const form: ('W' | 'L' | 'D')[] = sortedPlayerGames
        .slice(0, 5)
        .map(({ game, team }) => {
            if (game.winning_team === null) return null
            if (game.winning_team === 0) return 'D'
            return game.winning_team === team ? 'W' : 'L'
        })
        .filter(Boolean) as ('W' | 'L' | 'D')[]

    const gamesChronological = [...sortedPlayerGames].reverse()
    let best_scoring_streak = 0
    let streak = 0
    gamesChronological.forEach(({ game }) => {
        const scored = events.some(
            e => e.player_id === player.id && e.game_id === game.id && e.event_type === 'goal'
        )
        if (scored) {
            streak++
            if (streak > best_scoring_streak) best_scoring_streak = streak
        } else {
            streak = 0
        }
    })

    let current_scoring_streak = 0
    for (const { game } of sortedPlayerGames) {
        const scored = events.some(
            e => e.player_id === player.id && e.game_id === game.id && e.event_type === 'goal'
        )
        if (scored) current_scoring_streak++
        else break
    }

    return {
        player,
        goals,
        assists,
        key_passes,
        shots_on_target,
        shots_off_target,
        shot_accuracy,
        shot_conversion,
        goal_involvements,
        games_played,
        goals_per_game,
        key_passes_per_game,
        hat_tricks,
        wins,
        losses,
        draws,
        win_rate,
        form,
        current_scoring_streak,
        best_scoring_streak,
        tackles,
        interceptions,
        defensive_actions,
        tackles_per_game,
        interceptions_per_game,
        defensive_actions_per_game,
    }
}

export function calculateAllPlayerStats(
    players: Player[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
): PlayerStats[] {
    return players
        .filter(p => !p.is_guest && !p.is_goalkeeper)
        .map(player => calculatePlayerStats(player, events, games, gamePlayers))
        .sort((a, b) => b.goals - a.goals)
}

export function calculateLastNPlayerStats(
    players: Player[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[],
    n: number,
): PlayerStats[] {
    return players
        .filter(p => !p.is_guest && !p.is_goalkeeper)
        .map(player => {
            const playerGameEntries = gamePlayers
                .filter(gp => gp.player_id === player.id)
                .map(gp => {
                    const game = games.find(g => g.id === gp.game_id)
                    return game ? { game, team: gp.team, game_id: gp.game_id } : null
                })
                .filter(Boolean) as { game: Game; team: number; game_id: string }[]

            const lastNEntries = [...playerGameEntries]
                .sort((a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime())
                .slice(0, n)

            const lastNGameIds = new Set(lastNEntries.map(e => e.game_id))

            const filteredEvents = events.filter(
                e => e.player_id === player.id && lastNGameIds.has(e.game_id)
            )
            const filteredGamePlayers = gamePlayers.filter(
                gp => gp.player_id === player.id && lastNGameIds.has(gp.game_id)
            )

            return calculatePlayerStats(player, filteredEvents, games, filteredGamePlayers)
        })
        .filter(s => s.games_played > 0)
        .sort((a, b) => b.goal_involvements - a.goal_involvements)
}