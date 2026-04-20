import type { Game, Event, GamePlayer, Player } from '../../types'

interface Props {
  games: Game[]
  events: Event[]
  gamePlayers: GamePlayer[]
  players: Player[]
}

const TOTW_CAP = 50

function toRating(score: number): number {
  const normalised = Math.min(score / TOTW_CAP, 1)
  const curved = Math.sqrt(normalised)
  return Math.min(10, Math.round(curved * 10 * 10) / 10)
}

function compositeScore(pe: Event[]): number {
  const goals = pe.filter(e => e.event_type === 'goal').length
  const assists = pe.filter(e => e.event_type === 'assist').length
  const sot = pe.filter(e => e.event_type === 'shot_on_target').length
  const kp = pe.filter(e => e.event_type === 'key_pass').length
  const tackles = pe.filter(e => e.event_type === 'tackle').length
  const interceptions = pe.filter(e => e.event_type === 'interception').length
  return goals * 4 + assists * 2.5 + sot * 0.5 + kp * 0.5 + tackles * 1 + interceptions * 1
}

function displayName(p: Player): string {
  return p.is_guest ? 'Guest' : p.name
}

function joinNames(ps: { player: Player }[]): string {
  if (ps.length === 0) return '—'
  return ps.map(x => displayName(x.player)).join(' & ')
}

export default function LatestGameCard({ games, events, gamePlayers, players }: Props) {
  if (games.length === 0) return null

  const latestGame = [...games].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )[0]

  const isInProgress = latestGame.winning_team === null
  const gameId = latestGame.id
  const gameEvents = events.filter(e => e.game_id === gameId)
  const gpEntries = gamePlayers.filter(gp => gp.game_id === gameId)

  const team1Ids = new Set(gpEntries.filter(gp => gp.team === 1).map(gp => gp.player_id))
  const team2Ids = new Set(gpEntries.filter(gp => gp.team === 2).map(gp => gp.player_id))

  const goalEvents = gameEvents.filter(e => e.event_type === 'goal')
  const team1Score = goalEvents.filter(g =>
    g.team_override !== null ? g.team_override === 1 : team1Ids.has(g.player_id)
  ).length
  const team2Score = goalEvents.filter(g =>
    g.team_override !== null ? g.team_override === 2 : team2Ids.has(g.player_id)
  ).length

  const isDraw = latestGame.winning_team === 0
  const team1Wins = latestGame.winning_team === 1
  const team2Wins = latestGame.winning_team === 2

  interface PlayerData {
    player: Player
    score: number
    goals: number
    assists: number
  }

  const playerData: PlayerData[] = gpEntries.map(gp => {
    const player = players.find(p => p.id === gp.player_id)
    if (!player) return null
    const pe = gameEvents.filter(e => e.player_id === gp.player_id)
    const goals = pe.filter(e => e.event_type === 'goal').length
    const assists = pe.filter(e => e.event_type === 'assist').length
    const score = compositeScore(pe)
    return { player, score, goals, assists }
  }).filter(Boolean) as PlayerData[]

  // MoTM
  const outfieldScored = playerData.filter(d => !d.player.is_goalkeeper && !d.player.is_guest)
  const maxMotmScore = Math.max(...outfieldScored.map(d => d.score), 0)
  const motmCandidates = maxMotmScore > 0
    ? outfieldScored.filter(d => d.score === maxMotmScore)
    : []

  const motmStatLine = motmCandidates.length === 1
    ? [
      motmCandidates[0].goals > 0 ? `${motmCandidates[0].goals}G` : null,
      motmCandidates[0].assists > 0 ? `${motmCandidates[0].assists}A` : null,
    ].filter(Boolean).join(' · ')
    : null

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
        📌 Latest Game
      </h2>

      <div className="bg-white dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden border-t-2 border-t-mvf">

        {/* Date / status row */}
        <div className="px-5 py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] flex items-center justify-between">
          <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">
            {new Date(latestGame.date).toLocaleDateString('en-GB', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          {isInProgress && (
            <span className="inline-flex items-center gap-1.5 bg-mvf/10 border border-mvf/30 text-mvf text-xs font-medium px-2.5 py-1 rounded-full">
              ⏱ In Progress
            </span>
          )}
        </div>

        {/* Score */}
        <div className="grid grid-cols-3 items-center px-6 py-5 border-b border-[#D4D3D0] dark:border-[#2a2e31]">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold text-sm">Non Bibs</p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-3xl font-black tabular-nums ${isDraw || team1Wins ? 'text-[#1C1C1C] dark:text-[#E5E6E3]' : 'text-gray-300 dark:text-[#737373]'}`}>
              {team1Score}
            </span>
            <span className="text-gray-300 dark:text-gray-700 text-xl">:</span>
            <span className={`text-3xl font-black tabular-nums ${isDraw || team2Wins ? 'text-[#1C1C1C] dark:text-[#E5E6E3]' : 'text-gray-300 dark:text-[#737373]'}`}>
              {team2Score}
            </span>
          </div>
          <p className="text-orange-500 font-semibold text-sm text-right">🟠 Bibs</p>
        </div>

        {/* MoTM — completed games only */}
        {!isInProgress && motmCandidates.length > 0 && (
          <div className="border-b border-[#D4D3D0] dark:border-[#2a2e31] px-5 py-3.5 flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-widest mb-1">
                Man of the match
              </p>
              <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold text-sm">
                🏆 {joinNames(motmCandidates)}
              </p>
              {motmStatLine && (
                <p className="text-gray-600 dark:text-[#9CA3AF] text-xs mt-0.5">{motmStatLine}</p>
              )}
            </div>
            {motmCandidates.length === 1 && (
              <div className="shrink-0 text-right">
                <p className="text-2xl font-black tabular-nums text-[#1C1C1C] dark:text-[#E5E6E3]">
                  {toRating(motmCandidates[0].score).toFixed(1)}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-3 text-right">
          {isInProgress ? (
            <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">
              Game in progress — stats update live
            </span>
          ) : (
            <a
              href="#game-breakdown"
              className="text-mvf text-sm hover:text-mvf-dark transition-colors"
            >
              View full breakdown →
            </a>
          )}
        </div>
      </div>
    </div>
  )
}
