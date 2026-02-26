import type { PlayerStats } from '../../types'
import { Link } from 'react-router-dom'

interface Props {
    stats: PlayerStats[]
    hatTrickHero: PlayerStats | null
}

interface AwardCardProps {
    emoji: string
    title: string
    playerName: string
    value: string | number
    subtitle: string
}

function AwardCard({ emoji, title, playerName, value, subtitle }: AwardCardProps) {
    return (
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 flex flex-col">
            <span className="text-2xl">{emoji}</span>
            <div>
                <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest">{title}</p>
                <p className="text-white text-xl font-bold mt-1">{playerName}</p>
            </div>
            <div className="mt-auto pt-2 border-t border-gray-800">
                <span className="text-white font-semibold text-lg">{value}</span>
                <span className="text-gray-500 text-sm ml-1">{subtitle}</span>
            </div>
        </div>
    )
}

export default function AwardCards({ stats }: Props) {
    if (stats.length === 0) return null

    const topScorer = [...stats].sort((a, b) => b.goals - a.goals)[0]
    const mostAssists = [...stats].sort((a, b) => b.assists - a.assists)[0]
    const mostInvolvements = [...stats].sort((a, b) => b.goal_involvements - a.goal_involvements)[0]

    return (
        <>        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <AwardCard
                emoji="⚽"
                title="Top Scorer"
                playerName={topScorer.player.name}
                value={topScorer.goals}
                subtitle={topScorer.goals === 1 ? 'goal' : 'goals'}
            />
            <AwardCard
                emoji="🎯"
                title="Most Assists"
                playerName={mostAssists.player.name}
                value={mostAssists.assists}
                subtitle={mostAssists.assists === 1 ? 'assist' : 'assists'}
            />
            <AwardCard
                emoji="🔥"
                title="Most Involvements"
                playerName={mostInvolvements.player.name}
                value={mostInvolvements.goal_involvements}
                subtitle="G+A"
            />
        </div>
            <div className="flex justify-end">
                <Link
                    to="/awards"
                    className="text-gray-500 hover:text-white text-sm transition-colors"
                >
                    View all awards →
                </Link>
            </div></>

    )
}