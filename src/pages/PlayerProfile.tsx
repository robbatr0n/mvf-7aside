import { useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useStats } from "../hooks/useStats";
import { calculatePlayerGameBreakdown } from "../utils/stats";
import { calculateAwards } from "../utils/awards";

interface StatRowProps {
  label: string;
  value: string | number;
  highlight?: boolean;
}

function StatRow({ label, value, highlight }: StatRowProps) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
      <span className="text-gray-400 text-sm">{label}</span>
      <span
        className={`font-semibold text-sm ${highlight ? "text-blue-400" : "text-white"}`}
      >
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

  const loading =
    playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  const player = players.find((p) => p.id === id);
  const playerStats = stats.find((s) => s.player.id === id);

  const gameBreakdown = useMemo(() => {
    if (!id) return [];
    return calculatePlayerGameBreakdown(id, events, games, gamePlayers);
  }, [id, events, games, gamePlayers]);

  const { awards, partnership } = useMemo(
    () => calculateAwards(stats, events, games, gamePlayers, players),
    [stats, events, games, gamePlayers, players],
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
    return all.filter(
      (a) => !a.noWinner && a.winners.includes(player?.name ?? ""),
    );
  }, [awards, partnership, player]);

  const bestGame = useMemo(() => {
    if (gameBreakdown.length === 0) return null;
    return gameBreakdown.reduce((best, g) =>
      g.goal_involvements > best.goal_involvements ? g : best,
    );
  }, [gameBreakdown]);

  const winRate = useMemo(() => {
    if (!playerStats || playerStats.games_played === 0) return 0;
    return Math.round((playerStats.wins / playerStats.games_played) * 100);
  }, [playerStats]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="space-y-4 w-full max-w-2xl px-6">
          {[...Array(4)].map((_, i) => (
            <div
              key={i}
              className="h-24 bg-gray-900 rounded-2xl animate-pulse"
            />
          ))}
        </div>
      </div>
    );
  }

  if (!player || !playerStats) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-white text-lg font-semibold">Player not found</p>
          <Link
            to="/"
            className="text-gray-500 hover:text-white text-sm transition-colors"
          >
            ← Back to dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-3xl mx-auto px-6 py-10 space-y-10">
        {/* Page header */}
        <div className="space-y-1">
          <Link
            to="/"
            className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
          >
            ← Dashboard
          </Link>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">{player.name}</h1>
              <p className="text-gray-500 text-sm mt-0.5">
                {playerStats.games_played}{" "}
                {playerStats.games_played === 1 ? "game" : "games"} played
              </p>
            </div>
            {myAwards.length > 0 && (
              <div className="flex gap-1 flex-wrap justify-end max-w-xs">
                {myAwards.map((a) => (
                  <span key={a.title} title={a.title} className="text-xl">
                    {a.emoji}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Awards */}
        {myAwards.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Awards
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {myAwards.map((award) => (
                <div
                  key={award.title}
                  className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2"
                >
                  <span className="text-2xl">{award.emoji}</span>
                  <div>
                    <p className="text-white font-semibold text-sm">
                      {award.title}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {award.value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Attacking stats */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Attacking
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5">
            <StatRow
              label="Goals"
              value={playerStats.goals}
              highlight={playerStats.goals > 0}
            />
            <StatRow
              label="Assists"
              value={playerStats.assists}
              highlight={playerStats.assists > 0}
            />
            <StatRow
              label="Goal Involvements (G+A)"
              value={playerStats.goal_involvements}
            />
            <StatRow label="Key Passes" value={playerStats.key_passes} />
            <StatRow
              label="Goals per Game"
              value={playerStats.goals_per_game}
            />
            {playerStats.hat_tricks > 0 && (
              <StatRow
                label="Hat Tricks 🎩"
                value={playerStats.hat_tricks}
                highlight
              />
            )}
            <StatRow
              label="Current Scoring Streak"
              value={
                playerStats.current_scoring_streak > 0
                  ? `${playerStats.current_scoring_streak} game${playerStats.current_scoring_streak > 1 ? "s" : ""} 🔥`
                  : "—"
              }
              highlight={playerStats.current_scoring_streak >= 3}
            />
            <StatRow
              label="Best Scoring Streak"
              value={
                playerStats.current_scoring_streak > 0
                  ? `${playerStats.current_scoring_streak} game${playerStats.current_scoring_streak > 1 ? "s" : ""}`
                  : "—"
              }
            />
            {bestGame && bestGame.goal_involvements > 0 && (
              <StatRow
                label="Best Game"
                value={`${bestGame.goal_involvements} G+A (${new Date(
                  bestGame.game.date,
                ).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                })})`}
                highlight
              />
            )}
          </div>
        </section>

        {/* Defending */}
        <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-4">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Defending
          </h2>
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Tackles", value: playerStats.tackles },
              { label: "Interceptions", value: playerStats.interceptions },
              {
                label: "Defensive Actions",
                value: playerStats.defensive_actions,
              },
              {
                label: "Tackles / Game",
                value:
                  playerStats.games_played > 0
                    ? playerStats.tackles_per_game
                    : "—",
              },
              {
                label: "Int / Game",
                value:
                  playerStats.games_played > 0
                    ? playerStats.interceptions_per_game
                    : "—",
              },
            ].map(({ label, value }) => (
              <div
                key={label}
                className="bg-gray-800/50 rounded-xl p-4 text-center"
              >
                <p className="text-white font-bold text-xl">{value}</p>
                <p className="text-gray-500 text-xs mt-1">{label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Shooting stats */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Shooting
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5">
            <StatRow
              label="Shots on Target"
              value={playerStats.shots_on_target}
            />
            <StatRow
              label="Shots off Target"
              value={playerStats.shots_off_target}
            />
            <StatRow
              label="Total Shots"
              value={playerStats.shots_on_target + playerStats.shots_off_target}
            />
            <StatRow
              label="Shot Accuracy"
              value={
                playerStats.shots_on_target + playerStats.shots_off_target > 0
                  ? `${playerStats.shot_accuracy}%`
                  : "—"
              }
            />
            <StatRow
              label="Shot Conversion"
              value={
                playerStats.shots_on_target + playerStats.shots_off_target > 0
                  ? `${playerStats.shot_conversion}%`
                  : "—"
              }
            />
          </div>
        </section>

        {/* Results */}
        <section className="space-y-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Results
          </h2>
          <div className="bg-gray-900 border border-gray-800 rounded-2xl px-5">
            <StatRow
              label="Wins"
              value={playerStats.wins}
              highlight={playerStats.wins > 0}
            />
            <StatRow label="Losses" value={playerStats.losses} />
            <StatRow label="Draws" value={playerStats.draws} />
            <StatRow
              label="Win Rate"
              value={`${winRate}%`}
              highlight={winRate >= 50}
            />
            {playerStats.form.length > 0 && (
              <div className="flex items-center justify-between py-3 border-b border-gray-800 last:border-0">
                <span className="text-gray-400 text-sm">Last 5 Form</span>
                <div className="flex items-center gap-1">
                  {playerStats.form.map((result, i) => (
                    <span
                      key={i}
                      className={`text-xs font-bold w-6 h-6 rounded flex items-center justify-center ${
                        result === "W"
                          ? "bg-green-900/60 text-green-400"
                          : result === "L"
                            ? "bg-red-900/60 text-red-400"
                            : "bg-gray-800 text-gray-400"
                      }`}
                    >
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
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Game by Game
            </h2>
            <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-800">
                      <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        Date
                      </th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        G
                      </th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        A
                      </th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        G+A
                      </th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        SOT
                      </th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        KP
                      </th>
                      <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                        Result
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {gameBreakdown.map(
                      ({
                        game,
                        goals,
                        assists,
                        key_passes,
                        shots_on_target,
                        goal_involvements,
                      }) => {
                        const gp = gamePlayers.find(
                          (g) => g.game_id === game.id && g.player_id === id,
                        );
                        const playerTeam = gp?.team;
                        const result =
                          game.winning_team === null
                            ? "—"
                            : game.winning_team === 0
                              ? "D"
                              : game.winning_team === playerTeam
                                ? "W"
                                : "L";
                        const resultColor =
                          result === "W"
                            ? "text-green-400"
                            : result === "L"
                              ? "text-red-400"
                              : "text-gray-500";

                        return (
                          <tr
                            key={game.id}
                            className="border-b border-gray-800/50 last:border-0 hover:bg-gray-800/40 transition-colors"
                          >
                            <td className="px-5 py-3.5 text-gray-300">
                              {new Date(game.date).toLocaleDateString("en-GB", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              })}
                            </td>
                            <td className="text-center px-4 py-3.5 text-white font-semibold">
                              {goals > 0 ? goals : "—"}
                            </td>
                            <td className="text-center px-4 py-3.5 text-gray-300">
                              {assists > 0 ? assists : "—"}
                            </td>
                            <td className="text-center px-4 py-3.5 text-gray-300">
                              {goal_involvements > 0 ? goal_involvements : "—"}
                            </td>
                            <td className="text-center px-4 py-3.5 text-gray-300">
                              {shots_on_target > 0 ? shots_on_target : "—"}
                            </td>
                            <td className="text-center px-4 py-3.5 text-gray-300">
                              {key_passes > 0 ? key_passes : "—"}
                            </td>
                            <td
                              className={`text-center px-4 py-3.5 font-semibold ${resultColor}`}
                            >
                              {result}
                            </td>
                          </tr>
                        );
                      },
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
