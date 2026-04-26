import { useMemo, useRef, useState } from 'react'
import {
  ComposedChart, Bar, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  ScatterChart, Scatter, AreaChart, Area, ReferenceLine,
} from 'recharts'
import type { PlayerGameStats } from '../../utils/stats'
import type { GKGameBreakdown } from '../../utils/stats'
import type { PlayerStats } from '../../types'
import { useTheme } from '../../hooks/useTheme'

interface Props {
  gameBreakdown: PlayerGameStats[]
  gkBreakdown?: GKGameBreakdown[]
  isGoalkeeper: boolean
  stats: PlayerStats[]
  playerStats: PlayerStats | undefined
}

function rollingAvg(data: number[], i: number, window = 3): number {
  const start = Math.max(0, i - window + 1)
  const slice = data.slice(start, i + 1)
  return Math.round((slice.reduce((a, b) => a + b, 0) / slice.length) * 10) / 10
}

export default function PlayerCharts({ gameBreakdown, gkBreakdown, isGoalkeeper, stats, playerStats }: Props) {
  const { isDark } = useTheme()
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeSlide, setActiveSlide] = useState(0)

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
    areaBg: isDark ? 'rgba(22,163,74,0.15)' : 'rgba(22,163,74,0.12)',
    tackleFill: isDark ? 'rgba(59,130,246,0.6)' : 'rgba(59,130,246,0.5)',
    intFill: isDark ? 'rgba(22,163,74,0.55)' : 'rgba(22,163,74,0.45)',
    dot: isDark ? '#f59e0b' : '#d97706',
  }

  // ── Existing chart data ────────────────────────────────────────────────────

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

  const radarData = useMemo(() => {
    if (isGoalkeeper || gameBreakdown.length === 0) return []
    const n = gameBreakdown.length
    const hasPassData = gameBreakdown.some(g => g.passes_completed + g.passes_failed > 0)
    const avg = (key: keyof PlayerGameStats) => {
      if (key === 'pass_accuracy') {
        const gamesWithPasses = gameBreakdown.filter(g => g.passes_completed + g.passes_failed > 0)
        if (gamesWithPasses.length === 0) return 0
        return gamesWithPasses.reduce((s, g) => s + (g[key] as number), 0) / gamesWithPasses.length
      }
      return gameBreakdown.reduce((s, g) => s + (g[key] as number), 0) / n
    }
    const caps: Record<string, number> = {
      goals: 2, assists: 1.5, pass_accuracy: 100, key_passes: 3, tackles: 4, interceptions: 3,
    }
    const labels: Record<string, string> = {
      goals: 'Goals', assists: 'Assists', pass_accuracy: 'Pass Acc',
      key_passes: 'Key Passes', tackles: 'Tackles', interceptions: 'Interceptions',
    }
    return Object.entries(caps)
      .filter(([key]) => key !== 'pass_accuracy' || hasPassData)
      .map(([key, cap]) => {
        const raw = Math.round(avg(key as keyof PlayerGameStats) * 100) / 100
        return { axis: labels[key], value: Math.min(100, Math.round((raw / cap) * 100)), raw }
      })
  }, [gameBreakdown, isGoalkeeper])

  // ── New chart data ─────────────────────────────────────────────────────────

  const MIN_SHOTS = 5

  const squadShotData = useMemo(() => {
    if (isGoalkeeper) return { points: [], summary: '' }

    const qualifying = stats.filter(
      s => !s.player.is_goalkeeper && (s.shots_on_target + s.shots_off_target) >= MIN_SHOTS
    )
    const points = qualifying.map(s => ({
      x: s.shots_on_target + s.shots_off_target,
      y: s.shot_accuracy,
      name: s.player.name,
      isSubject: s.player.id === playerStats?.player.id,
    }))

    const subjectQualifies = playerStats && (playerStats.shots_on_target + playerStats.shots_off_target) >= MIN_SHOTS
    let summary = ''
    if (!subjectQualifies || !playerStats) {
      summary = "You haven't taken enough shots to feature on this chart yet."
    } else {
      const medianOf = (arr: number[]) => {
        const sorted = [...arr].sort((a, b) => a - b)
        return sorted[Math.floor(sorted.length / 2)]
      }
      const medVol = medianOf(qualifying.map(s => s.shots_on_target + s.shots_off_target))
      const medAcc = medianOf(qualifying.map(s => s.shot_accuracy))
      const myVol = playerStats.shots_on_target + playerStats.shots_off_target
      const myAcc = playerStats.shot_accuracy
      const highVol = myVol >= medVol, highAcc = myAcc >= medAcc

      if (highVol && highAcc)  summary = "You take a high volume of shots and are one of the more accurate shooters in the squad."
      if (highVol && !highAcc) summary = "You take a high volume of shots but accuracy is an area to work on."
      if (!highVol && highAcc) summary = "You shoot sparingly, but when you do you tend to be accurate."
      if (!highVol && !highAcc) summary = "You take few shots and accuracy is an area to improve."
    }

    return { points, summary }
  }, [isGoalkeeper, stats, playerStats])

  const defensiveBar = useMemo(() => {
    if (isGoalkeeper) return []
    return [...gameBreakdown].reverse().map(g => ({
      date: new Date(g.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      tackles: g.tackles,
      interceptions: g.interceptions,
    }))
  }, [gameBreakdown, isGoalkeeper])

  const passingArea = useMemo(() => {
    if (isGoalkeeper) return { data: [], avg: 0 }
    const gamesWithPasses = [...gameBreakdown].reverse().filter(g => g.passes_completed + g.passes_failed > 0)
    const avg = gamesWithPasses.length > 0
      ? Math.round(gamesWithPasses.reduce((s, g) => s + g.pass_accuracy, 0) / gamesWithPasses.length)
      : 0
    return {
      data: gamesWithPasses.map(g => ({
        date: new Date(g.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        accuracy: g.pass_accuracy,
      })),
      avg,
    }
  }, [gameBreakdown, isGoalkeeper])

  const involvementsData = useMemo(() => {
    if (isGoalkeeper) return []
    const chrono = [...gameBreakdown].reverse()
    const vals = chrono.map(g => g.goals + g.assists)
    return chrono.map((g, i) => ({
      date: new Date(g.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      ga: g.goals + g.assists,
      rolling: rollingAvg(vals, i),
    }))
  }, [gameBreakdown, isGoalkeeper])

  const hasAttackingData = !isGoalkeeper && squadShotData.points.length >= 2
  const hasInvolvementData = !isGoalkeeper && involvementsData.some(d => d.ga > 0)
  const hasDefensiveData = !isGoalkeeper && defensiveBar.some(d => d.tackles + d.interceptions > 0)
  const hasPassingData = !isGoalkeeper && passingArea.data.length >= 3

  // ── Squad percentiles ──────────────────────────────────────────────────────

  const percentileData = useMemo(() => {
    if (isGoalkeeper || !playerStats || playerStats.games_played < 3) return []
    const outfield = stats.filter(s => !s.player.is_goalkeeper && s.games_played >= 3)
    if (outfield.length < 2) return []

    const pct = (val: number, vals: number[]) =>
      Math.round((vals.filter(v => v < val).length / vals.length) * 100)

    const gaPerGame = (s: PlayerStats) => s.games_played > 0 ? s.goal_involvements / s.games_played : 0

    const items: { label: string; pct: number }[] = [
      { label: 'Goals/game',          pct: pct(playerStats.goals_per_game, outfield.map(s => s.goals_per_game)) },
      { label: 'Goal involvements',   pct: pct(gaPerGame(playerStats), outfield.map(gaPerGame)) },
      { label: 'Defensive actions',   pct: pct(playerStats.defensive_actions_per_game, outfield.map(s => s.defensive_actions_per_game)) },
      { label: 'Win rate',            pct: pct(playerStats.win_rate, outfield.map(s => s.win_rate)) },
    ]

    if (playerStats.shots_on_target + playerStats.shots_off_target >= MIN_SHOTS) {
      const qualified = outfield.filter(s => s.shots_on_target + s.shots_off_target >= MIN_SHOTS)
      if (qualified.length >= 2)
        items.splice(2, 0, { label: 'Shot accuracy', pct: pct(playerStats.shot_accuracy, qualified.map(s => s.shot_accuracy)) })
    }

    if (playerStats.pass_attempts >= 15) {
      const qualified = outfield.filter(s => s.pass_attempts >= 15)
      if (qualified.length >= 2)
        items.splice(2, 0, { label: 'Pass accuracy', pct: pct(playerStats.pass_accuracy, qualified.map(s => s.pass_accuracy)) })
    }

    return items
  }, [isGoalkeeper, playerStats, stats])

  // ── Carousel ───────────────────────────────────────────────────────────────

  const visibleCharts = [
    hasAttackingData && 'attacking',
    hasInvolvementData && 'involvement',
    hasDefensiveData && 'defensive',
    hasPassingData && 'passing',
  ].filter(Boolean) as string[]

  function handleScroll() {
    if (!scrollRef.current) return
    const { scrollLeft, clientWidth } = scrollRef.current
    if (clientWidth > 0) setActiveSlide(Math.round(scrollLeft / clientWidth))
  }

  function scrollTo(i: number) {
    if (!scrollRef.current) return
    scrollRef.current.scrollTo({ left: i * scrollRef.current.clientWidth, behavior: 'smooth' })
  }

  // ── Existing chart guard ───────────────────────────────────────────────────

  const chartData = isGoalkeeper ? gkData : outfieldData
  if (chartData.length < 2) return null

  const maxSplit = Math.max(...splitData.map(d => d.value), 1)
  const hasSplit = !isGoalkeeper && (splitData[0]?.value > 0 || splitData[1]?.value > 0)

  // ── Shared chart card ──────────────────────────────────────────────────────

  function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-4">
        <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-3">{title}</p>
        {children}
      </div>
    )
  }

  function AttackingChart() {
    const [clickedName, setClickedName] = useState<string | null>(null)
    const { points, summary } = squadShotData
    const others = points.filter(p => !p.isSubject)
    const subject = points.filter(p => p.isSubject)
    const maxVol = Math.max(...points.map(p => p.x), 1)
    return (
      <ChartCard title="Shots taken vs accuracy %">
        <ResponsiveContainer width="100%" height={150}>
          <ScatterChart margin={{ top: 4, right: 8, bottom: 4, left: 0 }}>
            <XAxis
              type="number" dataKey="x"
              domain={[0, maxVol + 2]}
              tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
              axisLine={{ stroke: colors.grid }}
            />
            <YAxis
              type="number" dataKey="y"
              domain={[0, 100]}
              tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
              axisLine={false} width={36}
              tickFormatter={v => `${v}%`}
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null
                const d = payload[0]?.payload
                return (
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                    className="rounded-xl px-3 py-2 text-xs space-y-0.5 shadow-md">
                    <p style={{ color: colors.muted }}>{d?.name}</p>
                    <p style={{ color: colors.tooltipText }}>{d?.x} shots · <span className="font-semibold">{d?.y}% acc</span></p>
                  </div>
                )
              }}
            />
            <Scatter
              data={others} fill={colors.muted} opacity={0.4} r={4}
              onClick={(d) => setClickedName((d as unknown as { name: string }).name)}
              style={{ cursor: 'pointer' }}
            />
            <Scatter
              data={subject} fill="#b0000f" opacity={0.9} r={8}
              onClick={(d) => setClickedName((d as unknown as { name: string }).name)}
              style={{ cursor: 'pointer' }}
            />
          </ScatterChart>
        </ResponsiveContainer>
        <div className="min-h-[44px] flex flex-col justify-center gap-0.5">
          {clickedName && (
            <p className="text-xs text-center font-semibold" style={{ color: colors.tooltipText }}>{clickedName}</p>
          )}
          {summary && (
            <p className="text-xs text-center italic" style={{ color: colors.muted }}>{summary}</p>
          )}
        </div>
      </ChartCard>
    )
  }

  function DefensiveChart() {
    return (
      <ChartCard title="Defensive actions per game">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="flex items-center gap-1 text-xs" style={{ color: colors.muted }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: colors.tackleFill }} />
            Tackles
          </span>
          <span className="flex items-center gap-1 text-xs" style={{ color: colors.muted }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: colors.intFill }} />
            Interceptions
          </span>
        </div>
        <ResponsiveContainer width="100%" height={126}>
          <ComposedChart data={defensiveBar} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
              axisLine={{ stroke: colors.grid }} interval="preserveStartEnd" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                    className="rounded-xl px-3 py-2 text-xs space-y-0.5 shadow-md">
                    <p style={{ color: colors.muted }}>{label}</p>
                    <p style={{ color: colors.tackleFill }}>Tackles: <span className="font-semibold">{payload.find(p => p.dataKey === 'tackles')?.value ?? 0}</span></p>
                    <p style={{ color: colors.intFill }}>Interceptions: <span className="font-semibold">{payload.find(p => p.dataKey === 'interceptions')?.value ?? 0}</span></p>
                  </div>
                )
              }}
            />
            <Bar dataKey="tackles" stackId="def" fill={colors.tackleFill} radius={[0, 0, 0, 0]} />
            <Bar dataKey="interceptions" stackId="def" fill={colors.intFill} radius={[3, 3, 0, 0]} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="min-h-[44px]" />
      </ChartCard>
    )
  }

  function PassingChart() {
    return (
      <ChartCard title={`Pass accuracy per game (avg ${passingArea.avg}%)`}>
        <div className="flex items-center gap-3 mb-1.5">
          <span className="flex items-center gap-1 text-xs" style={{ color: colors.muted }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: colors.areaBg, border: `1px solid ${colors.line}` }} />
            Accuracy
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: colors.muted }}>
            <svg width="18" height="6" aria-hidden="true">
              <line x1="0" y1="3" x2="18" y2="3" stroke={colors.muted} strokeWidth="1.5" strokeDasharray="4 3" />
            </svg>
            Season avg
          </span>
        </div>
        <ResponsiveContainer width="100%" height={126}>
          <AreaChart data={passingArea.data} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
            <defs>
              <linearGradient id="passGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={colors.line} stopOpacity={0.3} />
                <stop offset="95%" stopColor={colors.line} stopOpacity={0.03} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
              axisLine={{ stroke: colors.grid }} interval="preserveStartEnd" />
            <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
              axisLine={false} width={36} tickFormatter={v => `${v}%`} />
            <ReferenceLine y={passingArea.avg} stroke={colors.muted} strokeDasharray="4 3" strokeWidth={1} />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                    className="rounded-xl px-3 py-2 text-xs space-y-0.5 shadow-md">
                    <p style={{ color: colors.muted }}>{label}</p>
                    <p style={{ color: colors.tooltipText }}>
                      Accuracy: <span className="font-semibold">{payload[0]?.value}%</span>
                    </p>
                    <p style={{ color: colors.muted }}>Avg: {passingArea.avg}%</p>
                  </div>
                )
              }}
            />
            <Area type="monotone" dataKey="accuracy" stroke={colors.line} strokeWidth={2}
              fill="url(#passGrad)" dot={false} activeDot={{ r: 4, fill: colors.line }} />
          </AreaChart>
        </ResponsiveContainer>
        <div className="min-h-[44px]" />
      </ChartCard>
    )
  }

  function InvolvementsChart() {
    return (
      <ChartCard title="Goal involvements per game">
        <div className="flex items-center gap-3 mb-1.5">
          <span className="flex items-center gap-1 text-xs" style={{ color: colors.muted }}>
            <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: colors.attack }} />
            G+A
          </span>
          <span className="flex items-center gap-1.5 text-xs" style={{ color: colors.line }}>
            <span className="inline-block w-4 border-t-2" style={{ borderColor: colors.line }} />
            3-game avg
          </span>
        </div>
        <ResponsiveContainer width="100%" height={126}>
          <ComposedChart data={involvementsData} margin={{ top: 0, right: 4, bottom: 0, left: -20 }}>
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
              axisLine={{ stroke: colors.grid }} interval="preserveStartEnd" />
            <Tooltip
              content={({ active, payload, label }) => {
                if (!active || !payload?.length) return null
                return (
                  <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                    className="rounded-xl px-3 py-2 text-xs space-y-0.5 shadow-md">
                    <p style={{ color: colors.muted }}>{label}</p>
                    <p style={{ color: colors.tooltipText }}>G+A: <span className="font-semibold">{payload.find(p => p.dataKey === 'ga')?.value ?? 0}</span></p>
                    {payload.find(p => p.dataKey === 'rolling') && (
                      <p style={{ color: colors.line }}>3-game avg: <span className="font-semibold">{payload.find(p => p.dataKey === 'rolling')?.value}</span></p>
                    )}
                  </div>
                )
              }}
            />
            <Bar dataKey="ga" fill={colors.attack} radius={[3, 3, 0, 0]} />
            <Line type="monotone" dataKey="rolling" stroke={colors.line} strokeWidth={2}
              dot={false} activeDot={{ r: 4, fill: colors.line }} />
          </ComposedChart>
        </ResponsiveContainer>
        <div className="min-h-[44px]" />
      </ChartCard>
    )
  }

  const chartComponents: Record<string, React.ReactNode> = {
    attacking: <AttackingChart />,
    involvement: <InvolvementsChart />,
    defensive: <DefensiveChart />,
    passing: <PassingChart />,
  }

  return (
    <>
      {/* ── Existing Performance card ────────────────────────────────────── */}
      <section className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Performance</h2>
        <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-5 space-y-6">

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
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: colors.muted }} tickLine={false}
                  axisLine={{ stroke: colors.grid }} interval="preserveStartEnd" />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (!active || !payload?.length) return null
                    return (
                      <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                        className="rounded-xl px-3 py-2 text-xs space-y-1 shadow-md">
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
                <Line type="monotone" dataKey="rolling" stroke={colors.line} strokeWidth={2}
                  dot={false} activeDot={{ r: 4, fill: colors.line }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

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
                      <div className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, (item.value / maxSplit) * 100)}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {!isGoalkeeper && radarData.length > 0 && (
            <div>
              <p className="text-xs text-gray-500 dark:text-[#9CA3AF] mb-1">Player profile</p>
              <ResponsiveContainer width="100%" height={220}>
                <RadarChart data={radarData} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
                  <PolarGrid stroke={colors.grid} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 10, fill: colors.muted }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke={colors.line} fill={colors.bar} fillOpacity={0.55} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (!active || !payload?.length) return null
                      const d = payload[0].payload
                      return (
                        <div style={{ background: colors.tooltipBg, border: `1px solid ${colors.tooltipBorder}` }}
                          className="rounded-xl px-3 py-2 text-xs shadow-md">
                          <p style={{ color: colors.muted }}>{d.axis}</p>
                          <p style={{ color: colors.tooltipText }}>{d.raw}/game</p>
                        </div>
                      )
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </section>

      {/* ── New category charts ───────────────────────────────────────────── */}
      {visibleCharts.length > 0 && !isGoalkeeper && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Insights</h2>

          {/* Mobile: horizontal swipe carousel */}
          <div className="md:hidden">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth -mx-1 px-1"
              style={{ scrollbarWidth: 'none' }}
            >
              {visibleCharts.map(key => (
                <div key={key} className="shrink-0 w-[88%] snap-start pr-3">
                  {chartComponents[key]}
                </div>
              ))}
            </div>
            {visibleCharts.length > 1 && (
              <div className="flex items-center justify-center gap-2 mt-3">
                {visibleCharts.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => scrollTo(i)}
                    className={`rounded-full transition-all duration-200 ${activeSlide === i
                      ? 'w-5 h-2 bg-mvf'
                      : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'
                    }`}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Desktop: 2-column grid */}
          <div className={`hidden md:grid items-stretch gap-3 ${visibleCharts.length === 1 ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {visibleCharts.map(key => (
              <div key={key}>{chartComponents[key]}</div>
            ))}
          </div>
        </section>
      )}

      {/* ── Squad percentiles ─────────────────────────────────────────────── */}
      {percentileData.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Squad Ranking</h2>
          <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5 py-4 space-y-3">
            {percentileData.map(({ label, pct }) => {
              const topPct = 100 - pct
              const rounded = Math.round(topPct / 5) * 5
              const displayLabel = rounded <= 50 ? `Top ${rounded}%` : `Bottom ${Math.round(pct / 5) * 5}%`
              const barColor = pct >= 75 ? colors.line : pct >= 50 ? '#f59e0b' : pct >= 25 ? colors.muted : '#ef4444'
              const labelColor = barColor
              return (
                <div key={label} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span style={{ color: colors.muted }}>{label}</span>
                    <span className="font-semibold" style={{ color: labelColor }}>
                      {displayLabel}
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full" style={{ background: colors.trackBg }}>
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${pct}%`, background: barColor }}
                    />
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      )}
    </>
  )
}
