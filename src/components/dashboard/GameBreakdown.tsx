import { useState } from 'react'
import type { GameSummary, GoalEntry } from '../../utils/stats'

interface Props {
    summaries: GameSummary[]
}

function GoalList({ goals, align }: { goals: GoalEntry[], align: 'left' | 'right' }) {
    if (goals.length === 0) return null

    return (
        <div className={`space-y-3 ${align === 'right' ? 'text-right' : 'text-left'}`}>
            {goals.map((g, i) => (
                <div key={i}>
                    <span className="text-white text-sm font-medium">
                        ⚽ {g.scorer.is_guest ? 'Guest' : g.scorer.name}
                        {g.team_override !== null && (
                            <span className="text-gray-500 text-xs ml-1.5" title="Scored after switching teams">
                                ↔
                            </span>
                        )}
                    </span>
                    {g.assister && (
                        <p className={`text-gray-500 text-xs ${align === 'right' ? 'text-right' : 'text-left'}`}>
                            assist: {g.assister.is_guest ? 'Guest' : g.assister.name}
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
    const team1Score = current.team1Goals.length
    const team2Score = current.team2Goals.length

    return (
        <div className="space-y-3">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Game Breakdown
            </h2>

            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">

                {/* Navigation header */}
                <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
                    <button
                        onClick={() => setIndex(i => i + 1)}
                        disabled={index >= summaries.length - 1}
                        className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        ← Older
                    </button>

                    <div className="text-center space-y-1">
                        <p className="text-gray-400 text-sm">
                            {new Date(current.game.date).toLocaleDateString('en-GB', {
                                weekday: 'long',
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </p>
                        <div className="flex items-center justify-center gap-2">
                            <span className="text-gray-600 text-xs">
                                Game {summaries.length - index} of {summaries.length}
                            </span>
                            {index > 0 && (
                                <button
                                    onClick={() => setIndex(0)}
                                    className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                                >
                                    Latest →
                                </button>
                            )}
                        </div>
                    </div>

                    <button
                        onClick={() => setIndex(i => i - 1)}
                        disabled={index === 0}
                        className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
                    >
                        Newer →
                    </button>
                </div>

                {/* Score */}
                <div className="grid grid-cols-3 items-center px-6 py-5 border-b border-gray-800">
                    <p className="text-white font-semibold text-sm">Non Bibs</p>
                    <div className="flex items-center justify-center gap-3">
                        <span className={`text-3xl font-black tabular-nums ${team1Score > team2Score ? 'text-white' : 'text-gray-600'
                            }`}>
                            {team1Score}
                        </span>
                        <span className="text-gray-700 text-xl">:</span>
                        <span className={`text-3xl font-black tabular-nums ${team2Score > team1Score ? 'text-white' : 'text-gray-600'
                            }`}>
                            {team2Score}
                        </span>
                    </div>
                    <p className="text-orange-400 font-semibold text-sm text-right">🟠 Bibs</p>
                </div>

                {/* Goal lists */}
                <div className="grid grid-cols-2 gap-4 px-6 py-5">
                    <GoalList goals={current.team1Goals} align="left" />
                    <GoalList goals={current.team2Goals} align="right" />
                </div>

                {/* Edit link + dot pagination */}
                <div className="grid grid-cols-3 items-center px-5 pb-4">
                    <div />

                    <div className="flex items-center justify-center gap-1.5">
                        {[...summaries].reverse().map((_, i) => {
                            const reversedIndex = summaries.length - 1 - i
                            return (
                                <button
                                    key={i}
                                    onClick={() => setIndex(reversedIndex)}
                                    className={`rounded-full transition-all ${reversedIndex === index
                                            ? 'bg-blue-500 w-4 h-1.5'
                                            : 'bg-gray-700 hover:bg-gray-600 w-1.5 h-1.5'
                                        }`}
                                />
                            )
                        })}
                    </div>

                    <div />
                </div>

            </div>
        </div>
    )
}