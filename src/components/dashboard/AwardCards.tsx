import { Link } from 'react-router-dom'
import type { PlayerStats } from '../../types'
import type { PartnershipAward } from '../../utils/awards'

interface Props {
    stats: PlayerStats[]
    partnership: PartnershipAward | null
}

interface AwardCardProps {
    emoji: string
    title: string
    name: string
    value: string
}

function AwardCard({ emoji, title, name, value }: AwardCardProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 space-y-3">
            <span className="text-2xl">{emoji}</span>
            <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">{title}</p>
                <p className="text-white font-bold text-lg mt-1">{name}</p>
                <p className="text-gray-500 text-sm">{value}</p>
            </div>
        </div>
    )
}

export default function AwardCards({ stats, partnership }: Props) {
    const topScorer = [...stats].sort((a, b) => b.goals - a.goals)[0]
    const mostAssists = [...stats].sort((a, b) => b.assists - a.assists)[0]

    if (!topScorer) return null

    return (
        <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <AwardCard
                    emoji="⚽"
                    title="Top Scorer"
                    name={topScorer.player.name}
                    value={`${topScorer.goals} goals`}
                />
                <AwardCard
                    emoji="🎯"
                    title="Most Assists"
                    name={mostAssists?.player.name ?? '—'}
                    value={`${mostAssists?.assists ?? 0} assists`}
                />
                {partnership ? (
                    <AwardCard
                        emoji="🤝"
                        title="Best Partnership"
                        name={partnership.players.join(' & ')}
                        value={partnership.value}
                    />
                ) : (
                    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 opacity-40 space-y-3">
                        <span className="text-2xl">🤝</span>
                        <div>
                            <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">Best Partnership</p>
                            <p className="text-gray-600 text-sm mt-1">Not yet</p>
                        </div>
                    </div>
                )}
            </div>
            <div className="flex justify-end">
                <Link to="/awards" className="text-gray-500 hover:text-white text-sm transition-colors">
                    View all awards →
                </Link>
            </div>
        </div>
    )
}