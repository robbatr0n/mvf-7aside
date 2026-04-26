import { useMemo } from 'react'
import { useParams, Link } from 'react-router-dom'
import { usePlayers } from '../hooks/usePlayers'
import { useEvents } from '../hooks/useEvents'
import { useGames } from '../hooks/useGames'
import { useGamePlayers } from '../hooks/useGamePlayers'
import { useStats } from '../hooks/useStats'
import { useGoalkeeperStats } from '../hooks/useGoalKeeperStats'
import { useTeamStats } from '../hooks/useTeamStats'
import { calculatePlayerStatsForGames, calculatePlayerGameBreakdown } from '../utils/stats'
import { getAvatarColor } from '../utils/avatar'
import { useTheme } from '../hooks/useTheme'
import { ComposedChart, Line, XAxis, Tooltip, ResponsiveContainer } from 'recharts'

function VersusRow({
  label, aVal, bVal, aDisplay, bDisplay, higherIsBetter = true,
}: {
  label: string
  aVal: number
  bVal: number
  aDisplay?: string
  bDisplay?: string
  higherIsBetter?: boolean
}) {
  const { isDark } = useTheme()
  const aWins = higherIsBetter ? aVal > bVal : aVal < bVal
  const bWins = higherIsBetter ? bVal > aVal : bVal < aVal
  const equal = !aWins && !bWins
  const max = Math.max(aVal, bVal, 0.001)
  const aBarW = equal ? 50 : aWins ? 100 : Math.round((aVal / max) * 100)
  const bBarW = equal ? 50 : bWins ? 100 : Math.round((bVal / max) * 100)
  const muted = isDark ? '#374151' : '#D1D5DB'
  const green = '#16a34a'
  const textMain = isDark ? '#E5E6E3' : '#1C1C1C'

  return (
    <div className="py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
      <div className="flex items-center mb-1.5">
        <span className="text-sm font-semibold w-12 text-left tabular-nums"
          style={{ color: aWins ? green : textMain }}>
          {aDisplay ?? aVal}
        </span>
        <span className="text-gray-500 dark:text-[#9CA3AF] text-xs text-center flex-1">{label}</span>
        <span className="text-sm font-semibold w-12 text-right tabular-nums"
          style={{ color: bWins ? green : textMain }}>
          {bDisplay ?? bVal}
        </span>
      </div>
      <div className="flex h-1.5 gap-px">
        <div className="flex-1 flex justify-end">
          <div
            className="h-full rounded-l-full transition-all duration-500"
            style={{ width: `${aBarW}%`, background: (!equal && aWins) ? green : muted }}
          />
        </div>
        <div className="flex-1">
          <div
            className="h-full rounded-r-full transition-all duration-500"
            style={{ width: `${bBarW}%`, background: (!equal && bWins) ? green : muted }}
          />
        </div>
      </div>
    </div>
  )
}

export default function Compare() {
  const { id1, id2 } = useParams<{ id1: string; id2: string }>()
  const { players, loading: playersLoading } = usePlayers()
  const { events, loading: eventsLoading } = useEvents()
  const { games, loading: gamesLoading } = useGames()
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers()
  const { stats } = useStats(players, events, games, gamePlayers)
  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers)
  const { totwAppearances, motmAppearances } = useTeamStats(stats, goalkeeperStats, players, events, games, gamePlayers)
  const { isDark } = useTheme()

  const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading

  const player1 = players.find(p => p.id === id1)
  const player2 = players.find(p => p.id === id2)

  const p1Stats = stats.find(s => s.player.id === id1)
  const p2Stats = stats.find(s => s.player.id === id2)
  const p1GkStats = goalkeeperStats.find(s => s.player.id === id1)
  const p2GkStats = goalkeeperStats.find(s => s.player.id === id2)

  const isP1Gk = player1?.is_goalkeeper ?? false
  const isP2Gk = player2?.is_goalkeeper ?? false
  const bothOutfield = !isP1Gk && !isP2Gk
  const bothGk = isP1Gk && isP2Gk

  const sharedGameIds = useMemo(() => {
    if (!id1 || !id2) return new Set<string>()
    const p1GameIds = new Set(gamePlayers.filter(gp => gp.player_id === id1).map(gp => gp.game_id))
    const p2GameIds = new Set(gamePlayers.filter(gp => gp.player_id === id2).map(gp => gp.game_id))
    return new Set([...p1GameIds].filter(id => p2GameIds.has(id)))
  }, [gamePlayers, id1, id2])

  const h2hStats1 = useMemo(() => {
    if (!player1 || !bothOutfield || sharedGameIds.size < 3) return null
    return calculatePlayerStatsForGames(player1, sharedGameIds, events, gamePlayers, games)
  }, [player1, bothOutfield, sharedGameIds, events, gamePlayers, games])

  const h2hStats2 = useMemo(() => {
    if (!player2 || !bothOutfield || sharedGameIds.size < 3) return null
    return calculatePlayerStatsForGames(player2, sharedGameIds, events, gamePlayers, games)
  }, [player2, bothOutfield, sharedGameIds, events, gamePlayers, games])

  const chartData = useMemo(() => {
    if (!id1 || !id2 || !bothOutfield) return []
    const bd1 = calculatePlayerGameBreakdown(id1, events, games, gamePlayers)
    const bd2 = calculatePlayerGameBreakdown(id2, events, games, gamePlayers)
    const score = (g: typeof bd1[0]) =>
      Math.round((g.goals * 4 + g.assists * 2.5 + g.shots_on_target * 0.5 + g.key_passes * 0.5 + g.tackles + g.interceptions) * 10) / 10
    const map1 = new Map(bd1.map(g => [g.game.date, score(g)]))
    const map2 = new Map(bd2.map(g => [g.game.date, score(g)]))
    const allDates = [...new Set([...map1.keys(), ...map2.keys()])]
      .sort((a, b) => new Date(a).getTime() - new Date(b).getTime())
    return allDates.map(date => ({
      date: new Date(date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }),
      a: map1.get(date) ?? null,
      b: map2.get(date) ?? null,
    }))
  }, [id1, id2, bothOutfield, events, games, gamePlayers])

  const p1Games = isP1Gk ? (p1GkStats?.games ?? 0) : (p1Stats?.games_played ?? 0)
  const p2Games = isP2Gk ? (p2GkStats?.games ?? 0) : (p2Stats?.games_played ?? 0)

  const GREEN = '#16a34a'
  const BLUE = '#3b82f6'
  const muted = isDark ? '#9CA3AF' : '#6b7280'
  const tooltipBg = isDark ? '#111518' : '#ffffff'
  const tooltipBorder = isDark ? '#2a2e31' : '#D4D3D0'

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    )
  }

  if (!player1 || !player2) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold">Player not found</p>
          <Link to="/players" className="text-gray-600 dark:text-[#9CA3AF] text-sm">← Players</Link>
        </div>
      </div>
    )
  }

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()

  const av1 = getAvatarColor(player1.name)
  const av2 = getAvatarColor(player2.name)

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

        <Link
          to="/players"
          className="inline-block text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors"
        >
          ← Players
        </Link>

        {/* Header */}
        <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-5">
          <div className="flex items-center justify-between">
            <Link to={`/player/${id1}`} className="flex flex-col items-center gap-2 flex-1 group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${av1}`}>
                {getInitials(player1.name)}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-[#1C1C1C] dark:text-[#E5E6E3] group-hover:text-mvf transition-colors leading-tight">
                  {player1.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
                  {p1Games} {p1Games === 1 ? 'game' : 'games'}
                </p>
              </div>
            </Link>

            <div className="text-gray-400 dark:text-[#6b7280] font-bold text-sm px-4">vs</div>

            <Link to={`/player/${id2}`} className="flex flex-col items-center gap-2 flex-1 group">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-base ${av2}`}>
                {getInitials(player2.name)}
              </div>
              <div className="text-center">
                <p className="font-semibold text-sm text-[#1C1C1C] dark:text-[#E5E6E3] group-hover:text-mvf transition-colors leading-tight">
                  {player2.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
                  {p2Games} {p2Games === 1 ? 'game' : 'games'}
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* Outfield sections */}
        {bothOutfield && p1Stats && p2Stats && (
          <>
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Attacking</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow label="Goals per Game" aVal={p1Stats.goals_per_game} bVal={p2Stats.goals_per_game} />
                <VersusRow label="Key Passes per Game" aVal={p1Stats.key_passes_per_game} bVal={p2Stats.key_passes_per_game} />
                <VersusRow label="Goal Involvements" aVal={p1Stats.goal_involvements} bVal={p2Stats.goal_involvements} />
                <VersusRow label="Hat Tricks" aVal={p1Stats.hat_tricks} bVal={p2Stats.hat_tricks} />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Defending</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow label="Def. Actions per Game" aVal={p1Stats.defensive_actions_per_game} bVal={p2Stats.defensive_actions_per_game} />
                <VersusRow label="Tackles per Game" aVal={p1Stats.tackles_per_game} bVal={p2Stats.tackles_per_game} />
                <VersusRow label="Interceptions per Game" aVal={p1Stats.interceptions_per_game} bVal={p2Stats.interceptions_per_game} />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Shooting</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow
                  label="Total Shots"
                  aVal={p1Stats.shots_on_target + p1Stats.shots_off_target}
                  bVal={p2Stats.shots_on_target + p2Stats.shots_off_target}
                />
                <VersusRow
                  label="Shot Accuracy"
                  aVal={p1Stats.shot_accuracy}
                  bVal={p2Stats.shot_accuracy}
                  aDisplay={p1Stats.shots_on_target + p1Stats.shots_off_target > 0 ? `${p1Stats.shot_accuracy}%` : '—'}
                  bDisplay={p2Stats.shots_on_target + p2Stats.shots_off_target > 0 ? `${p2Stats.shot_accuracy}%` : '—'}
                />
                <VersusRow
                  label="Shot Conversion"
                  aVal={p1Stats.shot_conversion}
                  bVal={p2Stats.shot_conversion}
                  aDisplay={p1Stats.shots_on_target + p1Stats.shots_off_target > 0 ? `${p1Stats.shot_conversion}%` : '—'}
                  bDisplay={p2Stats.shots_on_target + p2Stats.shots_off_target > 0 ? `${p2Stats.shot_conversion}%` : '—'}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Passing</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow
                  label="Passes Completed"
                  aVal={p1Stats.passes_completed}
                  bVal={p2Stats.passes_completed}
                />
                <VersusRow
                  label="Pass Accuracy"
                  aVal={p1Stats.pass_accuracy}
                  bVal={p2Stats.pass_accuracy}
                  aDisplay={p1Stats.pass_attempts > 0 ? `${p1Stats.pass_accuracy}%` : '—'}
                  bDisplay={p2Stats.pass_attempts > 0 ? `${p2Stats.pass_accuracy}%` : '—'}
                />
                <VersusRow
                  label="Passes per Game"
                  aVal={p1Stats.passes_per_game}
                  bVal={p2Stats.passes_per_game}
                  aDisplay={p1Stats.pass_attempts > 0 ? String(p1Stats.passes_per_game) : '—'}
                  bDisplay={p2Stats.pass_attempts > 0 ? String(p2Stats.passes_per_game) : '—'}
                />
              </div>
            </section>

            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Results</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow
                  label="Win Rate"
                  aVal={p1Stats.win_rate}
                  bVal={p2Stats.win_rate}
                  aDisplay={`${p1Stats.win_rate}%`}
                  bDisplay={`${p2Stats.win_rate}%`}
                />
                <VersusRow
                  label="Man of the Match"
                  aVal={motmAppearances.get(id1 ?? '') ?? 0}
                  bVal={motmAppearances.get(id2 ?? '') ?? 0}
                />
                <VersusRow
                  label="Team of the Week"
                  aVal={totwAppearances.get(id1 ?? '') ?? 0}
                  bVal={totwAppearances.get(id2 ?? '') ?? 0}
                />
              </div>
            </section>
          </>
        )}

        {/* GK sections */}
        {bothGk && p1GkStats && p2GkStats && (
          <>
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Goalkeeping</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow
                  label="Save %"
                  aVal={p1GkStats.savePercentage}
                  bVal={p2GkStats.savePercentage}
                  aDisplay={`${p1GkStats.savePercentage}%`}
                  bDisplay={`${p2GkStats.savePercentage}%`}
                />
                <VersusRow
                  label="Clean Sheet %"
                  aVal={p1GkStats.cleanSheetPercentage}
                  bVal={p2GkStats.cleanSheetPercentage}
                  aDisplay={`${p1GkStats.cleanSheetPercentage}%`}
                  bDisplay={`${p2GkStats.cleanSheetPercentage}%`}
                />
                <VersusRow label="Saves per Game" aVal={p1GkStats.savesPerGame} bVal={p2GkStats.savesPerGame} />
              </div>
            </section>
            <section className="space-y-2">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Results</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <VersusRow
                  label="Win Rate"
                  aVal={p1GkStats.win_rate}
                  bVal={p2GkStats.win_rate}
                  aDisplay={`${p1GkStats.win_rate}%`}
                  bDisplay={`${p2GkStats.win_rate}%`}
                />
              </div>
            </section>
          </>
        )}

        {/* Mixed type notice */}
        {!bothOutfield && !bothGk && (
          <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-5 text-center">
            <p className="text-gray-500 dark:text-[#9CA3AF] text-sm">
              Direct stat comparison isn't available between a goalkeeper and an outfield player.
            </p>
          </div>
        )}

        {/* Head to Head */}
        {bothOutfield && h2hStats1 && h2hStats2 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
              Head to Head — {sharedGameIds.size} shared games
            </h2>
            <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
              <VersusRow label="Goals per Game" aVal={h2hStats1.goals_per_game} bVal={h2hStats2.goals_per_game} />
              <VersusRow label="Goal Involvements" aVal={h2hStats1.goal_involvements} bVal={h2hStats2.goal_involvements} />
              <VersusRow label="Def. Actions per Game" aVal={h2hStats1.defensive_actions_per_game} bVal={h2hStats2.defensive_actions_per_game} />
              <VersusRow
                label="Pass Accuracy"
                aVal={h2hStats1.pass_accuracy}
                bVal={h2hStats2.pass_accuracy}
                aDisplay={h2hStats1.pass_attempts > 0 ? `${h2hStats1.pass_accuracy}%` : '—'}
                bDisplay={h2hStats2.pass_attempts > 0 ? `${h2hStats2.pass_accuracy}%` : '—'}
              />
              <VersusRow
                label="Win Rate"
                aVal={h2hStats1.win_rate}
                bVal={h2hStats2.win_rate}
                aDisplay={`${h2hStats1.win_rate}%`}
                bDisplay={`${h2hStats2.win_rate}%`}
              />
            </div>
          </section>
        )}

        {/* Performance chart */}
        {bothOutfield && chartData.length >= 2 && (
          <section className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Performance</h2>
            <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-5">
              <div className="flex items-center gap-4 mb-3">
                <span className="flex items-center gap-1.5 text-xs" style={{ color: GREEN }}>
                  <span className="inline-block w-4 border-t-2" style={{ borderColor: GREEN }} />
                  {player1.name.split(' ')[0]}
                </span>
                <span className="flex items-center gap-1.5 text-xs" style={{ color: BLUE }}>
                  <span className="inline-block w-4 border-t-2" style={{ borderColor: BLUE }} />
                  {player2.name.split(' ')[0]}
                </span>
              </div>
              <ResponsiveContainer width="100%" height={140}>
                <ComposedChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: muted }}
                    tickLine={false}
                    axisLine={{ stroke: isDark ? '#2a2e31' : '#D4D3D0' }}
                    interval="preserveStartEnd"
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (!active || !payload?.length) return null
                      return (
                        <div
                          style={{ background: tooltipBg, border: `1px solid ${tooltipBorder}` }}
                          className="rounded-xl px-3 py-2 text-xs space-y-1 shadow-md"
                        >
                          <p style={{ color: muted }}>{label}</p>
                          {payload.map((p, i) =>
                            p.value !== null && (
                              <p key={i} style={{ color: p.stroke as string }}>
                                {i === 0 ? player1.name.split(' ')[0] : player2.name.split(' ')[0]}:{' '}
                                <span className="font-semibold">{p.value}</span>
                              </p>
                            )
                          )}
                        </div>
                      )
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="a"
                    stroke={GREEN}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: GREEN }}
                    connectNulls
                  />
                  <Line
                    type="monotone"
                    dataKey="b"
                    stroke={BLUE}
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4, fill: BLUE }}
                    connectNulls
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </section>
        )}

      </div>
    </div>
  )
}
