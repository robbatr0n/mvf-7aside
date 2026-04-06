import type { PlayerStats, Player, Event, Game } from '../../types'
import type { Award, PartnershipAward } from './types'

export function buildMiscAwards(): Award[] {
    const celebrated: Award = {
        emoji: '🎉',
        title: 'Not Too Cool 4 Skool',
        description: 'Players that actually celebrated a goal instead of nonchalantly putting their head down',
        winners: ['Aqeel Zaman'],
        value: '',
        noWinner: false,
    }

    const hardestWorker: Award = {
        emoji: '🏃',
        title: 'Hardest Worker',
        description: 'Works the hardest and always gives 100% despite what Mark says',
        winners: ['Aqeel Zaman'],
        value: '',
        noWinner: false,
    }

    return [celebrated, hardestWorker]
}

export function buildPartnershipAward(
    eligibleStats: PlayerStats[],
    players: Player[],
    events: Event[],
    games: Game[],
): PartnershipAward | null {
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

    if (partnerships.size === 0) return null

    const sortedPartnerships = Array.from(partnerships.entries()).sort((a, b) => b[1] - a[1])
    for (const [key, count] of sortedPartnerships) {
        const [id1, id2] = key.split(':')
        const p1Player = eligibleStats.find(s => s.player.id === id1)?.player ?? players.find(p => p.id === id1)
        const p2Player = eligibleStats.find(s => s.player.id === id2)?.player ?? players.find(p => p.id === id2)
        if (p1Player && p2Player && !p1Player.is_guest && !p2Player.is_guest) {
            return {
                emoji: '🤝',
                title: 'Best Partnership',
                description: 'Most common goal + assist combination',
                players: [p1Player.name, p2Player.name],
                value: `${count} time${count > 1 ? 's' : ''}`,
            }
        }
    }
    return null
}