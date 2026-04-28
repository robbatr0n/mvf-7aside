import { useMemo, useRef, useState } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import { useEvents } from '../hooks/useEvents'
import { useGames } from '../hooks/useGames'
import { useGamePlayers } from '../hooks/useGamePlayers'
import { useStats } from '../hooks/useStats'
import { useGoalkeeperStats } from '../hooks/useGoalKeeperStats'
import { calculateGameSummaries, calculateTeamOfTheWeek } from '../utils/stats'
import { useTheme } from '../hooks/useTheme'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ScatterChart,
  Scatter,
} from 'recharts'

const GRID = (isDark: boolean) => (isDark ? '#2a2e31' : '#E5E4E0')
const TOOLTIP_STYLE = (isDark: boolean) => ({
  backgroundColor: isDark ? '#111518' : '#fff',
  border: `1px solid ${isDark ? '#2a2e31' : '#D4D3D0'}`,
  borderRadius: 8,
  fontSize: 12,
})
const AXIS_TICK = { fontSize: 11, fill: '#737373' }
const MUTED = 'text-[#737373]'
const CARD = 'bg-white dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl'

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className={`text-xs font-semibold uppercase tracking-widest ${MUTED} mb-4`}>{children}</h2>
}

function ScatterDot(props: Record<string, unknown>) {
  const cx = Number(props.cx ?? 0)
  const cy = Number(props.cy ?? 0)
  const payload = props.payload as { name?: string } | undefined
  const name = payload?.name ?? ''
  const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
  return (
    <g>
      <circle cx={cx} cy={cy} r={13} fill="#B0000F" fillOpacity={0.85} />
      <text x={cx} y={cy + 4} textAnchor="middle" fontSize={9} fill="white" fontWeight="bold">
        {initials}
      </text>
    </g>
  )
}

export default function Season() {
  const { players, loading: playersLoading } = usePlayers()
  const { events, loading: eventsLoading } = useEvents()
  const { games, loading: gamesLoading } = useGames()
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers()
  const { stats } = useStats(players, events, games, gamePlayers)
  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers)
  const { isDark } = useTheme()

  const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading

  const gameSummaries = useMemo(
    () => calculateGameSummaries(games, players, events, gamePlayers),
    [games, players, events, gamePlayers],
  )

  const headlineStats = useMemo(() => ({
    totalGoals: events.filter(e => e.event_type === 'goal').length,
    totalAssists: events.filter(e => e.event_type === 'assist').length,
    totalTackles: events.filter(e => e.event_type === 'tackle').length,
    totalInterceptions: events.filter(e => e.event_type === 'interception').length,
    totalSOT: events.filter(e => e.event_type === 'shot_on_target').length,
    totalSOFF: events.filter(e => e.event_type === 'shot_off_target').length,
  }), [events])

  const typicalWednesday = useMemo(() => {
    const n = gameSummaries.length
    if (n === 0) return null
    const totalGoals = gameSummaries.reduce((s, gs) => s + gs.totalGoals, 0)
    const totalShots = gameSummaries.reduce((s, gs) => s + gs.team1Stats.shots + gs.team2Stats.shots, 0)
    const totalDA = gameSummaries.reduce(
      (s, gs) => s + gs.team1Stats.tackles + gs.team1Stats.interceptions + gs.team2Stats.tackles + gs.team2Stats.interceptions, 0,
    )
    const passGames = gameSummaries.filter(gs => gs.team1Stats.passesCompleted + gs.team2Stats.passesCompleted > 0)
    const avgPassAcc = passGames.length > 0
      ? Math.round(passGames.reduce((s, gs) => {
          if (gs.team1Stats.passesCompleted === 0) return s + gs.team2Stats.passAccuracy
          if (gs.team2Stats.passesCompleted === 0) return s + gs.team1Stats.passAccuracy
          return s + (gs.team1Stats.passAccuracy + gs.team2Stats.passAccuracy) / 2
        }, 0) / passGames.length)
      : 0
    return {
      avgGoalsPerGame: Math.round((totalGoals / n) * 10) / 10,
      avgShotsPerTeam: Math.round((totalShots / (n * 2)) * 10) / 10,
      avgPassAcc,
      avgDAPerGame: Math.round((totalDA / n) * 10) / 10,
    }
  }, [gameSummaries])

  const chronoSummaries = useMemo(() => [...gameSummaries].reverse(), [gameSummaries])

  const goalsTrendData = useMemo(
    () => chronoSummaries.map(gs => ({
      label: new Date(gs.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      goals: gs.team1Goals.length + gs.team2Goals.length,
    })),
    [chronoSummaries],
  )

  const daTrendData = useMemo(
    () => chronoSummaries.map(gs => ({
      label: new Date(gs.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      actions: gs.team1Stats.tackles + gs.team1Stats.interceptions + gs.team2Stats.tackles + gs.team2Stats.interceptions,
    })),
    [chronoSummaries],
  )

  const passAccTrend = useMemo(() => {
    const data = chronoSummaries.map(gs => {
      const gameEvents = events.filter(
        e => e.game_id === gs.game.id && (e.event_type === 'pass_completed' || e.event_type === 'pass_failed'),
      )
      const pc = gameEvents.filter(e => e.event_type === 'pass_completed').length
      const total = gameEvents.length
      return {
        label: new Date(gs.game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        accuracy: total > 0 ? Math.round((pc / total) * 100) : null,
      }
    })
    const withData = data.filter(d => d.accuracy !== null)
    const seasonAvg = withData.length > 0
      ? Math.round(withData.reduce((s, d) => s + (d.accuracy ?? 0), 0) / withData.length)
      : 0
    return { data, seasonAvg }
  }, [chronoSummaries, events])

  const seasonArc = useMemo(() => {
    const n = chronoSummaries.length
    if (n < 4) return null
    const mid = Math.floor(n / 2)
    const first = chronoSummaries.slice(0, mid)
    const second = chronoSummaries.slice(mid)

    const avgGoals = (gs: typeof first) =>
      Math.round((gs.reduce((s, g) => s + g.totalGoals, 0) / gs.length) * 10) / 10

    const avgPassAcc = (gs: typeof first) => {
      const pg = gs.filter(g => g.team1Stats.passesCompleted + g.team2Stats.passesCompleted > 0)
      if (pg.length === 0) return null
      return Math.round(pg.reduce((s, g) => {
        if (g.team1Stats.passesCompleted === 0) return s + g.team2Stats.passAccuracy
        if (g.team2Stats.passesCompleted === 0) return s + g.team1Stats.passAccuracy
        return s + (g.team1Stats.passAccuracy + g.team2Stats.passAccuracy) / 2
      }, 0) / pg.length)
    }

    const avgDA = (gs: typeof first) =>
      Math.round((gs.reduce((s, g) =>
        s + g.team1Stats.tackles + g.team1Stats.interceptions + g.team2Stats.tackles + g.team2Stats.interceptions, 0,
      ) / gs.length) * 10) / 10

    return {
      firstCount: mid,
      secondCount: n - mid,
      rows: [
        { label: 'Goals / game', first: avgGoals(first), second: avgGoals(second), fmt: (v: number) => String(v) },
        { label: 'Pass accuracy', first: avgPassAcc(first), second: avgPassAcc(second), fmt: (v: number) => `${v}%` },
        { label: 'Def. actions / game', first: avgDA(first), second: avgDA(second), fmt: (v: number) => String(v) },
      ],
    }
  }, [chronoSummaries])

  const winRateData = useMemo(() => {
    const outfield = stats
      .filter(s => !s.player.is_guest && !s.player.is_goalkeeper && s.games_played >= 3)
      .map(s => ({ name: s.player.name, win_rate: s.win_rate, games: s.games_played, isGK: false }))
    const gk = goalkeeperStats
      .filter(g => g.games >= 3)
      .map(g => ({ name: g.player.name, win_rate: g.win_rate, games: g.games, isGK: true }))
    return [...outfield, ...gk].sort((a, b) => b.win_rate - a.win_rate)
  }, [stats, goalkeeperStats])

  const [archetypePopup, setArchetypePopup] = useState<{ name: string; goals: number; assists: number } | null>(null)
  const [defPopup, setDefPopup] = useState<{ name: string; tackles: number; interceptions: number } | null>(null)
  const [pasPopup, setPasPopup] = useState<{ name: string; pass_attempts: number; pass_accuracy: number } | null>(null)
  const archetypeScrollRef = useRef<HTMLDivElement>(null)
  const [archetypeSlide, setArchetypeSlide] = useState(0)

  function handleArchetypeScroll() {
    if (!archetypeScrollRef.current) return
    const { scrollLeft, clientWidth } = archetypeScrollRef.current
    if (clientWidth > 0) setArchetypeSlide(Math.round(scrollLeft / clientWidth))
  }

  function scrollToArchetype(i: number) {
    if (!archetypeScrollRef.current) return
    archetypeScrollRef.current.scrollTo({ left: i * archetypeScrollRef.current.clientWidth, behavior: 'smooth' })
  }

  const scatterData = useMemo(() =>
    stats
      .filter(s => !s.player.is_guest && !s.player.is_goalkeeper && s.games_played >= 3)
      .map(s => ({ name: s.player.name, goals: s.goals, assists: s.assists })),
    [stats],
  )

  const defensiveScatterData = useMemo(() =>
    stats
      .filter(s => !s.player.is_guest && !s.player.is_goalkeeper && s.games_played >= 3)
      .map(s => ({ name: s.player.name, tackles: s.tackles, interceptions: s.interceptions })),
    [stats],
  )

  const passingScatterData = useMemo(() =>
    stats
      .filter(s => !s.player.is_guest && !s.player.is_goalkeeper && s.games_played >= 3 && s.pass_attempts > 0)
      .map(s => ({ name: s.player.name, pass_attempts: s.pass_attempts, pass_accuracy: s.pass_accuracy })),
    [stats],
  )

  const shotProfileData = useMemo(() =>
    stats
      .filter(s => !s.player.is_guest && !s.player.is_goalkeeper && s.shots_on_target + s.shots_off_target >= 10)
      .sort((a, b) => b.shot_accuracy - a.shot_accuracy)
      .map(s => ({
        name: s.player.name,
        sot: s.shots_on_target,
        missed: s.shots_off_target,
        total: s.shots_on_target + s.shots_off_target,
        accuracy: s.shot_accuracy,
      })),
    [stats],
  )

  const participationData = useMemo(() => {
    const countMap = new Map<string, number>()
    gamePlayers.forEach(gp => countMap.set(gp.player_id, (countMap.get(gp.player_id) ?? 0) + 1))
    return Array.from(countMap.entries())
      .map(([id, count]) => ({ name: players.find(p => p.id === id)?.name ?? null, count }))
      .filter((e): e is { name: string; count: number } => e.name !== null)
      .sort((a, b) => b.count - a.count)
  }, [gamePlayers, players])

  const streaksData = useMemo(() => {
    const sortedGameIds = [...games]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(g => g.id)
    const nonGuestIds = [...new Set(
      gamePlayers.map(gp => gp.player_id).filter(id => !players.find(p => p.id === id)?.is_guest),
    )]
    return nonGuestIds
      .map(playerId => {
        const appeared = new Set(gamePlayers.filter(gp => gp.player_id === playerId).map(gp => gp.game_id))
        let max = 0, cur = 0
        sortedGameIds.forEach(id => { if (appeared.has(id)) { cur++; if (cur > max) max = cur } else cur = 0 })
        return { name: players.find(p => p.id === playerId)?.name ?? 'Unknown', streak: max }
      })
      .sort((a, b) => b.streak - a.streak)
      .slice(0, 3)
  }, [games, gamePlayers, players])

  const totwTimeline = useMemo(() => {
    const sortedGames = [...games].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    const gameData = sortedGames.map(game => {
      const totw = calculateTeamOfTheWeek(game.id, players, events, gamePlayers)
      const playerIds = new Set<string>([
        ...totw.outfield.map(p => p.player.id),
        ...(totw.goalkeeper ? [totw.goalkeeper.player.id] : []),
      ])
      return {
        gameId: game.id,
        label: new Date(game.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
        playerIds,
      }
    })
    const countMap = new Map<string, number>()
    gameData.forEach(g => g.playerIds.forEach(id => countMap.set(id, (countMap.get(id) ?? 0) + 1)))
    const playerRows = Array.from(countMap.entries())
      .map(([id, count]) => ({ id, name: players.find(p => p.id === id)?.name ?? null, count }))
      .filter((p): p is { id: string; name: string; count: number } => p.name !== null)
      .sort((a, b) => b.count - a.count)
    return { games: gameData, players: playerRows }
  }, [games, players, events, gamePlayers])

  const radarData = useMemo(() => {
    const n = gameSummaries.length
    if (n === 0) return []
    const avgGoalsPerGame = gameSummaries.reduce((s, gs) => s + gs.totalGoals, 0) / n
    const shotAccValues = gameSummaries
      .map(gs => {
        const shots = gs.team1Stats.shots + gs.team2Stats.shots
        const sot = gs.team1Stats.shotsOnTarget + gs.team2Stats.shotsOnTarget
        return shots > 0 ? (sot / shots) * 100 : null
      })
      .filter((v): v is number => v !== null)
    const avgShotAcc = shotAccValues.length > 0 ? shotAccValues.reduce((s, v) => s + v, 0) / shotAccValues.length : 0
    const passAccValues = gameSummaries
      .map(gs => {
        if (gs.team1Stats.passesCompleted + gs.team2Stats.passesCompleted === 0) return null
        if (gs.team1Stats.passesCompleted === 0) return gs.team2Stats.passAccuracy
        if (gs.team2Stats.passesCompleted === 0) return gs.team1Stats.passAccuracy
        return (gs.team1Stats.passAccuracy + gs.team2Stats.passAccuracy) / 2
      })
      .filter((v): v is number => v !== null)
    const avgPassAcc = passAccValues.length > 0 ? passAccValues.reduce((s, v) => s + v, 0) / passAccValues.length : 0
    const totalDA = gameSummaries.reduce(
      (s, gs) => s + gs.team1Stats.tackles + gs.team1Stats.interceptions + gs.team2Stats.tackles + gs.team2Stats.interceptions, 0,
    )
    const gamesWithResult = games.filter(g => g.winning_team !== null)
    const decisiveGames = gamesWithResult.filter(g => g.winning_team !== 0).length
    return [
      { axis: 'Attacking', value: Math.min(100, Math.round((avgGoalsPerGame / 10) * 100)) },
      { axis: 'Shooting', value: Math.round(avgShotAcc) },
      { axis: 'Passing', value: Math.round(avgPassAcc) },
      { axis: 'Defending', value: Math.min(100, Math.round(((totalDA / n) / 20) * 100)) },
      { axis: 'Consistency', value: gamesWithResult.length > 0 ? Math.round((decisiveGames / gamesWithResult.length) * 100) : 0 },
    ]
  }, [gameSummaries, games])

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809]">
        <div className="max-w-4xl mx-auto px-6 py-10 space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  const textMain = isDark ? '#E5E6E3' : '#1C1C1C'

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Season at a Glance */}
        <section>
          <SectionHeading>Season at a Glance</SectionHeading>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {[
              { label: 'Goals', value: headlineStats.totalGoals },
              { label: 'Assists', value: headlineStats.totalAssists },
              { label: 'Tackles', value: headlineStats.totalTackles },
              { label: 'Interceptions', value: headlineStats.totalInterceptions },
              { label: 'Shots on Target', value: headlineStats.totalSOT },
              { label: 'Shots off Target', value: headlineStats.totalSOFF },
            ].map(({ label, value }) => (
              <div key={label} className={`${CARD} p-5`}>
                <p className="text-3xl font-bold text-mvf">{value}</p>
                <p className={`text-sm ${MUTED} mt-1`}>{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Typical Wednesday */}
        {typicalWednesday && (
          <section>
            <SectionHeading>What a Typical Wednesday Looks Like</SectionHeading>
            <div className={`${CARD} p-6`}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'Goals / game', value: typicalWednesday.avgGoalsPerGame },
                  { label: 'Shots / team / game', value: typicalWednesday.avgShotsPerTeam },
                  { label: 'Pass accuracy', value: `${typicalWednesday.avgPassAcc}%` },
                  { label: 'Def. actions / game', value: typicalWednesday.avgDAPerGame },
                ].map(({ label, value }) => (
                  <div key={label}>
                    <p className="text-2xl font-bold">{value}</p>
                    <p className={`text-sm ${MUTED}`}>{label}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Goals Per Game Trend */}
        {goalsTrendData.length > 0 && (
          <section>
            <SectionHeading>Goals Per Game</SectionHeading>
            <div className={`${CARD} p-4`}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={goalsTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID(isDark)} />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip contentStyle={TOOLTIP_STYLE(isDark)} labelStyle={{ color: textMain }} formatter={(v: unknown) => [v as React.ReactNode, 'Goals']} />
                  <Line type="monotone" dataKey="goals" stroke="#B0000F" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Defensive Actions Trend */}
        {daTrendData.length > 0 && (
          <section>
            <SectionHeading>Defensive Actions Per Game</SectionHeading>
            <div className={`${CARD} p-4`}>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={daTrendData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID(isDark)} />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis allowDecimals={false} tick={AXIS_TICK} />
                  <Tooltip contentStyle={TOOLTIP_STYLE(isDark)} labelStyle={{ color: textMain }} formatter={(v: unknown) => [v as React.ReactNode, 'Actions']} />
                  <Line type="monotone" dataKey="actions" stroke="#B0000F" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Pass Accuracy Trend */}
        {passAccTrend.seasonAvg > 0 && (
          <section>
            <SectionHeading>Pass Accuracy Trend</SectionHeading>
            <div className={`${CARD} p-4`}>
              <ResponsiveContainer width="100%" height={180}>
                <LineChart data={passAccTrend.data} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke={GRID(isDark)} />
                  <XAxis dataKey="label" tick={AXIS_TICK} />
                  <YAxis domain={[0, 100]} tick={AXIS_TICK} tickFormatter={(v: number) => `${v}%`} />
                  <Tooltip
                    contentStyle={TOOLTIP_STYLE(isDark)}
                    labelStyle={{ color: textMain }}
                    formatter={(v: unknown) => [`${v}%`, 'Pass accuracy']}
                  />
                  <ReferenceLine
                    y={passAccTrend.seasonAvg}
                    stroke="#737373"
                    strokeDasharray="4 4"
                    label={{ value: `Avg ${passAccTrend.seasonAvg}%`, fill: '#737373', fontSize: 11, position: 'insideTopRight' }}
                  />
                  <Line type="monotone" dataKey="accuracy" stroke="#B0000F" strokeWidth={2} dot={false} activeDot={{ r: 4 }} connectNulls={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

        {/* Season Arc */}
        {seasonArc && (
          <section>
            <SectionHeading>Season Arc</SectionHeading>
            <div className={`${CARD} p-5`}>
              <div className={`flex text-xs ${MUTED} uppercase tracking-widest mb-4 gap-4`}>
                <span className="flex-1" />
                <span className="w-24 text-center">First {seasonArc.firstCount}</span>
                <span className="w-24 text-center">Last {seasonArc.secondCount}</span>
                <span className="w-10 text-center">Trend</span>
              </div>
              <div className="space-y-3">
                {seasonArc.rows.map(row => {
                  if (row.first === null || row.second === null) return null
                  const pct = row.first === 0 ? 0 : ((row.second - row.first) / row.first) * 100
                  const arrow = pct > 3 ? '↑' : pct < -3 ? '↓' : '→'
                  const arrowColor = pct > 3 ? 'text-green-500' : pct < -3 ? 'text-red-500' : MUTED
                  return (
                    <div key={row.label} className="flex items-center gap-4">
                      <span className="flex-1 text-sm">{row.label}</span>
                      <span className="w-24 text-center text-sm font-semibold">{row.fmt(row.first)}</span>
                      <span className="w-24 text-center text-sm font-semibold">{row.fmt(row.second)}</span>
                      <span className={`w-10 text-center text-base font-bold ${arrowColor}`}>{arrow}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </section>
        )}

        {/* Win Rate Per Player */}
        {winRateData.length > 0 && (
          <section>
            <SectionHeading>Win Rate Per Player</SectionHeading>
            <div className={`${CARD} p-4 space-y-3`}>
              {winRateData.map(p => (
                <div key={p.name} className="flex items-center gap-3">
                  <div className="w-28 shrink-0 text-sm font-medium truncate">
                    {p.name}{p.isGK && <span className={`text-xs ${MUTED} ml-1`}>(GK)</span>}
                  </div>
                  <div className="flex-1 h-2 bg-[#F5F4F2] dark:bg-[#1a1e21] rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-mvf" style={{ width: `${p.win_rate}%` }} />
                  </div>
                  <div className="w-12 text-right text-sm font-semibold">{p.win_rate}%</div>
                  <div className="w-14 text-right text-xs text-[#737373]">{p.games}g</div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Player Archetypes Scatter */}
        {scatterData.length > 0 && (
          <section>
            <SectionHeading>Player Archetypes</SectionHeading>

            {(() => {
              const chart1 = (
                <div className={`${CARD} p-4`}>
                  <p className={`text-xs ${MUTED} mb-1`}>Goals vs assists — tap a dot to see details (min 3 games)</p>
                  {archetypePopup && (
                    <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-[#F5F4F2] dark:bg-[#1a1e21]">
                      <div>
                        <span className="text-sm font-semibold">{archetypePopup.name}</span>
                        <span className={`text-sm ${MUTED} ml-3`}>{archetypePopup.goals}G · {archetypePopup.assists}A</span>
                      </div>
                      <button onClick={() => setArchetypePopup(null)} className={`text-xs ${MUTED} hover:text-mvf`}>✕</button>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID(isDark)} />
                      <XAxis type="number" dataKey="goals" name="Goals" allowDecimals={false} tick={AXIS_TICK}
                        label={{ value: 'Goals', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#737373' }} />
                      <YAxis type="number" dataKey="assists" name="Assists" allowDecimals={false} tick={AXIS_TICK}
                        label={{ value: 'Assists', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#737373' }} />
                      <Tooltip content={() => null} />
                      <Scatter data={scatterData} shape={(props: unknown) => ScatterDot(props as Record<string, unknown>)}
                        onClick={(data: unknown) => { const d = data as { name: string; goals: number; assists: number }; setArchetypePopup(d) }}
                        style={{ cursor: 'pointer' }} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )

              const chart2 = (
                <div className={`${CARD} p-4`}>
                  <p className={`text-xs ${MUTED} mb-1`}>Tackles vs interceptions — tap a dot to see details (min 3 games)</p>
                  {defPopup && (
                    <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-[#F5F4F2] dark:bg-[#1a1e21]">
                      <div>
                        <span className="text-sm font-semibold">{defPopup.name}</span>
                        <span className={`text-sm ${MUTED} ml-3`}>{defPopup.tackles} tackles · {defPopup.interceptions} int</span>
                      </div>
                      <button onClick={() => setDefPopup(null)} className={`text-xs ${MUTED} hover:text-mvf`}>✕</button>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID(isDark)} />
                      <XAxis type="number" dataKey="tackles" name="Tackles" allowDecimals={false} tick={AXIS_TICK}
                        label={{ value: 'Tackles', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#737373' }} />
                      <YAxis type="number" dataKey="interceptions" name="Interceptions" allowDecimals={false} tick={AXIS_TICK}
                        label={{ value: 'Interceptions', angle: -90, position: 'insideLeft', offset: 20, fontSize: 11, fill: '#737373' }} />
                      <Tooltip content={() => null} />
                      <Scatter data={defensiveScatterData} shape={(props: unknown) => ScatterDot(props as Record<string, unknown>)}
                        onClick={(data: unknown) => { const d = data as { name: string; tackles: number; interceptions: number }; setDefPopup(d) }}
                        style={{ cursor: 'pointer' }} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )

              const chart3 = (
                <div className={`${CARD} p-4`}>
                  <p className={`text-xs ${MUTED} mb-1`}>Pass accuracy vs volume — tap a dot to see details (min 3 games)</p>
                  {pasPopup && (
                    <div className="flex items-center justify-between mb-3 px-3 py-2 rounded-xl bg-[#F5F4F2] dark:bg-[#1a1e21]">
                      <div>
                        <span className="text-sm font-semibold">{pasPopup.name}</span>
                        <span className={`text-sm ${MUTED} ml-3`}>{pasPopup.pass_accuracy}% · {pasPopup.pass_attempts} attempts</span>
                      </div>
                      <button onClick={() => setPasPopup(null)} className={`text-xs ${MUTED} hover:text-mvf`}>✕</button>
                    </div>
                  )}
                  <ResponsiveContainer width="100%" height={260}>
                    <ScatterChart margin={{ top: 20, right: 30, left: -10, bottom: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={GRID(isDark)} />
                      <XAxis type="number" dataKey="pass_attempts" name="Attempts" allowDecimals={false} tick={AXIS_TICK}
                        label={{ value: 'Pass attempts', position: 'insideBottom', offset: -10, fontSize: 11, fill: '#737373' }} />
                      <YAxis type="number" dataKey="pass_accuracy" name="Accuracy" domain={[0, 100]} tick={AXIS_TICK}
                        tickFormatter={(v: number) => `${v}%`}
                        label={{ value: 'Accuracy %', angle: -90, position: 'insideLeft', offset: 15, fontSize: 11, fill: '#737373' }} />
                      <Tooltip content={() => null} />
                      <Scatter data={passingScatterData} shape={(props: unknown) => ScatterDot(props as Record<string, unknown>)}
                        onClick={(data: unknown) => { const d = data as { name: string; pass_attempts: number; pass_accuracy: number }; setPasPopup(d) }}
                        style={{ cursor: 'pointer' }} />
                    </ScatterChart>
                  </ResponsiveContainer>
                </div>
              )

              return (
                <>
                  {/* Mobile: swipe carousel */}
                  <div className="md:hidden">
                    <div
                      ref={archetypeScrollRef}
                      onScroll={handleArchetypeScroll}
                      className="flex overflow-x-auto snap-x snap-mandatory scroll-smooth"
                      style={{ scrollbarWidth: 'none' }}
                    >
                      {[chart1, chart2, chart3].map((chart, i) => (
                        <div key={i} className="shrink-0 w-full snap-start">{chart}</div>
                      ))}
                    </div>
                    <div className="flex justify-center gap-2 mt-3">
                      {[0, 1, 2].map(i => (
                        <button key={i} onClick={() => scrollToArchetype(i)}
                          className={`rounded-full transition-all duration-200 ${archetypeSlide === i ? 'w-5 h-2 bg-mvf' : 'w-2 h-2 bg-gray-300 dark:bg-gray-600'}`}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Desktop: stacked */}
                  <div className="hidden md:block space-y-4">
                    {chart1}
                    {chart2}
                    {chart3}
                  </div>
                </>
              )
            })()}
          </section>
        )}

        {/* Shot Profile */}
        {shotProfileData.length > 0 && (
          <section>
            <SectionHeading>Shot Profile</SectionHeading>
            <div className={`${CARD} p-4`}>
              <div className="flex text-xs text-[#737373] mb-2 gap-3">
                <span className="w-28 shrink-0" />
                <span className="flex-1">On target / off target</span>
                <span className="w-12 text-right">Acc.</span>
                <span className="w-14 text-right">Shots</span>
              </div>
              <div className="space-y-2.5">
                {shotProfileData.map(p => (
                  <div key={p.name} className="flex items-center gap-3">
                    <div className="w-28 shrink-0 text-sm font-medium truncate">{p.name}</div>
                    <div className="flex-1 flex h-5 rounded overflow-hidden">
                      <div
                        className="bg-mvf flex items-center justify-end pr-1 min-w-0"
                        style={{ width: `${(p.sot / p.total) * 100}%` }}
                        title={`${p.sot} on target`}
                      >
                        {p.sot > 0 && <span className="text-white text-[10px] font-bold leading-none">{p.sot}</span>}
                      </div>
                      <div
                        className="bg-[#E5E4E0] dark:bg-[#2a2e31] flex items-center pl-1 min-w-0"
                        style={{ width: `${(p.missed / p.total) * 100}%` }}
                        title={`${p.missed} off target`}
                      >
                        {p.missed > 0 && <span className="text-[#737373] text-[10px] leading-none">{p.missed}</span>}
                      </div>
                    </div>
                    <div className="w-12 text-right text-sm font-semibold">{p.accuracy}%</div>
                    <div className="w-14 text-right text-xs text-[#737373]">{p.total}</div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Participation */}
        <section>
          <SectionHeading>Participation</SectionHeading>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className={`${CARD} p-4`}>
              <p className={`text-xs font-semibold ${MUTED} uppercase tracking-widest mb-3`}>Games Played</p>
              <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                {participationData.map((p, i) => (
                  <div key={p.name} className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      <span className={`${MUTED} w-5 text-right text-xs`}>{i + 1}</span>
                      <span className="font-medium">{p.name}</span>
                    </span>
                    <span className="font-semibold">{p.count}</span>
                  </div>
                ))}
              </div>
            </div>
            <div className={`${CARD} p-4`}>
              <p className={`text-xs font-semibold ${MUTED} uppercase tracking-widest mb-3`}>Top Consecutive Streaks</p>
              <div className="space-y-4">
                {streaksData.length === 0
                  ? <p className={`text-sm ${MUTED}`}>No data yet</p>
                  : streaksData.map((s, i) => (
                    <div key={s.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className={`${MUTED} text-sm w-4`}>{i + 1}</span>
                        <span className="text-sm font-medium">{s.name}</span>
                      </div>
                      <span className="text-sm font-semibold">{s.streak} in a row</span>
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        </section>

        {/* TOTW History */}
        {totwTimeline.players.length > 0 && (
          <section>
            <SectionHeading>Team of the Week History</SectionHeading>
            <div className={`${CARD} p-4`}>
              <div className="overflow-x-auto">
                <div className="space-y-1.5" style={{ minWidth: `${totwTimeline.games.length * 20 + 180}px` }}>
                  <div className="flex items-end gap-2 mb-2">
                    <span className="w-36 shrink-0" />
                    {totwTimeline.games.map(g => (
                      <div key={g.gameId} className="w-4 flex-shrink-0 text-center" title={g.label}>
                        {g.label.split(' ').map((part, i) => (
                          <div key={i} className="text-[8px] text-[#737373] leading-tight">{part}</div>
                        ))}
                      </div>
                    ))}
                    <span className="w-8 text-[10px] text-[#737373] text-center ml-1">Tot</span>
                  </div>
                  {totwTimeline.players.map(p => (
                    <div key={p.id} className="flex items-center gap-2">
                      <span className="w-36 shrink-0 text-sm font-medium truncate">{p.name}</span>
                      {totwTimeline.games.map(g => (
                        <div
                          key={g.gameId}
                          title={`${p.name} — ${g.label}`}
                          className={`w-4 h-4 flex-shrink-0 rounded-sm ${g.playerIds.has(p.id) ? 'bg-mvf' : 'bg-[#F5F4F2] dark:bg-[#1a1e21]'}`}
                        />
                      ))}
                      <span className="w-8 text-center text-sm font-semibold text-mvf ml-1">{p.count}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Group Identity Radar */}
        {radarData.length > 0 && (
          <section>
            <SectionHeading>Group Identity</SectionHeading>
            <div className={`${CARD} p-4`}>
              <ResponsiveContainer width="100%" height={280}>
                <RadarChart data={radarData}>
                  <PolarGrid stroke={GRID(isDark)} />
                  <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: textMain }} />
                  <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar dataKey="value" stroke="#B0000F" fill="#B0000F" fillOpacity={0.3} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
