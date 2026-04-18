import { useMemo } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, Tooltip, ResponsiveContainer,
} from 'recharts'
import type { PlayerGameStats } from '../../utils/stats'
import type { GKGameBreakdown } from '../../utils/stats'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  gameBreakdown: PlayerGameStats[]
  gkBreakdown?: GKGameBreakdown[]
  isGoalkeeper: boolean
}

function rollingAvg(data: number[], i: number, window = 3): number {
  const start = Math.max(0, i - window + 1)
  const slice = data.slice(start, i + 1)
  return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
}

export default function PlayerCharts({ gameBreakdown, gkBreakdown, isGoalkeeper }: Props) {
  const { isDark } = useTheme()

  const colors = {
    bar: isDark ? 'rgba(22,163,74,0.35)' : 'rgba(22,163,74,0.25)',
    line: '#16a34a',
    attack: isDark ? 'rgba(22,163,74,0.7)' : 'rgba(22,163,74,0.6)',
    defend: isDark ? 'rgba(59,130,246,0.65)' : 'rgba(59,130,246,0.55)',
    grid: isDark ? '#2a2e31' : '#D4D3D0',
    muted: isDark ? '#9CA3AF' : '#6b7280',
    tooltipBg: isDark ? '#111518' : '#ffffff',
    tooltipBorder: isDark ? '#2a2e31' : '#D4D3D0',
    tooltipText: isDark ? '#E5E6E3' : '#1C1C1C',
    trackBg: isDark ? '#1a1e21' : '#f3f4f6',
  }

  const outfieldData = useMemo(() => {
    if (isGoalkeeper) return []
    const chrono = [...gameBreakdown].reverse()
    const scores = chrono.map(g =>
      g.goals * 4 + g.assists * 2.5 + g.shots_on_target * 0.5 + g.key_passes * 0.5 + g.tackles + g.interceptions
    )
    return chrono.map((g, i) => ({
      date: new Date(g.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      score: Math.round(scores[i] * 10) / 10,
      rolling: rollingAvg(scores, i),
    }))
  }, [gameBreakdown, isGoalkeeper])

  const gkData = useMemo(() => {
    if (!isGoalkeeper || !gkBreakdown) return []
    const saves = gkBreakdown.map(g => g.saves)
    return gkBreakdown.map((g, i) => ({
      date: new Date(g.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      score: g.saves,
      rolling: rollingAvg(saves, i),
    }))
  }, [gkBreakdown, isGoalkeeper])

  const splitData = useMemo(() => {
    if (isGoalkeeper) return []
    const attacking = gameBreakdown.reduce(
      (sum, g) => sum + g.goals * 4 + g.assists * 2.5 + g.shots_on_target * 0.5 + g.key_passes * 0.5, 0
    )
    const defending = gameBreakdown.reduce((sum, g) => sum + g.tackles + g.interceptions, 0)
    return [
      { name: 'Attacking', value: Math.round(attacking * 10) / 10, color: colors.attack },
      { name: 'Defending', value: defending, color: colors.defend },
    ]
  }, [gameBreakdown, isGoalkeeper, colors.attack, colors.defend])

  const chartData = isGoalkeeper ? gkData : outfieldData

  if (chartData.length < 2) return null

  const maxSplit = Math.max(...splitData.map(d => d.value), 1)
  const hasSplit = !isGoalkeeper && (splitData[0]?.value > 0 || splitData[1]?.value > 0)

  return (
    <section className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Performance</h2>
      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-5 space-y-6">

        {/* Performance line chart */}
        <div>
          <div className="flex items-center gap-4 mb-3">
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
              {isGoalkeeper ? 'Saves per game' : 'Composite score per game'}
            </p>
            <div className="flex items-center gap-3 ml-auto">
              <span className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-[#9CA3AF]">
                <span className="inline-block w-3 h-3 rounded-sm" style={{ background: colors.bar }} />
                Game
              </span>
              <span className="flex items-center gap-1.5 text-xs" style={{ color: colors.line }}>
                <span className="inline-block w-4 border-t-2" style={{ borderColor: colors.line }} />
                3-game avg
              </span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={140}>
            <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10, fill: colors.muted }}
                tickLine={false}
                axisLine={{ stroke: colors.grid }}
                interval="preserveStartEnd"
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div
                      style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                      className="rounded-xl px-3 py-2 text-xs space-y-1 shadow-md"
                    >
                      <p style={{ color: colors.muted }}>{label}</p>
                      <p style={{ color: colors.tooltipText }}>
                        {isGoalkeeper ? 'Saves' : 'Score'}:{' '}
                        <span className="font-semibold">{payload[0]?.value}</span>
                      </p>
                      {payload[1] && (
                        <p style={{ color: colors.line }}>
                          3-game avg: <span className="font-semibold">{payload[1]?.value}</span>
                        </p>
                      )}
                    </div>
                  )
                }}
              />
              <Bar dataKey="score" fill={colors.bar} radius={[3, 3, 0, 0]} />
              <Line
                type="monotone"
                dataKey="rolling"
                stroke={colors.line}
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 4, fill: colors.line }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Season split — outfield only, CSS bars to avoid recharts Cell */}
        {hasSplit && (
          <div>
            <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-3">Season contribution (weighted score)</p>
            <div className="space-y-2.5">
              {splitData.map(item => (
                <div key={item.name} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span style={{ color: colors.muted }}>{item.name}</span>
                    <span style={{ color: colors.tooltipText }} className="font-semibold">{item.value}</span>
                  </div>
                  <div className="h-2 rounded-full" style={{ background: colors.trackBg }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.min(100, (item.value / maxSplit) * 100)}%`,
                        background: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
