import type { PlayerStats, Player, Event } from '../../types'
import type { EventType } from '../../types'

export const MIN_GAMES = 3
export const MIN_SHOTS = 5

type NumericStatKey = {
    [K in keyof PlayerStats]: PlayerStats[K] extends number ? K : never
}[keyof PlayerStats]

export function topN(stats: PlayerStats[], key: NumericStatKey): PlayerStats[] {
    const sorted = [...stats].sort((a, b) => (b[key] as number) - (a[key] as number))
    const best = sorted[0]?.[key]
    if (best === undefined || best === 0) return []
    return sorted.filter(s => s[key] === best)
}

export function runnerUpN(stats: PlayerStats[], key: NumericStatKey): PlayerStats[] {
    const sorted = [...stats].sort((a, b) => (b[key] as number) - (a[key] as number))
    const best = sorted[0]?.[key] as number
    if (best === undefined || best === 0) return []
    const remaining = sorted.filter(s => (s[key] as number) < best)
    const secondBest = remaining[0]?.[key] as number
    if (secondBest === undefined || secondBest === 0) return []
    return remaining.filter(s => (s[key] as number) === secondBest)
}

export function bestSingleGameStat(
    eventType: EventType,
    eligibleStats: PlayerStats[],
    events: Event[],
    players: Player[],
): { winners: string[]; best: number; runnerUp?: { winners: string[]; best: number } } {
    const byGameKey = new Map<string, number>()
    events.forEach(e => {
        if (e.event_type !== eventType) return
        const player = players.find(p => p.id === e.player_id)
        if (!player || player.is_guest) return
        const key = `${e.player_id}:${e.game_id}`
        byGameKey.set(key, (byGameKey.get(key) ?? 0) + 1)
    })

    const bestByPlayer = new Map<string, number>()
    byGameKey.forEach((count, key) => {
        const playerId = key.split(':')[0]
        const current = bestByPlayer.get(playerId) ?? 0
        if (count > current) bestByPlayer.set(playerId, count)
    })

    const best = Math.max(
        0,
        ...Array.from(bestByPlayer.entries())
            .filter(([playerId]) => !players.find(p => p.id === playerId)?.is_guest)
            .map(([, count]) => count),
    )

    const winners = eligibleStats
        .filter(s => (bestByPlayer.get(s.player.id) ?? 0) === best && best > 0)
        .map(s => s.player.name)

    const secondBest = Math.max(
        0,
        ...eligibleStats
            .map(s => bestByPlayer.get(s.player.id) ?? 0)
            .filter(count => count < best),
    )
    const runnerUpWinners = secondBest > 0
        ? eligibleStats
            .filter(s => (bestByPlayer.get(s.player.id) ?? 0) === secondBest)
            .map(s => s.player.name)
        : []

    return {
        winners,
        best,
        runnerUp: runnerUpWinners.length > 0 ? { winners: runnerUpWinners, best: secondBest } : undefined,
    }
}