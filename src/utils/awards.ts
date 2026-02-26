import type { Event, Game, GamePlayer, Player, PlayerStats } from '../types'

export interface Award {
    emoji: string
    title: string
    description: string
    winners: string[]
    value: string
    noWinner?: boolean
}

export interface PartnershipAward {
    emoji: string
    title: string
    description: string
    players: string[]
    value: string
    noWinner?: boolean
}

const MIN_GAMES = 3
const MIN_SHOTS = 5

function topN(stats: PlayerStats[], key: keyof PlayerStats, n = 1): PlayerStats[] {
    const sorted = [...stats].sort((a, b) => (b[key] as number) - (a[key] as number))
    const best = sorted[0]?.[key]
    if (!best) return []
    return sorted.filter(s => s[key] === best).slice(0, n)
}

function bottomN(stats: PlayerStats[], key: keyof PlayerStats): PlayerStats[] {
    const sorted = [...stats].sort((a, b) => (a[key] as number) - (b[key] as number))
    const worst = sorted[0]?.[key]
    if (worst === undefined) return []
    return sorted.filter(s => s[key] === worst)
}

export function calculateAwards(
    stats: PlayerStats[],
    events: Event[],
    games: Game[],
    gamePlayers: GamePlayer[]
): { awards: Award[]; partnership: PartnershipAward | null } {

    const qualified = stats.filter(s => s.games_played >= MIN_GAMES)
    const shotQualified = stats.filter(s => s.shots_on_target + s.shots_off_target >= MIN_SHOTS)

    // Top Scorer
    const topScorers = topN(stats, 'goals')
    const topScorer: Award = {
        emoji: '🏆',
        title: 'Top Scorer',
        description: 'Most goals scored',
        winners: topScorers.map(s => s.player.name),
        value: `${topScorers[0]?.goals ?? 0} goals`,
        noWinner: topScorers[0]?.goals === 0,
    }

    // Playmaker
    const playmakers = topN(stats, 'assists')
    const playmaker: Award = {
        emoji: '🎯',
        title: 'Playmaker',
        description: 'Most assists',
        winners: playmakers.map(s => s.player.name),
        value: `${playmakers[0]?.assists ?? 0} assists`,
        noWinner: playmakers[0]?.assists === 0,
    }

    // Most Involved
    const involved = topN(stats, 'goal_involvements')
    const mostInvolved: Award = {
        emoji: '⭐',
        title: 'Most Involved',
        description: 'Highest goals + assists combined',
        winners: involved.map(s => s.player.name),
        value: `${involved[0]?.goal_involvements ?? 0} G+A`,
        noWinner: involved[0]?.goal_involvements === 0,
    }

    // Hat Trick Hero
    const hatTrickers = stats.filter(s => s.hat_tricks > 0)
        .sort((a, b) => b.hat_tricks - a.hat_tricks)
    const bestHatTricks = hatTrickers[0]?.hat_tricks
    const hatTrickHeroes = hatTrickers.filter(s => s.hat_tricks === bestHatTricks)
    const hatTrickHero: Award = {
        emoji: '🎩',
        title: 'Hat Trick Hero',
        description: 'Scored 3+ goals in a single game',
        winners: hatTrickHeroes.map(s => s.player.name),
        value: bestHatTricks ? `${bestHatTricks} hat trick${bestHatTricks > 1 ? 's' : ''}` : '',
        noWinner: hatTrickHeroes.length === 0,
    }

    // Chance Creator
    const creators = topN(stats, 'key_passes')
    const chanceCreator: Award = {
        emoji: '🎪',
        title: 'Chance Creator',
        description: 'Most key passes',
        winners: creators.map(s => s.player.name),
        value: `${creators[0]?.key_passes ?? 0} key passes`,
        noWinner: creators[0]?.key_passes === 0,
    }

    // Clinical — best shot conversion, min 5 shots
    const clinicalSorted = [...shotQualified].sort((a, b) => b.shot_conversion - a.shot_conversion)
    const bestConversion = clinicalSorted[0]?.shot_conversion
    const clinicalWinners = clinicalSorted.filter(s => s.shot_conversion === bestConversion)
    const clinical: Award = {
        emoji: '⚡',
        title: 'Clinical',
        description: `Best shot conversion (min ${MIN_SHOTS} shots)`,
        winners: clinicalWinners.map(s => s.player.name),
        value: bestConversion !== undefined ? `${bestConversion}% conversion` : '',
        noWinner: clinicalWinners.length === 0,
    }

    // Wasteful — worst conversion, min 5 shots
    const wastefulSorted = [...shotQualified].sort((a, b) => a.shot_conversion - b.shot_conversion)
    const worstConversion = wastefulSorted[0]?.shot_conversion
    const wastefulWinners = wastefulSorted.filter(s => s.shot_conversion === worstConversion)
    const wasteful: Award = {
        emoji: '💀',
        title: 'Wasteful',
        description: `Worst shot conversion (min ${MIN_SHOTS} shots)`,
        winners: wastefulWinners.map(s => s.player.name),
        value: worstConversion !== undefined ? `${worstConversion}% conversion` : '',
        noWinner: wastefulWinners.length === 0,
    }

    // Trigger Happy — most total shots
    const totalShots = (s: PlayerStats) => s.shots_on_target + s.shots_off_target
    const triggerSorted = [...stats]
        .filter(s => totalShots(s) > 0)
        .sort((a, b) => totalShots(b) - totalShots(a))
    const mostShots = triggerSorted[0] ? totalShots(triggerSorted[0]) : 0
    const triggerWinners = triggerSorted.filter(s => totalShots(s) === mostShots)
    const triggerHappy: Award = {
        emoji: '🔫',
        title: 'Trigger Happy',
        description: 'Most total shots',
        winners: triggerWinners.map(s => s.player.name),
        value: `${mostShots} shots`,
        noWinner: triggerWinners.length === 0,
    }

    // Reliable — best goals per game, min 3 games
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

    // Always There — most games played
    const alwaysThere: Award = {
        emoji: '🔴',
        title: 'Always There',
        description: 'Most games played',
        winners: topN(stats, 'games_played').map(s => s.player.name),
        value: `${topN(stats, 'games_played')[0]?.games_played ?? 0} games`,
        noWinner: false,
    }

    // One Game Wonder — best single game G+A
    const bestGameByPlayer = new Map<string, number>()
    events.forEach(e => {
        if (e.event_type !== 'goal' && e.event_type !== 'assist') return
        const key = `${e.player_id}:${e.game_id}`
        bestGameByPlayer.set(key, (bestGameByPlayer.get(key) ?? 0) + 1)
    })

    const bestSingleGame = new Map<string, number>()
    bestGameByPlayer.forEach((count, key) => {
        const playerId = key.split(':')[0]
        const current = bestSingleGame.get(playerId) ?? 0
        if (count > current) bestSingleGame.set(playerId, count)
    })

    const bestSingle = Math.max(0, ...Array.from(bestSingleGame.values()))
    const wonderWinners = stats
        .filter(s => (bestSingleGame.get(s.player.id) ?? 0) === bestSingle && bestSingle > 0)
        .map(s => s.player.name)

    const oneGameWonder: Award = {
        emoji: '🌟',
        title: 'One Game Wonder',
        description: 'Best single game G+A',
        winners: wonderWinners,
        value: `${bestSingle} G+A in one game`,
        noWinner: wonderWinners.length === 0,
    }

    // Winner — most wins
    const winner: Award = {
        emoji: '👑',
        title: 'Winner',
        description: 'Most wins',
        winners: topN(stats, 'wins').map(s => s.player.name),
        value: `${topN(stats, 'wins')[0]?.wins ?? 0} wins`,
        noWinner: topN(stats, 'wins')[0]?.wins === 0,
    }

    // Unbeaten — no losses, min 3 games
    const unbeatenPlayers = qualified.filter(s => s.losses === 0)
        .sort((a, b) => b.wins - a.wins)
    const mostWinsUnbeaten = unbeatenPlayers[0]?.wins
    const unbeatenWinners = unbeatenPlayers.filter(s => s.wins === mostWinsUnbeaten)
    const unbeaten: Award = {
        emoji: '😤',
        title: 'Unbeaten',
        description: `No losses (min ${MIN_GAMES} games)`,
        winners: unbeatenWinners.map(s => s.player.name),
        value: unbeatenWinners[0] ? `${unbeatenWinners[0].wins}W ${unbeatenWinners[0].draws}D` : '',
        noWinner: unbeatenWinners.length === 0,
    }

    // Unlucky — most losses
    const unlucky: Award = {
        emoji: '💔',
        title: 'Unlucky',
        description: 'Most losses',
        winners: topN(stats, 'losses').map(s => s.player.name),
        value: `${topN(stats, 'losses')[0]?.losses ?? 0} losses`,
        noWinner: topN(stats, 'losses')[0]?.losses === 0,
    }

    // Nearly Man
    const nearlyManSorted = [...stats]
        .filter(s => s.shots_on_target > s.goals)
        .sort((a, b) => (b.shots_on_target - b.goals) - (a.shots_on_target - a.goals))
    const mostSaved = nearlyManSorted[0]
        ? nearlyManSorted[0].shots_on_target - nearlyManSorted[0].goals
        : 0
    const nearlyWinners = nearlyManSorted.filter(
        s => (s.shots_on_target - s.goals) === mostSaved
    )
    const nearlyMan: Award = {
        emoji: '😬',
        title: 'Nearly Man',
        description: 'Most shots on target that were saved',
        winners: nearlyWinners.map(s => s.player.name),
        value: `${mostSaved} saved`,
        noWinner: nearlyWinners.length === 0,
    }

    // Boom or Bust — highest variance in G+A per game
    const varianceByPlayer = new Map<string, number>()
    stats.forEach(s => {
        if (s.games_played < MIN_GAMES) return
        const gaByGame: number[] = []
        games.forEach(game => {
            const played = gamePlayers.some(gp => gp.player_id === s.player.id && gp.game_id === game.id)
            if (!played) return
            const ga = events.filter(e =>
                e.player_id === s.player.id &&
                e.game_id === game.id &&
                (e.event_type === 'goal' || e.event_type === 'assist')
            ).length
            gaByGame.push(ga)
        })
        if (gaByGame.length < MIN_GAMES) return
        const mean = gaByGame.reduce((a, b) => a + b, 0) / gaByGame.length
        const variance = gaByGame.reduce((sum, v) => sum + Math.pow(v - mean, 2), 0) / gaByGame.length
        varianceByPlayer.set(s.player.id, Math.round(variance * 100) / 100)
    })

    const highestVariance = Math.max(0, ...Array.from(varianceByPlayer.values()))
    const boomBustWinners = stats
        .filter(s => (varianceByPlayer.get(s.player.id) ?? 0) === highestVariance && highestVariance > 0)
        .map(s => s.player.name)

    const boomOrBust: Award = {
        emoji: '🎰',
        title: 'Boom or Bust',
        description: `Most inconsistent performer (min ${MIN_GAMES} games)`,
        winners: boomBustWinners,
        value: `${highestVariance} variance`,
        noWinner: boomBustWinners.length === 0,
    }

    // Best Partnership — most common scorer/assister pair
    const partnerships = new Map<string, number>()
    games.forEach(game => {
        const gameEvents = events.filter(e => e.game_id === game.id)
        const goalEvents = gameEvents.filter(e => e.event_type === 'goal')
        const assistEvents = gameEvents.filter(e => e.event_type === 'assist')

        goalEvents.forEach(goal => {
            assistEvents.forEach(assist => {
                if (assist.created_at <= goal.created_at) {
                    const key = [assist.player_id, goal.player_id].sort().join(':')
                    partnerships.set(key, (partnerships.get(key) ?? 0) + 1)
                }
            })
        })
    })

    // On Fire — current scoring streak
    const streakSorted = [...stats]
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

    let bestPartnership: PartnershipAward | null = null
    if (partnerships.size > 0) {
        const bestKey = Array.from(partnerships.entries())
            .sort((a, b) => b[1] - a[1])[0]
        const [id1, id2] = bestKey[0].split(':')
        const p1 = stats.find(s => s.player.id === id1)?.player.name ?? ''
        const p2 = stats.find(s => s.player.id === id2)?.player.name ?? ''
        bestPartnership = {
            emoji: '🤝',
            title: 'Best Partnership',
            description: 'Most common goal + assist combination',
            players: [p1, p2],
            value: `${bestKey[1]} time${bestKey[1] > 1 ? 's' : ''}`,
        }
    }

    return {
        awards: [
            topScorer, playmaker, mostInvolved, hatTrickHero,
            chanceCreator, clinical, wasteful, triggerHappy,
            reliable, alwaysThere, oneGameWonder, onFire,
            winner, unbeaten, unlucky,
            nearlyMan, boomOrBust,
        ],
        partnership: bestPartnership,
    }
}