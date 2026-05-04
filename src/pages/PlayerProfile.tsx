import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayerProfileData } from "../hooks/usePlayerProfileData";
import PlayerCharts from "../components/profile/PlayerCharts";
import PassingHub from "../components/profile/PassingHub";
import PLMatchCard from "../components/shared/PLMatchCard";

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

const tierStyles = {
  gold: {
    card: "bg-gradient-to-br from-[#2a2000] via-[#1a1500] to-[#221a00] border-[rgba(202,162,0,0.4)]",
    stripe: "bg-gradient-to-br from-[rgba(202,162,0,0.14)] to-transparent",
    overall: "text-[#f5c842]",
  },
  silver: {
    card: "bg-gradient-to-br from-[#1c1e22] via-[#141618] to-[#1a1c20] border-[rgba(160,170,185,0.3)]",
    stripe: "bg-gradient-to-br from-[rgba(160,170,185,0.09)] to-transparent",
    overall: "text-[#c8d0dc]",
  },
  base: {
    card: "bg-[#FFFFFF] dark:bg-[#111518] border-[#D4D3D0] dark:border-[#2a2e31]",
    stripe: "bg-gradient-to-br from-[rgba(176,0,15,0.05)] to-transparent",
    overall: "text-[#1C1C1C] dark:text-[#E5E6E3]",
  },
} as const;

export default function PlayerProfile() {
  const { id } = useParams<{ id: string }>();
  const {
    loading,
    player,
    playerStats,
    gkStats,
    players,
    events,
    gamePlayers,
    stats,
    isInTots,
    totwCount,
    motmCount,
    motmByGame,
    myAwards,
    overall,
    squadRank,
    tier,
    futStats,
    futGkStats,
    plMatch,
    bestGame,
    gameBreakdown,
    gkBreakdown,
    sortedGameBreakdown,
    gameSortKey,
    handleGameSort,
    sortedGkGames,
    gkSortKey,
    handleGkSort,
  } = usePlayerProfileData(id);

  const [awardsExpanded, setAwardsExpanded] = useState(false);

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

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">

        {/* Page header — FUT-style card */}
        <div className="space-y-2">
          <Link to="/" className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors">
            ← Dashboard
          </Link>
          <div className={`relative rounded-2xl border p-5 overflow-hidden ${tierStyles[tier].card}`}>
            <div className={`absolute inset-0 pointer-events-none ${tierStyles[tier].stripe}`} />
            <div className="relative flex items-start gap-5">
              {/* Overall rating */}
              <div className="text-center flex-shrink-0 min-w-[52px]">
                <div className={`text-5xl font-black leading-none tracking-tighter ${tierStyles[tier].overall}`}>
                  {overall ?? "—"}
                </div>
                <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-[#9CA3AF] mt-1.5">OVR</div>
                {squadRank && (
                  <div className="text-[10px] text-gray-500 dark:text-[#9CA3AF] mt-0.5">#{squadRank}</div>
                )}
              </div>
              {/* Identity */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <h1 className={`text-xl font-bold leading-tight ${tier === "base" ? "text-[#1C1C1C] dark:text-[#E5E6E3]" : "text-[#E5E6E3]"}`}>
                    {player.name}
                  </h1>
                  <Link
                    to={`/players?compare=${id}`}
                    className={`text-xs transition-colors flex-shrink-0 mt-0.5 ${tier === "base" ? "text-gray-500 dark:text-[#9CA3AF] hover:text-mvf dark:hover:text-mvf" : "text-[#9CA3AF] hover:text-[#E5E6E3]"}`}
                  >
                    Compare →
                  </Link>
                </div>
                <p className={`text-sm mt-0.5 ${tier === "base" ? "text-gray-600 dark:text-[#9CA3AF]" : "text-[#9CA3AF]"}`}>
                  {player.is_goalkeeper
                    ? `${gkStats?.games ?? 0} ${(gkStats?.games ?? 0) === 1 ? "game" : "games"} played`
                    : `${playerStats?.games_played ?? 0} ${playerStats?.games_played === 1 ? "game" : "games"} played`}
                </p>
                {(isInTots || totwCount > 0 || motmCount > 0) && (
                  <div className="flex flex-wrap items-center gap-2 mt-2.5">
                    {isInTots && (
                      <span className="inline-flex items-center gap-1 bg-yellow-500/20 border border-yellow-500/40 text-yellow-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        ⭐ Best VII
                      </span>
                    )}
                    {totwCount > 0 && (
                      <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${tier === "base" ? "bg-gray-100 dark:bg-[#1a1e21] border-[#D4D3D0] dark:border-[#2a2e31] text-gray-600 dark:text-[#E5E6E3]" : "bg-white/10 border-white/20 text-[#E5E6E3]"}`}>
                        🏅 ×{totwCount} TOTW
                      </span>
                    )}
                    {motmCount > 0 && (
                      <span className="inline-flex items-center gap-1 bg-amber-500/20 border border-amber-500/40 text-amber-400 text-xs font-medium px-2.5 py-1 rounded-full">
                        🏆 ×{motmCount} MOTM
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
            {/* Stat grid */}
            {(futStats || futGkStats) && (
              <div className={`relative mt-4 pt-4 border-t ${tier === "base" ? "border-[#D4D3D0] dark:border-[#2a2e31]" : "border-white/10"}`}>
                <div className="grid grid-cols-4 gap-1">
                  {(futStats
                    ? (Object.entries(futStats).filter(([, v]) => v !== null) as [string, { val: number; label: string }][])
                    : (Object.entries(futGkStats!) as [string, { val: number; label: string }][])
                  ).map(([key, stat]) => (
                    <div key={key} className="text-center cursor-help" title={stat.label}>
                      <div className={`text-base font-black leading-none ${tierStyles[tier].overall}`}>{stat.val}</div>
                      <div className="text-[9px] font-bold uppercase tracking-wider text-gray-500 dark:text-[#9CA3AF] mt-1">{key}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {plMatch && (
          <PLMatchCard name={plMatch.name} club={plMatch.club} position={plMatch.position} />
        )}

        {/* Awards */}
        {myAwards.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Awards</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {(awardsExpanded ? myAwards : myAwards.slice(0, 6)).map((award) => (
                <div key={award.title} className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-3 flex items-start gap-3">
                  <span className="text-xl w-7 flex-shrink-0">{award.emoji}</span>
                  <div className="min-w-0">
                    <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">{award.title}</p>
                    <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5">{award.value}</p>
                  </div>
                </div>
              ))}
            </div>
            {myAwards.length > 6 && (
              <button
                onClick={() => setAwardsExpanded(e => !e)}
                className="w-full py-2.5 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-xl transition-colors bg-[#FFFFFF] dark:bg-[#111518]"
              >
                {awardsExpanded ? "Show less" : `Show ${myAwards.length - 6} more`}
              </button>
            )}
          </section>
        )}

        <PlayerCharts
          gameBreakdown={gameBreakdown}
          gkBreakdown={gkBreakdown}
          isGoalkeeper={player.is_goalkeeper}
          stats={stats}
          playerStats={playerStats}
        />

        {!player.is_goalkeeper && (
          <PassingHub playerId={id!} events={events} players={players} />
        )}

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
            {sortedGkGames.length > 0 && (
              <section className="space-y-3">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">Game by Game</h2>
                <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-[#D4D3D0] dark:border-[#2a2e31]">
                          {(["date", "saves", "goalsConceded", "svPct", "cleanSheet", "result"] as const).map((key, i) => {
                            const labels: Record<string, string> = { date: "Date", saves: "SV", goalsConceded: "GC", svPct: "SV%", cleanSheet: "CS", result: "Result" };
                            const isActive = gkSortKey === key;
                            return (
                              <th
                                key={key}
                                onClick={() => handleGkSort(key)}
                                className={`${i === 0 ? "text-left px-5" : "text-center px-4"} py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${isActive ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                              >
                                {labels[key]}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGkGames.map(({ game, saves, goalsConceded, svPct, cleanSheet, result }) => {
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
                <StatRow label="Passes Completed" value={playerStats.pass_attempts > 0 ? playerStats.passes_completed : "—"} />
                <StatRow label="Pass Accuracy" value={playerStats.pass_attempts > 0 ? `${playerStats.pass_accuracy}%` : "—"} />
                <StatRow label="Passes per Game" value={playerStats.pass_attempts > 0 && playerStats.games_played > 0 ? playerStats.passes_per_game : "—"} />
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
                          {(["date", "goals", "assists", "goal_involvements", "shots_on_target", "key_passes", "tackles", "interceptions", "passes_completed", "pass_accuracy", "motm", "result"] as const).map((key, i) => {
                            const labels: Record<string, string> = { date: "Date", goals: "G", assists: "A", goal_involvements: "G+A", shots_on_target: "SOT", key_passes: "KP", tackles: "TKL", interceptions: "INT", passes_completed: "PC", pass_accuracy: "P Acc%", motm: "MOTM", result: "Result" };
                            const isActive = gameSortKey === key;
                            return (
                              <th
                                key={key}
                                onClick={() => handleGameSort(key)}
                                className={`${i === 0 ? "text-left px-5" : "text-center px-4"} py-3 font-semibold text-xs uppercase tracking-wider cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${isActive ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                              >
                                {labels[key]}
                              </th>
                            );
                          })}
                        </tr>
                      </thead>
                      <tbody>
                        {sortedGameBreakdown.map(({ game, goals, assists, key_passes, shots_on_target, goal_involvements, tackles, interceptions, passes_completed, pass_accuracy }) => {
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
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{passes_completed > 0 ? passes_completed : "—"}</td>
                              <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{passes_completed > 0 ? `${pass_accuracy}%` : "—"}</td>
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
