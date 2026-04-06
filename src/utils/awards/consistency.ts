import type { PlayerStats, Player, Event, Game } from '../../types'
import type { Award, PartnershipAward } from './types'
import { MIN_GAMES } from './helpers'

export function buildConsistencyAwards(
    eligibleStats: PlayerStats[],
    qualified: PlayerStats[],
    totwAppearances: Map<string, number>,
    players: Player[],
    events: Event[],
    games: Game[],
): { awards: Award[]; partnership: PartnershipAward | null } {
    const reliableSorted = [...qualified].sort((a, b) => b.goals_per_game - a.goals_per_game)
    const bestGPG = reliableSorted[0]?.goals_per_game
    const reliableWinners = reliableSorted.filter(s => s.goals_per_game === bestGPG)
    const reliable: Award = {
        emoji: '📈',
        title: 'Reliable',
        description: `Best goals per game (min ${MIN_GAMES} games)`,
        winners: reliableWinners.map(s => s.player.name),
        value: bestGPG !== undefined ? `${bestGPG} per game` : '',
        noWinner: reliableWinners.length === 0,
    }

    const maxGames = Math.max(0, ...eligibleStats.map(s => s.games_played))
    const alwaysThereWinners = eligibleStats.filter(s => s.games_played === maxGames)
    const alwaysThere: Award = {
        emoji: '🔴',
        title: 'Always There',
        description: 'Most games played',
        winners: alwaysThereWinners.map(s => s.player.name),
        value: `${maxGames} games`,
        noWinner: alwaysThereWinners.length === 0,
    }

    const streakSorted = [...eligibleStats]
        .filter(s => s.current_scoring_streak > 0)
        .sort((a, b) => b.current_scoring_streak - a.current_scoring_streak)
    const bestStreak = streakSorted[0]?.current_scoring_streak ?? 0
    const streakWinners = streakSorted.filter(s => s.current_scoring_streak === bestStreak)
    const onFire: Award = {
        emoji: '🔥',
        title: 'On Fire',
        description: 'Longest current scoring streak',
        winners: streakWinners.map(s => s.player.name),
        value: `${bestStreak} game${bestStreak !== 1 ? 's' : ''} in a row`,
        noWinner: streakWinners.length === 0,
    }

    const topTotwCount = Math.max(0, ...Array.from(totwAppearances.values()))
    const totwKingWinners = eligibleStats
        .filter(s => (totwAppearances.get(s.player.id) ?? 0) === topTotwCount && topTotwCount > 0)
        .map(s => s.player.name)
    const totwKing: Award = {
        emoji: '🏅',
        title: 'TOTW King',
        description: 'Most Team of the Week appearances',
        winners: totwKingWinners,
        value: `${topTotwCount} appearance${topTotwCount !== 1 ? 's' : ''}`,
        noWinner: totwKingWinners.length === 0,
    }

    const winnerSorted = [...eligibleStats].sort((a, b) => b.wins - a.wins)
    const mostWins = winnerSorted[0]?.wins ?? 0
    const winnerWinners = winnerSorted.filter(s => s.wins === mostWins)
    const winner: Award = {
        emoji: '👑',
        title: 'Winner',
        description: 'Most wins',
        winners: winnerWinners.map(s => s.player.name),
        value: `${mostWins} wins`,
        noWinner: !winnerWinners[0] || mostWins === 0,
    }

    const unluckySorted = [...eligibleStats].sort((a, b) => b.losses - a.losses)
    const mostLosses = unluckySorted[0]?.losses ?? 0
    const unluckyWinners = unluckySorted.filter(s => s.losses === mostLosses)
    const unlucky: Award = {
        emoji: '💔',
        title: 'Unlucky',
        description: 'Most losses',
        winners: unluckyWinners.map(s => s.player.name),
        value: `${mostLosses} losses`,
        noWinner: !unluckyWinners[0] || mostLosses === 0,
    }

    const hardestWorker: Award = {
        emoji: '🏃',
        title: 'Hardest Worker',
        description: 'Works the hardest and always gives 100% despite what Mark says',
        winners: ['Aqeel Zaman'],
        value: '',
        noWinner: false,
    }

    const partnerships = new Map<string, number>()
    games.forEach(game => {
        const gameEvents = events.filter(e => e.game_id === game.id)
        const goalEvents = gameEvents.filter(e => e.event_type === 'goal')
        goalEvents.forEach(goal => {
            const assistEvent = gameEvents.find(
                e => e.event_type === 'assist' && e.related_event_id === goal.id
            )
            if (!assistEvent) return
            if (assistEvent.player_id === goal.player_id) return
            const scorerPlayer = players.find(p => p.id === goal.player_id)
            const assisterPlayer = players.find(p => p.id === assistEvent.player_id)
            if (!scorerPlayer || !assisterPlayer) return
            if (scorerPlayer.is_guest || assisterPlayer.is_guest) return
            const key = [goal.player_id, assistEvent.player_id].sort().join(':')
            partnerships.set(key, (partnerships.get(key) ?? 0) + 1)
        })
    })

    let bestPartnership: PartnershipAward | null = null
    if (partnerships.size > 0) {
        const sortedPartnerships = Array.from(partnerships.entries()).sort((a, b) => b[1] - a[1])
        for (const [key, count] of sortedPartnerships) {
            const [id1, id2] = key.split(':')
            const p1Player = eligibleStats.find(s => s.player.id === id1)?.player ?? players.find(p => p.id === id1)
            const p2Player = eligibleStats.find(s => s.player.id === id2)?.player ?? players.find(p => p.id === id2)
            if (p1Player && p2Player && !p1Player.is_guest && !p2Player.is_guest) {
                bestPartnership = {
                    emoji: '🤝',
                    title: 'Best Partnership',
                    description: 'Most common goal + assist combination',
                    players: [p1Player.name, p2Player.name],
                    value: `${count} time${count > 1 ? 's' : ''}`,
                }
                break
            }
        }
    }

    return {
        awards: [reliable, alwaysThere, onFire, totwKing, winner, unlucky, hardestWorker],
        partnership: bestPartnership,
    }
}