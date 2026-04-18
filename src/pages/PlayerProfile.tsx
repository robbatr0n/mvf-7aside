import { useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useStats } from "../hooks/useStats";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";
import { calculatePlayerGameBreakdown, calculateGoalkeeperGameBreakdown } from "../utils/stats";
import { calculateAwards } from "../utils/awards";
import PlayerCharts from "../components/profile/PlayerCharts";
import VideoModal from "../components/shared/VideoModal";
import { useTeamStats } from "../hooks/useTeamStats";

interface StatRowProps {
  label: string;
  value: string | number;
}

function StatRow({ label, value }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
      <span className="text-[#1C1C1C] dark:text-[#E5E6E3] text-sm">{label}</span>
      <span className="font-semibold text-sm text-[#1C1C1C] dark:text-[#E5E6E3]">
        {value}
      </span>
    </div>
  );
}

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const { stats } = useStats(players, events, games, gamePlayers);
  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers);
  const [activeClip, setActiveClip] = useState<{ src: string; label: string } | null>(null);

  const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  const player = players.find((p) => p.id === id);
  const playerStats = stats.find((s) => s.player.id === id);
  const gkStats = goalkeeperStats.find((s) => s.player.id === id);

  const { teamOfSeasonIds, totwAppearances, motmAppearances, motmByGame } = useTeamStats(
    stats, goalkeeperStats, players, events, games, gamePlayers,
  );

  const isInTots = id ? teamOfSeasonIds.has(id) : false;
  const totwCount = id ? (totwAppearances.get(id) ?? 0) : 0;
  const motmCount = id ? (motmAppearances.get(id) ?? 0) : 0;

  const gameBreakdown = useMemo(() => {
    if (!id) return [];
    return calculatePlayerGameBreakdown(id, events, games, gamePlayers);
  }, [id, events, games, gamePlayers]);

  const gkBreakdown = useMemo(() => {
    if (!id || !player?.is_goalkeeper) return [];
    return calculateGoalkeeperGameBreakdown(id, events, games, gamePlayers);
  }, [id, events, games, gamePlayers, player]);

  const { awards, partnership } = useMemo(
    () => calculateAwards(stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances),
    [stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances],
  );

  const myAwards = useMemo(() => {
    const all = [...awards];
    if (partnership && partnership.players.includes(player?.name ?? "")) {
      all.push({
        emoji: partnership.emoji,
        title: partnership.title,
        description: partnership.description,
        winners: partnership.players,
        value: partnership.value,
        noWinner: false,
      });
    }
    return all.filter((a) => !a.noWinner && a.winners.includes(player?.name ?? ""));
  }, [awards, partnership, player]);

  const bestGame = useMemo(() => {
    if (gameBreakdown.length === 0) return null;
    return gameBreakdown.reduce((best, g) =>
      g.goal_involvements > best.goal_involvements ? g : best,
    );
  }, [gameBreakdown]);


  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (!player) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-lg font-semibold">Player not found</p>
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-sm transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!playerStats && !gkStats) {
    return (
      <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-lg font-semibold">No stats yet</p>
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-sm transition-colors">
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  const goalClips = events.filter(
    (e) => e.player_id === id && e.event_type === "goal" && e.clip_url,
  );

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Page header */}
        <div className="space-y-1">
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors">
            ← Dashboard
          </Link>
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#E5E6E3]">{player.name}</h1>
              <p className="text-gray-600 dark:text-[#9CA3AF] text-sm mt-0.5">
                {player.is_goalkeeper
                  ? `${gkStats?.games ?? 0} ${(gkStats?.games ?? 0) === 1 ? "game" : "games"} played`
                  : `${playerStats?.games_played ?? 0} ${playerStats?.games_played === 1 ? "game" : "games"} played`}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {isInTots && (
                  <span className="inline-flex items-center gap-1 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    ⭐ Best VII
                  </span>
                )}
                {totwCount > 0 && (
                  <span className="inline-flex items-center gap-1 bg-gray-100 dark:bg-[#1a1e21] border border-[#D4D3D0] dark:border-[#2a2e31] text-gray-600 dark:text-[#E5E6E3] text-xs font-medium px-2.5 py-1 rounded-full">
                    🏅 ×{totwCount} TOTW
                  </span>
                )}
                {motmCount > 0 && (
                  <span className="inline-flex items-center gap-1 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">
                    🏆 ×{motmCount} MOTM
                  </span>
                )}
              </div>
            </div>
            <Link
              to={`/players?compare=${id}`}
              className="text-xs text-gray-500 dark:text-[#9CA3AF] hover:text-mvf dark:hover:text-mvf transition-colors flex-shrink-0 mt-1"
            >
              Compare →
            </Link>
          </div>
        </div>

        {/* Awards */}
        {myAwards.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Awards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {myAwards.map((award) => (
                <div key={award.title} className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-3 flex items-start gap-3">
                  <span className="text-xl w-7 flex-shrink-0">{award.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">{award.title}</p>
                    <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5">{award.value}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Goals reel */}
        {(eventsLoading || goalClips.length > 0) && (
          <>
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Goals</h2>
                {!eventsLoading && goalClips.length > 0 && (
                  <Link to={`/player/${id}/goals`} className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors">
                    {goalClips.length > 3 ? `View all ${goalClips.length} →` : "View all →"}
                  </Link>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {eventsLoading
                  ? [...Array(3)].map((_, i) => (
                    <div key={i} className="flex-none w-36 rounded-xl overflow-hidden animate-pulse">
                      <div className="w-full aspect-video bg-gray-200 dark:bg-[#1a1e21]" />
                      <div className="h-3 mx-2 my-2 bg-gray-200 dark:bg-[#1a1e21] rounded" />
                    </div>
                  ))
                  : goalClips.slice(0, 3).map((event, i) => {
                    const game = games.find((g) => g.id === event.game_id);
                    return (
                      <div
                        key={event.id}
                        className="flex-none w-36 bg-gray-100 dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-xl overflow-hidden cursor-pointer"
                        onClick={() =>
                          setActiveClip({
                            src: event.clip_url!,
                            label: `Goal ${i + 1}${game ? ` — ${new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}` : ""}`,
                          })
                        }
                      >
                        <div className="relative">
                          <video
                            src={event.clip_url!}
                            className="w-full aspect-video object-cover"
                            preload="metadata"
                            playsInline
                            muted
                          />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-8 h-8 rounded-full bg-black/60 border border-gray-600 flex items-center justify-center">
                              <div className="w-0 h-0 border-t-[5px] border-b-[5px] border-l-[9px] border-t-transparent border-b-transparent border-l-white ml-0.5" />
                            </div>
                          </div>
                        </div>
                        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs px-2 py-1.5">
                          {game ? new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : "—"}
                        </p>
                      </div>
                    );
                  })}
              </div>
            </section>
            {activeClip && (
              <VideoModal src={activeClip.src} label={activeClip.label} onClose={() => setActiveClip(null)} />
            )}
          </>
        )}

        <PlayerCharts
          gameBreakdown={gameBreakdown}
          gkBreakdown={gkBreakdown}
          isGoalkeeper={player.is_goalkeeper}
        />

        {/* Goalkeeper stats */}
        {player.is_goalkeeper && gkStats ? (
          <>
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Goalkeeping</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Games" value={gkStats.games} />
                <StatRow label="Saves" value={gkStats.saves} />
                <StatRow label="Saves per Game" value={gkStats.games > 0 ? gkStats.savesPerGame : "—"} />
                <StatRow label="Goals Conceded" value={gkStats.goalsConceded} />
                <StatRow label="Goals Conceded per Game" value={gkStats.games > 0 ? gkStats.goalsConcededPerGame : "—"} />
                <StatRow label="Save Percentage" value={gkStats.games > 0 ? `${gkStats.savePercentage}%` : "—"} />
                <StatRow label="Clean Sheets" value={gkStats.cleanSheets} />
                <StatRow label="Clean Sheet Percentage" value={gkStats.games > 0 ? `${gkStats.cleanSheetPercentage}%` : "—"} />
              </div>
            </section>

            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Results</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Wins" value={gkStats.wins} />
                <StatRow label="Losses" value={gkStats.losses} />
                <StatRow label="Draws" value={gkStats.draws} />
                <StatRow label="Win Rate" value={gkStats.games > 0 ? `${gkStats.win_rate}%` : "—"} />
                {gkStats.form.length > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
                    <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">Last 5 Form</span>
                    <div className="flex items-center gap-1">
                      {gkStats.form.map((result, i) => (
                        <span key={i} className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${result === "W" ? "bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]" :
                          result === "L" ? "bg-[#fee2e2] text-[#991b1b] dark:bg-[#5a0a0a] dark:text-[#fca5a5]" :
                            "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* GK Game by Game */}
            {games.filter((g) => gamePlayers.some((gp) => gp.game_id === g.id && gp.player_id === id)).length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Game by Game</h2>
                <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#D4D3D0] dark:border-[#2a2e31]">
                          <th className="text-left px-5 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">Date</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">SV</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">GC</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">SV%</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">CS</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {games
                          .filter((g) => gamePlayers.some((gp) => gp.game_id === g.id && gp.player_id === id))
                          .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                          .map((game) => {
                            const keeperEntry = gamePlayers.find((gp) => gp.game_id === game.id && gp.player_id === id);
                            const keeperTeam = keeperEntry?.team;
                            const gameEvents = events.filter((e) => e.game_id === game.id);
                            const opposingPlayerIds = new Set(
                              gamePlayers.filter((gp) => gp.game_id === game.id && gp.team !== keeperTeam).map((gp) => gp.player_id),
                            );
                            const saves = gameEvents.filter((e) =>
                              e.event_type === "shot_on_target" && e.related_event_id === null && opposingPlayerIds.has(e.player_id),
                            ).length;
                            const goalsConceded = gameEvents.filter((e) => {
                              if (e.event_type !== "goal") return false;
                              if (e.team_override !== null) return e.team_override !== keeperTeam;
                              return opposingPlayerIds.has(e.player_id);
                            }).length;
                            const totalShots = saves + goalsConceded;
                            const svPct = totalShots > 0 ? Math.round((saves / totalShots) * 100) : null;
                            const cleanSheet = goalsConceded === 0;
                            const result = game.winning_team === null ? "—" : game.winning_team === 0 ? "D" : game.winning_team === keeperTeam ? "W" : "L";
                            const resultColor = result === "W" ? "text-green-600 dark:text-green-400" : result === "L" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-[#9CA3AF]";

                            return (
                              <tr key={game.id} className="hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 transition-colors">
                                <td className="px-5 py-3.5 text-gray-600 dark:text-[#E5E6E3]">
                                  {new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                                </td>
                                <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold">{saves}</td>
                                <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{goalsConceded}</td>
                                <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{svPct !== null ? `${svPct}%` : "—"}</td>
                                <td className="text-center px-4 py-3.5">
                                  {cleanSheet
                                    ? <span className="text-green-600 dark:text-green-400 font-semibold">✓</span>
                                    : <span className="text-gray-300 dark:text-[#737373]">—</span>
                                  }
                                </td>
                                <td className={`text-center px-4 py-3.5 font-semibold ${resultColor}`}>{result}</td>
                              </tr>
                            );
                          })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : playerStats ? (
          <>
            {/* Attacking */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Attacking</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Goals" value={playerStats.goals} />
                <StatRow label="Assists" value={playerStats.assists} />
                <StatRow label="Goal Involvements (G+A)" value={playerStats.goal_involvements} />
                <StatRow label="Key Passes" value={playerStats.key_passes} />
                <StatRow label="Key Passes per Game" value={playerStats.games_played > 0 ? playerStats.key_passes_per_game : "—"} />
                <StatRow label="Goals per Game" value={playerStats.goals_per_game} />
                {playerStats.hat_tricks > 0 && (
                  <StatRow label="Hat Tricks 🎩" value={playerStats.hat_tricks} />
                )}
                <StatRow
                  label="Current Scoring Streak"
                  value={playerStats.current_scoring_streak > 0 ? `${playerStats.current_scoring_streak} game${playerStats.current_scoring_streak > 1 ? "s" : ""} 🔥` : "—"}

                />
                <StatRow
                  label="Best Scoring Streak"
                  value={playerStats.best_scoring_streak > 0 ? `${playerStats.best_scoring_streak} game${playerStats.best_scoring_streak > 1 ? "s" : ""}` : "—"}
                />
                {bestGame && bestGame.goal_involvements > 0 && (
                  <StatRow
                    label="Best Game"
                    value={`${bestGame.goal_involvements} G+A (${new Date(bestGame.game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })})`}

                  />
                )}
              </div>
            </section>

            {/* Defending */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Defending</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Tackles" value={playerStats.tackles} />
                <StatRow label="Interceptions" value={playerStats.interceptions} />
                <StatRow label="Defensive Actions" value={playerStats.defensive_actions} />
                <StatRow label="Tackles per Game" value={playerStats.games_played > 0 ? playerStats.tackles_per_game : "—"} />
                <StatRow label="Interceptions per Game" value={playerStats.games_played > 0 ? playerStats.interceptions_per_game : "—"} />
                <StatRow label="Defensive Actions per Game" value={playerStats.games_played > 0 ? playerStats.defensive_actions_per_game : "—"} />
              </div>
            </section>

            {/* Shooting */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Shooting</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Shots on Target" value={playerStats.shots_on_target} />
                <StatRow label="Shots off Target" value={playerStats.shots_off_target} />
                <StatRow label="Total Shots" value={playerStats.shots_on_target + playerStats.shots_off_target} />
                <StatRow label="Shot Accuracy" value={playerStats.shots_on_target + playerStats.shots_off_target > 0 ? `${playerStats.shot_accuracy}%` : "—"} />
                <StatRow label="Shot Conversion" value={playerStats.shots_on_target + playerStats.shots_off_target > 0 ? `${playerStats.shot_conversion}%` : "—"} />
              </div>
            </section>

            {/* Results */}
            <section className="space-y-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Results</h2>
              <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl px-5">
                <StatRow label="Wins" value={playerStats.wins} />
                <StatRow label="Losses" value={playerStats.losses} />
                <StatRow label="Draws" value={playerStats.draws} />
                <StatRow label="Win Rate" value={playerStats.games_played > 0 ? `${playerStats.win_rate}%` : "—"} />
                {motmCount > 0 && <StatRow label="Man of the Match 🏆" value={motmCount} />}
                {playerStats.form.length > 0 && (
                  <div className="flex items-center justify-between py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31] last:border-0">
                    <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">Last 5 Form</span>
                    <div className="flex items-center gap-1">
                      {playerStats.form.map((result, i) => (
                        <span key={i} className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${result === "W" ? "bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]" :
                          result === "L" ? "bg-[#fee2e2] text-[#991b1b] dark:bg-[#5a0a0a] dark:text-[#fca5a5]" :
                            "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
                          }`}>
                          {result}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Per game breakdown */}
            {gameBreakdown.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Game by Game</h2>
                <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#D4D3D0] dark:border-[#2a2e31]">
                          <th className="text-left px-5 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">Date</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">G</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">A</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">G+A</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">SOT</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">KP</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">TKL</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">INT</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">MOTM</th>
                          <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {gameBreakdown.map(({ game, goals, assists, key_passes, shots_on_target, goal_involvements, tackles, interceptions }) => {
                          const gp = gamePlayers.find((g) => g.game_id === game.id && g.player_id === id);
                          const playerTeam = gp?.team;
                          const result = game.winning_team === null ? "—" : game.winning_team === 0 ? "D" : game.winning_team === playerTeam ? "W" : "L";
                          const resultColor = result === "W" ? "text-green-600 dark:text-green-400" : result === "L" ? "text-red-600 dark:text-red-400" : "text-gray-600 dark:text-[#9CA3AF]";

                          return (
                            <tr key={game.id} className="hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 transition-colors">
                              <td className="px-5 py-3.5 text-gray-600 dark:text-[#E5E6E3]">
                                {new Date(game.date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                              </td>
                              <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold">{goals > 0 ? goals : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{assists > 0 ? assists : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{goal_involvements > 0 ? goal_involvements : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{shots_on_target > 0 ? shots_on_target : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{key_passes > 0 ? key_passes : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{tackles > 0 ? tackles : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{interceptions > 0 ? interceptions : "—"}</td>
                              <td className="text-center px-4 py-3.5">
                                {motmByGame.get(game.id)?.id === id
                                  ? <span className="text-amber-500">🏆</span>
                                  : <span className="text-gray-300 dark:text-[#737373]">—</span>}
                              </td>
                              <td className={`text-center px-4 py-3.5 font-semibold ${resultColor}`}>{result}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              </section>
            )}
          </>
        ) : null}

      </div>
    </div>
  );
}