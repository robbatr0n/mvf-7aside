import { useMemo, useState } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useEvents } from '../hooks/useEvents'
import { useGamePlayers } from '../hooks/useGamePlayers'
import { useStats } from '../hooks/useStats'
import { useGoalkeeperStats } from '../hooks/useGoalKeeperStats'
import { calcGameScore, calcSeasonScore } from '../utils/stats/scoring'
import { TOTW_CAP, OVR_FLOOR, OVR_RANGE } from '../utils/constants'
import { PlayerPin } from '../components/shared/PlayerPin'
import type { Event, PlayerStats } from '../types'

// ─── Tunable params ───────────────────────────────────────────────────────────

interface PlaygroundParams {
  goalWeight: number
  assistWeight: number
  sotWeight: number
  keyPassWeight: number
  tackleWeight: number
  interceptionWeight: number
  passWeight: number
  winRateWeight: number
  totwCap: number
  curvePower: number
  ovrFloor: number
  ovrRange: number
}

const DEFAULT_PARAMS: PlaygroundParams = {
  goalWeight: 4,
  assistWeight: 2.5,
  sotWeight: 0.5,
  keyPassWeight: 0.5,
  tackleWeight: 1,
  interceptionWeight: 1,
  passWeight: 0.2,
  winRateWeight: 2,
  totwCap: 65,
  curvePower: 0.5,
  ovrFloor: 65,
  ovrRange: 26,
}

// ─── Inline formulas (mirrors production, uses params instead of constants) ───

function customGameScore(playerEvents: Event[], p: PlaygroundParams): number {
  const goals = playerEvents.filter(e => e.event_type === 'goal').length
  const assists = playerEvents.filter(e => e.event_type === 'assist').length
  const sot = playerEvents.filter(e => e.event_type === 'shot_on_target').length
  const kp = playerEvents.filter(e => e.event_type === 'key_pass').length
  const tackles = playerEvents.filter(e => e.event_type === 'tackle').length
  const interceptions = playerEvents.filter(e => e.event_type === 'interception').length
  const passCompleted = playerEvents.filter(e => e.event_type === 'pass_completed').length
  const hasPass = playerEvents.some(
    e => e.event_type === 'pass_completed' || e.event_type === 'pass_received' || e.event_type === 'pass_failed'
  )
  return (
    goals * p.goalWeight +
    assists * p.assistWeight +
    sot * p.sotWeight +
    kp * p.keyPassWeight +
    tackles * p.tackleWeight +
    interceptions * p.interceptionWeight +
    (hasPass ? passCompleted * p.passWeight : 0)
  )
}

function customToRating(score: number, p: PlaygroundParams): number {
  const normalised = Math.min(score / p.totwCap, 1)
  const curved = Math.pow(normalised, p.curvePower)
  return Math.min(10, Math.round(curved * 100) / 10)
}

function customSeasonScore(s: PlayerStats, p: PlaygroundParams): number {
  if (s.games_played === 0) return 0
  const passScore = s.games_with_passing > 0
    ? (s.passes_completed / s.games_with_passing) * p.passWeight
    : 0
  return (
    s.goals_per_game * p.goalWeight +
    (s.assists / s.games_played) * p.assistWeight +
    (s.shots_on_target / s.games_played) * p.sotWeight +
    (s.key_passes / s.games_played) * p.keyPassWeight +
    s.tackles_per_game * p.tackleWeight +
    s.interceptions_per_game * p.interceptionWeight +
    (s.wins / s.games_played) * p.winRateWeight +
    passScore
  )
}

// ─── Internal UI components ───────────────────────────────────────────────────

function SliderRow({
  label,
  value,
  min,
  max,
  step,
  defaultValue,
  onChange,
}: {
  label: string
  value: number
  min: number
  max: number
  step: number
  defaultValue: number
  onChange: (v: number) => void
}) {
  const changed = value !== defaultValue
  return (
    <div className="flex items-center gap-3">
      <span className="text-xs text-gray-400 w-36 shrink-0">{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="flex-1 h-1 accent-green-500"
      />
      <span
        className={`text-xs font-mono w-10 text-right tabular-nums ${changed ? 'text-green-400' : 'text-gray-500'}`}
      >
        {value % 1 === 0 ? value.toFixed(0) : value}
      </span>
    </div>
  )
}

function ParamSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-widest text-gray-500">{title}</h3>
      <div className="space-y-2">{children}</div>
    </div>
  )
}

function PitchPreview({
  outfield,
  goalkeeper,
  getRating,
}: {
  outfield: { player: { name: string }; score: number }[]
  goalkeeper: { player: { name: string }; score: number } | null
  getRating: (score: number) => number
}) {
  const hasKeeper = goalkeeper !== null
  const forwards = outfield.slice(0, 1)
  const mids = hasKeeper ? outfield.slice(1, 3) : outfield.slice(1, 4)
  const defenders = hasKeeper ? outfield.slice(3, 6) : outfield.slice(4, 7)

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #166534, #15803d, #16a34a)',
        paddingBottom: 'min(110%, 500px)',
      }}
    >
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 400 280"
        preserveAspectRatio="xMidYMid slice"
        style={{ transform: 'scaleY(-1)' }}
      >
        <rect x="10" y="10" width="380" height="260" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <circle cx="200" cy="280" r="50" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <path d="M 155 10 A 50 50 0 0 1 245 10" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <rect x="110" y="10" width="180" height="60" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <rect x="155" y="10" width="90" height="25" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <line x1="10" y1="280" x2="390" y2="280" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
        <circle cx="200" cy="55" r="2.5" fill="rgba(255,255,255,0.4)" />
      </svg>

      <div className="absolute inset-0 flex flex-col justify-between py-6 px-4">
        <div className="flex justify-around w-full mt-2">
          {forwards.map((p, i) => (
            <PlayerPin key={i} name={p.player.name} rating={getRating(p.score)} isMotm={i === 0} />
          ))}
        </div>
        <div className="flex justify-around w-full">
          {mids.map((p, i) => (
            <PlayerPin key={i} name={p.player.name} rating={getRating(p.score)} />
          ))}
        </div>
        <div className="flex justify-around w-full">
          {defenders.map((p, i) => (
            <PlayerPin key={i} name={p.player.name} rating={getRating(p.score)} />
          ))}
        </div>
        {hasKeeper ? (
          <div className="flex justify-around w-full mb-2">
            <PlayerPin name={goalkeeper!.player.name} isKeeper />
          </div>
        ) : (
          <div className="flex justify-around w-full mb-2">
            <PlayerPin empty />
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Playground() {
  const [phase, setPhase] = useState<'auth' | 'playground'>('auth')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [params, setParams] = useState<PlaygroundParams>(DEFAULT_PARAMS)

  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { events, loading: eventsLoading } = useEvents()
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers()
  const { stats } = useStats(players, events, games, gamePlayers)
  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers)

  const loading = playersLoading || gamesLoading || eventsLoading || gamePlayersLoading

  function handleAuth() {
    if (password === import.meta.env.VITE_TAGGER_PASSWORD) {
      setPhase('playground')
    } else {
      setAuthError('Incorrect password')
    }
  }

  const set = (key: keyof PlaygroundParams) => (v: number) =>
    setParams(p => ({ ...p, [key]: v }))

  // ── Latest game ──
  const latestGame = useMemo(
    () =>
      [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null,
    [games],
  )

  // ── Custom TOTW from latest game ──
  const { totwOutfield, totwGk, allGamePlayers } = useMemo(() => {
    if (!latestGame) return { totwOutfield: [], totwGk: null, allGamePlayers: [] }

    const gameEvents = events.filter(e => e.game_id === latestGame.id)
    const gamePlayerEntries = gamePlayers.filter(gp => gp.game_id === latestGame.id)

    const outfieldEntries = gamePlayerEntries.filter(gp => {
      const player = players.find(p => p.id === gp.player_id)
      return player && !player.is_guest && !player.is_goalkeeper
    })

    const scored = outfieldEntries
      .map(gp => {
        const player = players.find(p => p.id === gp.player_id)!
        const playerEvents = gameEvents.filter(e => e.player_id === gp.player_id)
        return {
          player,
          score: Math.round(customGameScore(playerEvents, params) * 100) / 100,
          defaultScore: Math.round(calcGameScore(playerEvents) * 100) / 100,
        }
      })
      .sort((a, b) => b.score - a.score)

    const keeperEntry = gamePlayerEntries.find(gp => {
      const player = players.find(p => p.id === gp.player_id)
      return player?.is_goalkeeper
    })
    const gk = keeperEntry
      ? { player: players.find(p => p.id === keeperEntry.player_id)!, score: 0, defaultScore: 0 }
      : null

    const totwCount = gk ? 6 : 7
    const totwOutfield = scored.slice(0, totwCount)
    const totwIds = new Set(totwOutfield.map(p => p.player.id))

    return {
      totwOutfield,
      totwGk: gk,
      allGamePlayers: scored.map(p => ({ ...p, inTotw: totwIds.has(p.player.id) })),
    }
  }, [latestGame, events, gamePlayers, players, params])

  // ── OVR changes (season-wide) ──
  const ovrData = useMemo(() => {
    if (!stats.length) return []

    const customScores = stats.map(s => ({ s, score: customSeasonScore(s, params) }))
    const defaultScores = stats.map(s => ({ s, score: calcSeasonScore(s) }))
    const customMax = Math.max(...customScores.map(x => x.score), 0.01)
    const defaultMax = Math.max(...defaultScores.map(x => x.score), 0.01)

    return customScores
      .map(({ s, score }) => {
        const defaultScore = defaultScores.find(d => d.s.player.id === s.player.id)!.score
        const customOvr = Math.min(99, Math.round(params.ovrFloor + (score / customMax) * params.ovrRange))
        const defaultOvr = Math.min(99, Math.round(OVR_FLOOR + (defaultScore / defaultMax) * OVR_RANGE))
        return { player: s.player, customOvr, defaultOvr, delta: customOvr - defaultOvr }
      })
      .sort((a, b) => b.customOvr - a.customOvr)
  }, [stats, params])

  const getRating = (score: number) => customToRating(score, params)
  const defaultRating = (score: number) => {
    const n = Math.min(score / TOTW_CAP, 1)
    return Math.min(10, Math.round(Math.sqrt(n) * 100) / 10)
  }

  // ── Auth screen ──
  if (phase === 'auth') {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm space-y-4">
          <h1 className="text-white text-xl font-bold text-center">Ratings Playground</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleAuth()}
            className="w-full bg-gray-900 border border-gray-700 rounded-xl px-4 py-3 text-white outline-none focus:border-gray-500"
            autoFocus
          />
          {authError && <p className="text-red-400 text-sm text-center">{authError}</p>}
          <button
            onClick={handleAuth}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-semibold rounded-xl py-3 transition-colors"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  // ── Playground ──
  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Ratings Playground</h1>
            {latestGame && (
              <p className="text-xs text-gray-500 mt-0.5">
                Latest game: {new Date(latestGame.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            )}
          </div>
          <button
            onClick={() => setParams(DEFAULT_PARAMS)}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            Reset to defaults
          </button>
        </div>

        {loading ? (
          <div className="text-gray-500 text-sm">Loading...</div>
        ) : (
          <>
            {/* ── Controls ── */}
            <div className="bg-gray-900 rounded-2xl p-6 space-y-6">

              <ParamSection title="Game Score Weights">
                <SliderRow label="Goal" value={params.goalWeight} min={1} max={10} step={0.5} defaultValue={DEFAULT_PARAMS.goalWeight} onChange={set('goalWeight')} />
                <SliderRow label="Assist" value={params.assistWeight} min={0.5} max={5} step={0.5} defaultValue={DEFAULT_PARAMS.assistWeight} onChange={set('assistWeight')} />
                <SliderRow label="Shot on Target" value={params.sotWeight} min={0.1} max={2} step={0.1} defaultValue={DEFAULT_PARAMS.sotWeight} onChange={set('sotWeight')} />
                <SliderRow label="Key Pass" value={params.keyPassWeight} min={0.1} max={2} step={0.1} defaultValue={DEFAULT_PARAMS.keyPassWeight} onChange={set('keyPassWeight')} />
                <SliderRow label="Tackle" value={params.tackleWeight} min={0.2} max={3} step={0.2} defaultValue={DEFAULT_PARAMS.tackleWeight} onChange={set('tackleWeight')} />
                <SliderRow label="Interception" value={params.interceptionWeight} min={0.2} max={3} step={0.2} defaultValue={DEFAULT_PARAMS.interceptionWeight} onChange={set('interceptionWeight')} />
                <SliderRow label="Pass Completed" value={params.passWeight} min={0.05} max={1} step={0.05} defaultValue={DEFAULT_PARAMS.passWeight} onChange={set('passWeight')} />
              </ParamSection>

              <ParamSection title="Season Score (OVR / TOTS)">
                <p className="text-xs text-gray-600 -mt-1">Inherits game weights above, plus:</p>
                <SliderRow label="Win Rate" value={params.winRateWeight} min={0} max={5} step={0.5} defaultValue={DEFAULT_PARAMS.winRateWeight} onChange={set('winRateWeight')} />
              </ParamSection>

              <ParamSection title="Rating Curve (score → 0–10)">
                <SliderRow label="TOTW Cap" value={params.totwCap} min={20} max={120} step={5} defaultValue={DEFAULT_PARAMS.totwCap} onChange={set('totwCap')} />
                <SliderRow label="Curve Power" value={params.curvePower} min={0.1} max={1} step={0.05} defaultValue={DEFAULT_PARAMS.curvePower} onChange={set('curvePower')} />
                <div className="mt-2 flex gap-2 flex-wrap">
                  {[5, 10, 20, 35, 50, 65].map(score => (
                    <div key={score} className="text-xs bg-gray-800 rounded-lg px-2 py-1 text-center">
                      <span className="text-gray-500">{score}pts</span>
                      <span className="text-white font-mono ml-1">→ {customToRating(score, params).toFixed(1)}</span>
                    </div>
                  ))}
                </div>
              </ParamSection>

              <ParamSection title="OVR Scale">
                <SliderRow label="Floor" value={params.ovrFloor} min={50} max={75} step={1} defaultValue={DEFAULT_PARAMS.ovrFloor} onChange={set('ovrFloor')} />
                <SliderRow label="Range" value={params.ovrRange} min={10} max={40} step={1} defaultValue={DEFAULT_PARAMS.ovrRange} onChange={set('ovrRange')} />
                <p className="text-xs text-gray-600">OVR range: {params.ovrFloor} – {params.ovrFloor + params.ovrRange} (hard cap 99)</p>
              </ParamSection>
            </div>

            {/* ── TOTW Pitch ── */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">Team of the Week</h2>
              {totwOutfield.length > 0 ? (
                <PitchPreview outfield={totwOutfield} goalkeeper={totwGk} getRating={getRating} />
              ) : (
                <p className="text-gray-600 text-sm">No game data</p>
              )}
            </div>

            {/* ── All players in latest game ── */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Latest Game — All Players
              </h2>
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-gray-800">
                      <th className="text-left px-4 py-2 font-medium">Player</th>
                      <th className="text-right px-4 py-2 font-medium">Score</th>
                      <th className="text-right px-4 py-2 font-medium">Rating</th>
                      <th className="text-right px-4 py-2 font-medium">Δ Default</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allGamePlayers.map((entry, i) => {
                      const customRating = getRating(entry.score)
                      const defRating = defaultRating(entry.defaultScore)
                      const delta = Math.round((customRating - defRating) * 10) / 10
                      return (
                        <tr key={i} className={`border-b border-gray-800/50 ${entry.inTotw ? 'bg-green-950/30' : ''}`}>
                          <td className="px-4 py-2 text-gray-200">
                            {entry.player.name}
                            {entry.inTotw && <span className="ml-2 text-[10px] text-green-400 font-semibold">TOTW</span>}
                          </td>
                          <td className="px-4 py-2 text-right font-mono text-gray-400">{entry.score.toFixed(2)}</td>
                          <td className="px-4 py-2 text-right font-mono font-bold text-white">{customRating.toFixed(1)}</td>
                          <td className={`px-4 py-2 text-right font-mono text-xs ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                            {delta > 0 ? '+' : ''}{delta !== 0 ? delta.toFixed(1) : '—'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── OVR changes ── */}
            <div className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                OVR Changes — Season Wide
              </h2>
              <div className="bg-gray-900 rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-xs text-gray-600 border-b border-gray-800">
                      <th className="text-left px-4 py-2 font-medium">Player</th>
                      <th className="text-right px-4 py-2 font-medium">Default OVR</th>
                      <th className="text-right px-4 py-2 font-medium">Custom OVR</th>
                      <th className="text-right px-4 py-2 font-medium">Δ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ovrData.map((entry, i) => (
                      <tr key={i} className="border-b border-gray-800/50">
                        <td className="px-4 py-2 text-gray-200">{entry.player.name}</td>
                        <td className="px-4 py-2 text-right font-mono text-gray-400">{entry.defaultOvr}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold text-white">{entry.customOvr}</td>
                        <td className={`px-4 py-2 text-right font-mono text-xs ${entry.delta > 0 ? 'text-green-400' : entry.delta < 0 ? 'text-red-400' : 'text-gray-600'}`}>
                          {entry.delta > 0 ? '+' : ''}{entry.delta !== 0 ? entry.delta : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </>
        )}
      </div>
    </div>
  )
}
