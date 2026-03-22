import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { usePlayers } from "../hooks/usePlayers";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { getAvatarColor } from "../utils/avatar";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useStats } from "../hooks/useStats";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";
import { useTeamStats } from "../hooks/useTeamStats";

export default function Players() {
  const { players, loading: playersLoading } = usePlayers();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const [search, setSearch] = useState("");

  const loading = playersLoading || gamePlayersLoading;
  const { events } = useEvents();
  const { games } = useGames();
  const { stats } = useStats(players, events, games, gamePlayers);

  const goalkeeperStats = useGoalkeeperStats(
    players,
    events,
    games,
    gamePlayers,
  );

  const { teamOfSeasonIds, totwAppearances } = useTeamStats(
    stats,
    goalkeeperStats,
    players,
    events,
    games,
    gamePlayers,
  );

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => !p.is_guest)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, search]);

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-white">Players</h1>
          <p className="text-gray-500 text-sm">
            Everyone who has played 7 aside on a wednesday. Tap a card to see
            their full stats and goal highlights.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 outline-none focus:border-gray-600 transition-colors"
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-28 bg-gray-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <p className="text-gray-600 text-sm">No players found.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {filteredPlayers.map((player) => {
              const gamesPlayed = gamePlayers.filter(
                (gp) => gp.player_id === player.id,
              ).length;
              const avatarColor = getAvatarColor(player.name);
              const initials = player.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase();

              return (
                <Link
                  key={player.id}
                  to={`/player/${player.id}`}
                  className="relative bg-gray-900 border border-gray-800 hover:border-blue-600 rounded-2xl p-4 space-y-3 transition-all group"
                >
                  <span className="absolute top-3 right-3 text-gray-700 group-hover:text-blue-400 text-sm transition-colors">
                    →
                  </span>

                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${avatarColor}`}
                  >
                    {initials}
                  </div>

                  <div>
                    <p className="text-white font-semibold text-sm pr-4 group-hover:text-blue-400 transition-colors">
                      {player.is_goalkeeper && <span className="mr-1">🧤</span>}
                      {player.name}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {gamesPlayed} {gamesPlayed === 1 ? "game" : "games"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {teamOfSeasonIds.has(player.id) && (
                        <span className="inline-flex items-center gap-0.5 bg-yellow-900/40 border border-yellow-700/50 text-yellow-400 text-xs font-medium px-2 py-0.5 rounded-full">
                          ⭐ TOTS
                        </span>
                      )}
                      {(totwAppearances.get(player.id) ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 bg-gray-800 border border-gray-700 text-gray-300 text-xs font-medium px-2 py-0.5 rounded-full">
                          🏅 ×{totwAppearances.get(player.id)}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
