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

  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers);

  const { teamOfSeasonIds, totwAppearances } = useTeamStats(
    stats, goalkeeperStats, players, events, games, gamePlayers,
  );

  const filteredPlayers = useMemo(() => {
    return players
      .filter((p) => !p.is_guest)
      .filter((p) => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [players, search]);

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-6">
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#E5E6E3]">Players</h1>
          <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">
            Everyone who has played 7 aside on a wednesday. Tap a card to see
            their full stats and goal highlights.
          </p>
        </div>

        <input
          type="text"
          placeholder="Search players..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-xl px-4 py-3 text-[#1C1C1C] dark:text-[#E5E6E3] text-sm placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
        />

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredPlayers.length === 0 ? (
          <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">No players found.</p>
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
                  className="relative bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] hover:border-mvf dark:hover:border-mvf rounded-2xl p-4 space-y-3 transition-all group"
                >
                  <span className="absolute top-3 right-3 text-gray-300 dark:text-gray-700 group-hover:text-mvf text-sm transition-colors">
                    →
                  </span>

                  <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold text-sm ${avatarColor}`}>
                    {initials}
                  </div>

                  <div>
                    <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold text-sm pr-4 group-hover:text-mvf transition-colors">
                      {player.is_goalkeeper && <span className="mr-1">🧤</span>}
                      {player.name}
                    </p>
                    <p className="text-gray-600 dark:text-[#9CA3AF] text-xs mt-0.5">
                      {gamesPlayed} {gamesPlayed === 1 ? "game" : "games"}
                    </p>
                    <div className="flex flex-wrap gap-1 mt-2">
                      {teamOfSeasonIds.has(player.id) && (
                        <span className="inline-flex items-center gap-0.5 bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700/50 text-yellow-700 dark:text-yellow-400 text-xs font-medium px-2 py-0.5 rounded-full">
                          ⭐ TOTS
                        </span>
                      )}
                      {(totwAppearances.get(player.id) ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 bg-gray-100 dark:bg-[#1a1e21] border border-[#D4D3D0] dark:border-[#2a2e31] text-gray-600 dark:text-[#E5E6E3] text-xs font-medium px-2 py-0.5 rounded-full">
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