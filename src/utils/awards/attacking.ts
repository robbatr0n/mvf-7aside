import type { PlayerStats, Player, Event } from '../../types'
import type { Award } from './types'
import { topN, runnerUpN, bestSingleGameStat, MIN_SHOTS } from './helpers'

export function buildShootingAwards(
    eligibleStats: PlayerStats[],
    events: Event[],
    players: Player[],
): Award[] {
    const shotQualified = eligibleStats.filter(
        s => s.shots_on_target + s.shots_off_target >= MIN_SHOTS
    )

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

    const totalShots = (s: PlayerStats) => s.shots_on_target + s.shots_off_target
    const triggerSorted = [...eligibleStats].filter(s => totalShots(s) > 0).sort((a, b) => totalShots(b) - totalShots(a))
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

    const nearlyManSorted = [...eligibleStats]
        .filter(s => s.shots_on_target > s.goals)
        .sort((a, b) => b.shots_on_target - b.goals - (a.shots_on_target - a.goals))
    const mostSaved = nearlyManSorted[0] ? nearlyManSorted[0].shots_on_target - nearlyManSorted[0].goals : 0
    const nearlyWinners = nearlyManSorted.filter(s => s.shots_on_target - s.goals === mostSaved)
    const nearlyMan: Award = {
        emoji: '😬',
        title: 'Nearly Man',
        description: 'Most shots on target that were saved',
        winners: nearlyWinners.map(s => s.player.name),
        value: `${mostSaved} saved`,
        noWinner: nearlyWinners.length === 0,
    }

    const grassCutterResult = bestSingleGameStat('shot_off_target', eligibleStats, events, players)
    const grassCutter: Award = {
        emoji: '🏌️‍♀️',
        title: 'Swing and a Miss',
        description: 'Most shots off target in a single game',
        winners: grassCutterResult.winners,
        value: `${grassCutterResult.best} shots off target in one game`,
        noWinner: grassCutterResult.winners.length === 0,
    }

    return [clinical, triggerHappy, nearlyMan, grassCutter]
}

export function buildAttackingAwards(
    eligibleStats: PlayerStats[],
    events: Event[],
    players: Player[],
): Award[] {
    const topScorers = topN(eligibleStats, 'goals')
    const topScorerRunnerUps = runnerUpN(eligibleStats, 'goals')
    const topScorer: Award = {
        emoji: '🏆',
        title: 'Top Scorer',
        description: 'Most goals scored',
        winners: topScorers.map(s => s.player.name),
        value: `${topScorers[0]?.goals ?? 0} goals`,
        noWinner: !topScorers[0] || topScorers[0].goals === 0,
        runnerUp: topScorerRunnerUps.length > 0
            ? { names: topScorerRunnerUps.map(s => s.player.name), value: `${topScorerRunnerUps[0].goals} goals` }
            : undefined,
    }

    const goalMachineResult = bestSingleGameStat('goal', eligibleStats, events, players)
    const goalMachine: Award = {
        emoji: '💥',
        title: 'Goal Machine',
        description: 'Most goals in a single game',
        winners: goalMachineResult.winners,
        value: `${goalMachineResult.best} goals in one game`,
        noWinner: goalMachineResult.winners.length === 0,
        runnerUp: goalMachineResult.runnerUp
            ? { names: goalMachineResult.runnerUp.winners, value: `${goalMachineResult.runnerUp.best} goals in one game` }
            : undefined,
    }

    const playmakers = topN(eligibleStats, 'assists')
    const playmakersRunnerUps = runnerUpN(eligibleStats, 'assists')
    const playmaker: Award = {
        emoji: '🎯',
        title: 'Playmaker',
        description: 'Most assists',
        winners: playmakers.map(s => s.player.name),
        value: `${playmakers[0]?.assists ?? 0} assists`,
        noWinner: !playmakers[0] || playmakers[0].assists === 0,
        runnerUp: playmakersRunnerUps.length > 0
            ? { names: playmakersRunnerUps.map(s => s.player.name), value: `${playmakersRunnerUps[0].assists} assists` }
            : undefined,
    }

    const assistHeroResult = bestSingleGameStat('assist', eligibleStats, events, players)
    const assistHero: Award = {
        emoji: '🪄',
        title: 'Assist Hero',
        description: 'Most assists in a single game',
        winners: assistHeroResult.winners,
        value: `${assistHeroResult.best} assists in one game`,
        noWinner: assistHeroResult.winners.length === 0,
        runnerUp: assistHeroResult.runnerUp
            ? { names: assistHeroResult.runnerUp.winners, value: `${assistHeroResult.runnerUp.best} assists in one game` }
            : undefined,
    }

    const involved = topN(eligibleStats, 'goal_involvements')
    const involvedRunnerUps = runnerUpN(eligibleStats, 'goal_involvements')
    const mostInvolved: Award = {
        emoji: '⭐',
        title: 'Most Involved',
        description: 'Highest goals + assists combined',
        winners: involved.map(s => s.player.name),
        value: `${involved[0]?.goal_involvements ?? 0} G+A`,
        noWinner: !involved[0] || involved[0].goal_involvements === 0,
        runnerUp: involvedRunnerUps.length > 0
            ? { names: involvedRunnerUps.map(s => s.player.name), value: `${involvedRunnerUps[0].goal_involvements} G+A` }
            : undefined,
    }

    const bestGameByPlayer = new Map<string, number>()
    events.forEach(e => {
        if (e.event_type !== 'goal' && e.event_type !== 'assist') return
        const player = players.find(p => p.id === e.player_id)
        if (!player || player.is_guest) return
        const key = `${e.player_id}:${e.game_id}`
        bestGameByPlayer.set(key, (bestGameByPlayer.get(key) ?? 0) + 1)
    })
    const bestSingleGA = new Map<string, number>()
    bestGameByPlayer.forEach((count, key) => {
        const playerId = key.split(':')[0]
        const current = bestSingleGA.get(playerId) ?? 0
        if (count > current) bestSingleGA.set(playerId, count)
    })
    const eligibleEntries = Array.from(bestSingleGA.entries())
        .filter(([playerId]) => !players.find(p => p.id === playerId)?.is_guest)
    const bestSingle = Math.max(0, ...eligibleEntries.map(([, count]) => count))
    const wonderWinners = eligibleStats
        .filter(s => (bestSingleGA.get(s.player.id) ?? 0) === bestSingle && bestSingle > 0)
        .map(s => s.player.name)
    const secondBestSingle = Math.max(0, ...eligibleEntries.filter(([, c]) => c < bestSingle).map(([, c]) => c))
    const wonderRunnerUps = secondBestSingle > 0
        ? eligibleStats.filter(s => (bestSingleGA.get(s.player.id) ?? 0) === secondBestSingle).map(s => s.player.name)
        : []
    const oneGameWonder: Award = {
        emoji: '💫',
        title: 'One Game Wonder',
        description: 'Best single game G+A',
        winners: wonderWinners,
        value: `${bestSingle} G+A in one game`,
        noWinner: wonderWinners.length === 0,
        runnerUp: wonderRunnerUps.length > 0
            ? { names: wonderRunnerUps, value: `${secondBestSingle} G+A in one game` }
            : undefined,
    }

    const creators = topN(eligibleStats, 'key_passes')
    const creatorsRunnerUps = runnerUpN(eligibleStats, 'key_passes')
    const chanceCreator: Award = {
        emoji: '🎪',
        title: 'Chance Creator',
        description: 'Most key passes',
        winners: creators.map(s => s.player.name),
        value: `${creators[0]?.key_passes ?? 0} key passes`,
        noWinner: !creators[0] || creators[0].key_passes === 0,
        runnerUp: creatorsRunnerUps.length > 0
            ? { names: creatorsRunnerUps.map(s => s.player.name), value: `${creatorsRunnerUps[0].key_passes} key passes` }
            : undefined,
    }

    const keyPassHeroResult = bestSingleGameStat('key_pass', eligibleStats, events, players)
    const keyPassHero: Award = {
        emoji: '🔑',
        title: 'Key Pass Hero',
        description: 'Most key passes in a single game',
        winners: keyPassHeroResult.winners,
        value: `${keyPassHeroResult.best} key passes in one game`,
        noWinner: keyPassHeroResult.winners.length === 0,
        runnerUp: keyPassHeroResult.runnerUp
            ? { names: keyPassHeroResult.runnerUp.winners, value: `${keyPassHeroResult.runnerUp.best} key passes in one game` }
            : undefined,
    }

    const hatTrickers = eligibleStats
        .filter(s => s.hat_tricks > 0)
        .sort((a, b) => b.hat_tricks - a.hat_tricks)
    const bestHatTricks = hatTrickers[0]?.hat_tricks
    const hatTrickHeroes = hatTrickers.filter(s => s.hat_tricks === bestHatTricks)
    const htRunnerUpSorted = hatTrickers.filter(s => s.hat_tricks < (bestHatTricks ?? 0))
    const secondHT = htRunnerUpSorted[0]?.hat_tricks
    const hatTrickHero: Award = {
        emoji: '🎩',
        title: 'Hat Trick Hero',
        description: 'Scored 3+ goals in a single game',
        winners: hatTrickHeroes.map(s => s.player.name),
        value: bestHatTricks ? `${bestHatTricks} hat trick${bestHatTricks > 1 ? 's' : ''}` : '',
        noWinner: hatTrickHeroes.length === 0,
        runnerUp: secondHT !== undefined
            ? { names: htRunnerUpSorted.filter(s => s.hat_tricks === secondHT).map(s => s.player.name), value: `${secondHT} hat trick${secondHT > 1 ? 's' : ''}` }
            : undefined,
    }

    return [topScorer, goalMachine, playmaker, assistHero, mostInvolved, oneGameWonder, chanceCreator, keyPassHero, hatTrickHero]
}