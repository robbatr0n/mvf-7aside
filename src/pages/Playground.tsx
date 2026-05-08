import { useMemo, useState } from 'react'
import { usePlayers } from '../hooks/usePlayers'
import { useGames } from '../hooks/useGames'
import { useEvents } from '../hooks/useEvents'
import { useGamePlayers } from '../hooks/useGamePlayers'
import { calcGameScore } from '../utils/stats/scoring'
import { TOTW_CAP } from '../utils/constants'
import { PlayerPin } from '../components/shared/PlayerPin'
import type { Event } from '../types'

// ─── Tunable params ───────────────────────────────────────────────────────────

interface PlaygroundParams {
  goalWeight: number
  assistWeight: number
  sotWeight: number
  keyPassWeight: number
  tackleWeight: number
  interceptionWeight: number
  passWeight: number
  totwCap: number
  curvePower: number
}

const DEFAULT_PARAMS: PlaygroundParams = {
  goalWeight: 4,
  assistWeight: 2.5,
  sotWeight: 0.5,
  keyPassWeight: 0.5,
  tackleWeight: 1,
  interceptionWeight: 1,
  passWeight: 0.2,
  totwCap: 65,
  curvePower: 0.5,
}

// ─── Formulas ─────────────────────────────────────────────────────────────────

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

function defaultToRating(score: number): number {
  const n = Math.min(score / TOTW_CAP, 1)
  return Math.min(10, Math.round(Math.sqrt(n) * 100) / 10)
}

// ─── UI components ────────────────────────────────────────────────────────────

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
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{label}</span>
        <span className={`text-xs font-mono tabular-nums ${changed ? 'text-green-400' : 'text-gray-500'}`}>
          {value % 1 === 0 ? value.toFixed(0) : value}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={e => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-green-500"
      />
    </div>
  )
}

function PitchPreview({
  outfield,
  getRating,
}: {
  outfield: { player: { name: string }; score: number }[]
  getRating: (score: number) => number
}) {
  const forwards = outfield.slice(0, 1)
  const mids = outfield.slice(1, 4)
  const defenders = outfield.slice(4, 7)

  return (
    <div
      className="relative w-full rounded-2xl overflow-hidden"
      style={{
        background: 'linear-gradient(to bottom, #166534, #15803d, #16a34a)',
        paddingBottom: 'min(110%, 480px)',
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
        <div className="flex justify-around w-full mb-2">
          {defenders.map((p, i) => (
            <PlayerPin key={i} name={p.player.name} rating={getRating(p.score)} />
          ))}
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Playground() {
  const [params, setParams] = useState<PlaygroundParams>(DEFAULT_PARAMS)
  const [controlsOpen, setControlsOpen] = useState(true)

  const { players, loading: playersLoading } = usePlayers()
  const { games, loading: gamesLoading } = useGames()
  const { events, loading: eventsLoading } = useEvents()
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers()

  const loading = playersLoading || gamesLoading || eventsLoading || gamePlayersLoading

  const set = (key: keyof PlaygroundParams) => (v: number) =>
    setParams(p => ({ ...p, [key]: v }))

  const latestGame = useMemo(
    () => [...games].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0] ?? null,
    [games],
  )

  const { totwOutfield, allGamePlayers } = useMemo(() => {
    if (!latestGame) return { totwOutfield: [], allGamePlayers: [] }

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

    const totwOutfield = scored.slice(0, 7)
    const totwIds = new Set(totwOutfield.map(p => p.player.id))

    return {
      totwOutfield,
      allGamePlayers: scored.map(p => ({ ...p, inTotw: totwIds.has(p.player.id) })),
    }
  }, [latestGame, events, gamePlayers, players, params])

  const getRating = (score: number) => customToRating(score, params)

  const hasChanges = (Object.keys(DEFAULT_PARAMS) as (keyof PlaygroundParams)[]).some(
    k => params[k] !== DEFAULT_PARAMS[k]
  )

  return (
    <div className="min-h-screen bg-gray-950 text-white pb-12">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 py-3 flex items-center justify-between">
        <div>
          <h1 className="text-base font-bold leading-tight">Ratings Playground</h1>
          {latestGame && (
            <p className="text-[11px] text-gray-500 leading-tight">
              {new Date(latestGame.date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
          )}
        </div>
        {hasChanges && (
          <button
            onClick={() => setParams(DEFAULT_PARAMS)}
            className="text-xs text-gray-400 hover:text-white border border-gray-700 hover:border-gray-500 rounded-lg px-3 py-1.5 transition-colors"
          >
            Reset
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40 text-gray-500 text-sm">Loading...</div>
      ) : (
        <div className="px-4 pt-5 space-y-6">

          {/* Controls */}
          <div className="bg-gray-900 rounded-2xl overflow-hidden">
            <button
              onClick={() => setControlsOpen(o => !o)}
              className="w-full flex items-center justify-between px-4 py-3.5 text-left"
            >
              <span className="text-xs font-semibold uppercase tracking-widest text-gray-400">Weights & Curve</span>
              <span className="text-gray-600 text-sm">{controlsOpen ? '▲' : '▼'}</span>
            </button>

            {controlsOpen && (
              <div className="px-4 pb-5 space-y-5 border-t border-gray-800">
                <div className="pt-4 space-y-4">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Game Score Weights</p>
                  <SliderRow label="Goal" value={params.goalWeight} min={1} max={10} step={0.5} defaultValue={DEFAULT_PARAMS.goalWeight} onChange={set('goalWeight')} />
                  <SliderRow label="Assist" value={params.assistWeight} min={0.5} max={5} step={0.5} defaultValue={DEFAULT_PARAMS.assistWeight} onChange={set('assistWeight')} />
                  <SliderRow label="Shot on Target" value={params.sotWeight} min={0.1} max={2} step={0.1} defaultValue={DEFAULT_PARAMS.sotWeight} onChange={set('sotWeight')} />
                  <SliderRow label="Key Pass" value={params.keyPassWeight} min={0.1} max={2} step={0.1} defaultValue={DEFAULT_PARAMS.keyPassWeight} onChange={set('keyPassWeight')} />
                  <SliderRow label="Tackle" value={params.tackleWeight} min={0.2} max={3} step={0.2} defaultValue={DEFAULT_PARAMS.tackleWeight} onChange={set('tackleWeight')} />
                  <SliderRow label="Interception" value={params.interceptionWeight} min={0.2} max={3} step={0.2} defaultValue={DEFAULT_PARAMS.interceptionWeight} onChange={set('interceptionWeight')} />
                  <SliderRow label="Pass Completed" value={params.passWeight} min={0.05} max={1} step={0.05} defaultValue={DEFAULT_PARAMS.passWeight} onChange={set('passWeight')} />
                </div>

                <div className="space-y-4 pt-1">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-600">Rating Curve</p>
                  <SliderRow label="TOTW Cap" value={params.totwCap} min={20} max={120} step={5} defaultValue={DEFAULT_PARAMS.totwCap} onChange={set('totwCap')} />
                  <SliderRow label="Curve Power" value={params.curvePower} min={0.1} max={1} step={0.05} defaultValue={DEFAULT_PARAMS.curvePower} onChange={set('curvePower')} />
                  <div className="flex gap-2 flex-wrap pt-1">
                    {[5, 10, 20, 35, 50, 65].map(score => (
                      <div key={score} className="text-xs bg-gray-800 rounded-lg px-2.5 py-1 text-center">
                        <span className="text-gray-500">{score}pt</span>
                        <span className="text-white font-mono ml-1">→ {customToRating(score, params).toFixed(1)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* TOTW Pitch */}
          <div className="space-y-2">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-1">Team of the Week</p>
            {totwOutfield.length > 0 ? (
              <PitchPreview outfield={totwOutfield} getRating={getRating} />
            ) : (
              <p className="text-gray-600 text-sm px-1">No game data</p>
            )}
          </div>

          {/* All players in latest game */}
          {allGamePlayers.length > 0 && (
            <div className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500 px-1">Latest Game — All Players</p>
              <div className="bg-gray-900 rounded-2xl divide-y divide-gray-800">
                {allGamePlayers.map((entry, i) => {
                  const customRating = getRating(entry.score)
                  const defRating = defaultToRating(entry.defaultScore)
                  const delta = Math.round((customRating - defRating) * 10) / 10
                  return (
                    <div key={i} className={`flex items-center justify-between px-4 py-3 ${entry.inTotw ? 'bg-green-950/30' : ''}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sm text-gray-200 truncate">{entry.player.name}</span>
                        {entry.inTotw && (
                          <span className="text-[9px] font-bold text-green-400 bg-green-950 border border-green-800 rounded px-1 py-0.5 shrink-0">TOTW</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 ml-2">
                        <span className="text-xs text-gray-500 font-mono tabular-nums w-10 text-right">{entry.score.toFixed(1)}</span>
                        <span className="text-sm font-bold text-white font-mono tabular-nums w-8 text-right">{customRating.toFixed(1)}</span>
                        <span className={`text-xs font-mono tabular-nums w-8 text-right ${delta > 0 ? 'text-green-400' : delta < 0 ? 'text-red-400' : 'text-gray-700'}`}>
                          {delta > 0 ? '+' : ''}{delta !== 0 ? delta.toFixed(1) : '—'}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
              <div className="flex justify-end gap-3 px-1 pt-1">
                <span className="text-[10px] text-gray-600">score</span>
                <span className="text-[10px] text-gray-600 w-8 text-right">rating</span>
                <span className="text-[10px] text-gray-600 w-8 text-right">Δ def</span>
              </div>
            </div>
          )}

        </div>
      )}
    </div>
  )
}
