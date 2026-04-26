import type { PlayerStats, Player, Event } from '../../types'
import type { Award } from './types'
import { topN, runnerUpN, bestSingleGameStat } from './helpers'

const MIN_PASS_ATTEMPTS = 15

export function buildPassingAwards(
    eligibleStats: PlayerStats[],
    events: Event[],
    players: Player[],
): Award[] {
    // Most passes completed
    const metronomeWinners = topN(eligibleStats, 'passes_completed')
    const metronomeRunnerUps = runnerUpN(eligibleStats, 'passes_completed')
    const metronome: Award = {
        emoji: '🎯',
        title: 'The Metronome',
        description: 'Most passes completed',
        winners: metronomeWinners.map(s => s.player.name),
        value: `${metronomeWinners[0]?.passes_completed ?? 0} passes`,
        noWinner: metronomeWinners.length === 0,
        runnerUp: metronomeRunnerUps.length > 0
            ? { names: metronomeRunnerUps.map(s => s.player.name), value: `${metronomeRunnerUps[0].passes_completed} passes` }
            : undefined,
    }

    // Best pass accuracy (min attempts)
    const accQualified = [...eligibleStats].filter(s => s.pass_attempts >= MIN_PASS_ATTEMPTS)
        .sort((a, b) => b.pass_accuracy - a.pass_accuracy)
    const bestAcc = accQualified[0]?.pass_accuracy
    const silkWinners = accQualified.filter(s => s.pass_accuracy === bestAcc)
    const silkSecondAcc = accQualified.find(s => s.pass_accuracy < (bestAcc ?? 0))?.pass_accuracy
    const silk: Award = {
        emoji: '🪡',
        title: 'Silk',
        description: `Best pass accuracy (min ${MIN_PASS_ATTEMPTS} attempts)`,
        winners: silkWinners.map(s => s.player.name),
        value: bestAcc !== undefined ? `${bestAcc}% accuracy` : '',
        noWinner: silkWinners.length === 0,
        runnerUp: silkSecondAcc !== undefined
            ? { names: accQualified.filter(s => s.pass_accuracy === silkSecondAcc).map(s => s.player.name), value: `${silkSecondAcc}%` }
            : undefined,
    }

    // Most passes in a single game
    const passMachineResult = bestSingleGameStat('pass_completed', eligibleStats, events, players)
    const passMachine: Award = {
        emoji: '⚙️',
        title: 'Pass Machine',
        description: 'Most passes completed in a single game',
        winners: passMachineResult.winners,
        value: `${passMachineResult.best} passes in one game`,
        noWinner: passMachineResult.winners.length === 0,
        runnerUp: passMachineResult.runnerUp
            ? { names: passMachineResult.runnerUp.winners, value: `${passMachineResult.runnerUp.best} passes in one game` }
            : undefined,
    }

    // Best passes per game rate
    const rateEligible = eligibleStats.filter(s => s.pass_attempts > 0)
    const conveyorWinners = topN(rateEligible, 'passes_per_game')
    const conveyorRunnerUps = runnerUpN(rateEligible, 'passes_per_game')
    const conveyor: Award = {
        emoji: '🔄',
        title: 'Conveyor Belt',
        description: 'Most passes completed per game',
        winners: conveyorWinners.map(s => s.player.name),
        value: conveyorWinners[0] ? `${conveyorWinners[0].passes_per_game} passes/game` : '',
        noWinner: conveyorWinners.length === 0,
        runnerUp: conveyorRunnerUps.length > 0
            ? { names: conveyorRunnerUps.map(s => s.player.name), value: `${conveyorRunnerUps[0].passes_per_game} passes/game` }
            : undefined,
    }

    return [metronome, silk, passMachine, conveyor]
}
