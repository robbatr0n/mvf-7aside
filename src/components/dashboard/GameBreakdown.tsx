import { useState } from 'react'
import type { GameSummary, GoalEntry } from '../../utils/stats'

interface Props {
    summaries: GameSummary[]
}

function GoalList({ goals, align }: { goals: GoalEntry[], align: 'left' | 'right' }) {
    if (goals.length === 0) return null

    return (
        <div className={`space-y-1 ${align === 'right' ? 'text-right' : 'text-left'}`}>
            {goals.map((g, i) => (
                <div key={i}>
                    <span className="text-white text-sm font-medium">
                        ⚽ {g.scorer.name}
                    </span>
                    {g.assister && (
                        <p className={`text-gray-500 text-xs ${align === 'right' ? 'text-right' : 'text-left'}`}>
                            assist: {g.assister.name}
                        </p>
                    )}
                </div>
            ))}
        </div>
    )
}

export default function GameBreakdown({ summaries }: Props) {
    const [index, setIndex] = useState(0)

    if (summaries.length === 0) return null

    const current = summaries[index]
    const { game, team1Goals, team2Goals } = current

    const winningTeam = game.winning_team
    const team1Won = winningTeam === 1
    const team2Won = winningTeam === 2

    return (
        <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Game History
            </h2>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

                {/* Date + navigation */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                    <button
                        onClick={() => setIndex(i => i + 1)}
                        disabled={index >= summaries.length - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        ← Older
                    </button>
                    <div className="text-center">
                        <p className="text-gray-400 text-sm">
                            {new Date(game.date).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                        <p className="text-gray-600 text-xs mt-0.5">
                            Game {summaries.length - index} of {summaries.length}
                        </p>
                    </div>
                    <button
                        onClick={() => setIndex(i => i - 1)}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        Newer →
                    </button>
                </div>

                {/* Match result */}
                <div className="px-6 py-6">

                    {/* Score row */}
                    <div className="grid grid-cols-3 items-center gap-4 mb-6">

                        {/* Team 1 */}
                        <div className="text-left">
                            <p className={`font-bold text-base ${team1Won ? 'text-white' : 'text-gray-400'}`}>
                                Non Bibs
                            </p>
                        </div>

                        {/* Score */}
                        <div className="flex items-center justify-center gap-3">
                            <span className={`text-4xl font-black tabular-nums ${team1Won ? 'text-white' : 'text-gray-500'
                                }`}>
                                {team1Goals.length}
                            </span>
                            <span className="text-gray-700 text-2xl font-light">:</span>
                            <span className={`text-4xl font-black tabular-nums ${team2Won ? 'text-white' : 'text-gray-500'
                                }`}>
                                {team2Goals.length}
                            </span>
                        </div>

                        {/* Team 2 */}
                        <div className="text-right">
                            <p className={`font-bold text-base ${team2Won ? 'text-white' : 'text-gray-400'}`}>
                                Bibs
                            </p>
                        </div>
                    </div>

                    {/* Goal scorers */}
                    {(team1Goals.length > 0 || team2Goals.length > 0) && (
                        <div className="grid grid-cols-2 gap-6 pt-4 border-t border-gray-800">
                            <GoalList goals={team1Goals} align="left" />
                            <GoalList goals={team2Goals} align="right" />
                        </div>
                    )}

                    {team1Goals.length === 0 && team2Goals.length === 0 && (
                        <p className="text-center text-gray-600 text-sm">No goals tagged</p>
                    )}
                </div>

                {/* Dot navigation */}
                {summaries.length > 1 && (
                    <div className="flex items-center justify-center gap-1.5 pb-4">
                        {summaries.map((_, i) => (
                            <button
                                key={i}
                                onClick={() => setIndex(i)}
                                className={`rounded-full transition-all ${i === index
                                        ? 'bg-blue-500 w-4 h-1.5'
                                        : 'bg-gray-700 hover:bg-gray-600 w-1.5 h-1.5'
                                    }`}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}