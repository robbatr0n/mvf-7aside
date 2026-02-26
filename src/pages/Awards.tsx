import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useEvents } from '../hooks/useEvents'
import { useGames } from '../hooks/useGames'
import { useGamePlayers } from '../hooks/useGamePlayers'
import { useStats } from '../hooks/useStats'
import { calculateAwards } from '../utils/awards'
import type { Award, PartnershipAward } from '../utils/awards'

function AwardCard({ award }: { award: Award }) {
    return (
        <div className={`bg-gray-900 border rounded-2xl p-6 space-y-3 flex flex-col ${award.noWinner ? 'border-gray-800 opacity-50' : 'border-gray-800'
            }`}>
            <span className="text-3xl">{award.emoji}</span>
            <div>
                <p className="text-white font-bold text-lg">{award.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{award.description}</p>
            </div>
            <div className="mt-auto pt-3 border-t border-gray-800">
                {award.noWinner ? (
                    <p className="text-gray-600 text-sm">No winner yet</p>
                ) : (
                    <>
                        <p className="text-white font-semibold">
                            {award.winners.join(' & ')}
                        </p>
                        <p className="text-gray-500 text-sm mt-0.5">{award.value}</p>
                    </>
                )}
            </div>
        </div>
    )
}

function PartnershipCard({ award }: { award: PartnershipAward }) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 flex flex-col">
            <span className="text-3xl">{award.emoji}</span>
            <div>
                <p className="text-white font-bold text-lg">{award.title}</p>
                <p className="text-gray-500 text-xs mt-0.5">{award.description}</p>
            </div>
            <div className="mt-auto pt-3 border-t border-gray-800">
                <p className="text-white font-semibold">{award.players.join(' & ')}</p>
                <p className="text-gray-500 text-sm mt-0.5">{award.value}</p>
            </div>
        </div>
    )
}

export default function Awards() {
    const { players, loading: playersLoading } = usePlayers()
    const { events, loading: eventsLoading } = useEvents()
    const { games, loading: gamesLoading } = useGames()
    const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers()
    const { stats } = useStats(players, events, games, gamePlayers)

    const { awards, partnership } = useMemo(
        () => calculateAwards(stats, events, games, gamePlayers),
        [stats, events, games, gamePlayers]
    )

    const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading

    return (
        <div className="min-h-screen bg-gray-950 text-white">

            <div className="max-w-5xl mx-auto px-6 py-10">
                <div className="flex items-center justify-between mb-10">
                    <h1 className="text-2xl font-bold text-white">Awards</h1>
                    <span className="text-gray-500 text-sm">
                        {awards.filter(a => !a.noWinner).length} active
                    </span>
                </div>
                {loading ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="h-48 bg-gray-900 rounded-2xl animate-pulse" />
                        ))}
                    </div>
                ) : (
                    <div className="space-y-10">

                        {/* Attacking */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                Attacking
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {awards.slice(0, 8).map(award => (
                                    <AwardCard key={award.title} award={award} />
                                ))}
                            </div>
                        </section>

                        {/* Consistency */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                Consistency
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {awards.slice(8, 11).map(award => (
                                    <AwardCard key={award.title} award={award} />
                                ))}
                            </div>
                        </section>

                        {/* Team */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                Team & Results
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {awards.slice(11, 14).map(award => (
                                    <AwardCard key={award.title} award={award} />
                                ))}
                            </div>
                        </section>

                        {/* Fun */}
                        <section className="space-y-4">
                            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                                Fun
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                                {awards.slice(14).map(award => (
                                    <AwardCard key={award.title} award={award} />
                                ))}
                                {partnership && (
                                    <PartnershipCard award={partnership} />
                                )}
                            </div>
                        </section>

                    </div>
                )}
            </div>
        </div>
    )
}