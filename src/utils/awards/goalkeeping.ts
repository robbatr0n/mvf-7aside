import type { GoalkeeperStats, Event, GamePlayer } from '../../types'
import type { Award } from './types'

export function buildGoalkeepingAwards(
    goalkeeperStats: GoalkeeperStats[],
    events: Event[],
    gamePlayers: GamePlayer[],
): Award[] {
    const wallWinners = goalkeeperStats.length > 0
        ? goalkeeperStats.filter(g => g.savePercentage === Math.max(...goalkeeperStats.map(g => g.savePercentage)))
        : []
    const theWall: Award = {
        emoji: '🧱',
        title: 'The Wall',
        description: 'Best save percentage',
        winners: wallWinners.map(g => g.player.name),
        value: wallWinners[0] ? `${wallWinners[0].savePercentage}% saves` : '',
        noWinner: wallWinners.length === 0,
    }

    const cleanSheetWinners = goalkeeperStats.length > 0
        ? goalkeeperStats.filter(g =>
            g.cleanSheets === Math.max(...goalkeeperStats.map(g => g.cleanSheets)) && g.cleanSheets > 0
        )
        : []
    const stoneCold: Award = {
        emoji: '🔒',
        title: 'Stone Cold',
        description: 'Most clean sheets',
        winners: cleanSheetWinners.map(g => g.player.name),
        value: cleanSheetWinners[0]
            ? `${cleanSheetWinners[0].cleanSheets} clean sheet${cleanSheetWinners[0].cleanSheets !== 1 ? 's' : ''}`
            : '',
        noWinner: cleanSheetWinners.length === 0,
    }

    const savesByGame = new Map<string, number>()
    events.forEach(e => {
        if (e.event_type !== 'shot_on_target' || e.related_event_id !== null) return
        const keeper = goalkeeperStats.find(g => {
            const kEntry = gamePlayers.find(gp => gp.game_id === e.game_id && gp.player_id === g.player.id)
            if (!kEntry) return false
            const opposingIds = new Set(
                gamePlayers.filter(gp => gp.game_id === e.game_id && gp.team !== kEntry.team).map(gp => gp.player_id)
            )
            return opposingIds.has(e.player_id)
        })
        if (!keeper) return
        const key = `${keeper.player.id}:${e.game_id}`
        savesByGame.set(key, (savesByGame.get(key) ?? 0) + 1)
    })

    const bestSavesByPlayer = new Map<string, number>()
    savesByGame.forEach((count, key) => {
        const playerId = key.split(':')[0]
        const current = bestSavesByPlayer.get(playerId) ?? 0
        if (count > current) bestSavesByPlayer.set(playerId, count)
    })

    const topSaves = Math.max(0, ...Array.from(bestSavesByPlayer.values()))
    const superheroWinners = goalkeeperStats.filter(
        g => (bestSavesByPlayer.get(g.player.id) ?? 0) === topSaves && topSaves > 0
    )
    const superhero: Award = {
        emoji: '🦸',
        title: 'Superhero',
        description: 'Most saves in a single game',
        winners: superheroWinners.map(g => g.player.name),
        value: `${topSaves} saves in one game`,
        noWinner: superheroWinners.length === 0,
    }

    return [theWall, stoneCold, superhero]
}