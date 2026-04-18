import { useState, useMemo, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
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
  const [compareMode, setCompareMode] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const compareId = searchParams.get("compare");
    if (compareId) {
      setCompareMode(true);
      setSelectedId(compareId);
    }
  }, []);

  const loading = playersLoading || gamePlayersLoading;
  const { events } = useEvents();
  const { games } = useGames();
  const { stats } = useStats(players, events, games, gamePlayers);

  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers);

  const { teamOfSeasonIds, totwAppearances, motmAppearances } = useTeamStats(
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

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search players..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-xl px-4 py-3 text-[#1C1C1C] dark:text-[#E5E6E3] text-sm placeholder-gray-400 dark:placeholder-gray-600 outline-none focus:border-gray-400 dark:focus:border-gray-600 transition-colors"
          />
          <button
            onClick={() => { setCompareMode(!compareMode); setSelectedId(null); }}
            className={`px-4 py-3 rounded-xl border text-sm font-medium transition-colors whitespace-nowrap ${
              compareMode
                ? "border-mvf text-mvf bg-green-50 dark:bg-green-900/20"
                : "border-[#D4D3D0] dark:border-[#2a2e31] text-gray-600 dark:text-[#9CA3AF] bg-[#FFFFFF] dark:bg-[#111518] hover:border-gray-400 dark:hover:border-gray-600"
            }`}
          >
            Compare
          </button>
        </div>

        {compareMode && (
          <p className="text-xs text-gray-500 dark:text-[#9CA3AF]">
            {selectedId
              ? "Now tap a second player to compare."
              : "Tap a player to start comparing."}
          </p>
        )}

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

              const isSelected = selectedId === player.id;
              const cardClass = `relative bg-[#FFFFFF] dark:bg-[#111518] border rounded-2xl p-4 space-y-3 transition-all group text-left w-full ${
                isSelected
                  ? "border-mvf"
                  : "border-[#D4D3D0] dark:border-[#2a2e31] hover:border-mvf dark:hover:border-mvf"
              }`;

              const cardInner = (
                <>
                  <span className="absolute top-3 right-3 text-gray-300 dark:text-gray-700 group-hover:text-mvf text-sm transition-colors">
                    {compareMode ? (isSelected ? "✓" : "+") : "→"}
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
                      {(motmAppearances.get(player.id) ?? 0) > 0 && (
                        <span className="inline-flex items-center gap-0.5 bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700/50 text-amber-700 dark:text-amber-400 text-xs font-medium px-2 py-0.5 rounded-full">
                          🏆 ×{motmAppearances.get(player.id)}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              );

              return compareMode ? (
                <button
                  key={player.id}
                  className={cardClass}
                  onClick={() => {
                    if (!selectedId) {
                      setSelectedId(player.id);
                    } else if (selectedId === player.id) {
                      setSelectedId(null);
                    } else {
                      navigate(`/compare/${selectedId}/${player.id}`);
                    }
                  }}
                >
                  {cardInner}
                </button>
              ) : (
                <Link
                  key={player.id}
                  to={`/player/${player.id}`}
                  className={cardClass}
                >
                  {cardInner}
                </Link>
              );
            })}
          </div>
        )}
      </div>

      {/* Compare dismiss bar */}
      {compareMode && selectedId && (
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-[#FFFFFF] dark:bg-[#111518] border-t border-[#D4D3D0] dark:border-[#2a2e31] px-4 py-3 flex items-center justify-between">
          <p className="text-sm text-[#1C1C1C] dark:text-[#E5E6E3]">
            <span className="font-semibold">{players.find(p => p.id === selectedId)?.name}</span>
            <span className="text-gray-500 dark:text-[#9CA3AF]"> selected — tap another player to compare</span>
          </p>
          <button
            onClick={() => setSelectedId(null)}
            className="text-gray-500 dark:text-[#9CA3AF] text-xs hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] transition-colors ml-4 flex-shrink-0"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}