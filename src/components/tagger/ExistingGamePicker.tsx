import { useMemo } from "react";
import { useGames } from "../../hooks/useGames";
import { useGamePlayers } from "../../hooks/useGamePlayers";
import { usePlayers } from "../../hooks/usePlayers";
import type { Game, Player } from "../../types";

interface Props {
  onSelect: (
    game: Game,
    players: Player[],
    teamAssignments: Map<string, 1 | 2>,
    existing: boolean,
  ) => void;
  onBack: () => void;
}

export default function ExistingGamePicker({ onSelect, onBack }: Props) {
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gpLoading } = useGamePlayers();
  const { players, loading: playersLoading } = usePlayers();

  const loading = gamesLoading || gpLoading || playersLoading;

  const sortedGames = useMemo(
    () =>
      [...games].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [games],
  );

  function handleSelect(game: Game) {
    const gamePlayerEntries = gamePlayers.filter(
      (gp) => gp.game_id === game.id,
    );
    const gamePlayers_ = gamePlayerEntries
      .map((gp) => players.find((p) => p.id === gp.player_id))
      .filter(Boolean) as Player[];

    const teamAssignments = new Map<string, 1 | 2>();
    gamePlayerEntries.forEach((gp) => {
      teamAssignments.set(gp.player_id, gp.team as 1 | 2);
    });

    onSelect(game, gamePlayers_, teamAssignments, true);
  }

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-lg tracking-tight">
            Continue Tagging
          </span>
        </div>
        <button
          onClick={onBack}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          ← Back
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-6">
          Select a game to continue tagging
        </p>

        {loading ? (
          <div className="space-y-2">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-gray-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          sortedGames.map((game) => {
            const gamePlayerEntries = gamePlayers.filter(
              (gp) => gp.game_id === game.id,
            );
            const team1Count = gamePlayerEntries.filter(
              (gp) => gp.team === 1,
            ).length;
            const team2Count = gamePlayerEntries.filter(
              (gp) => gp.team === 2,
            ).length;

            return (
              <button
                key={game.id}
                onClick={() => handleSelect(game)}
                className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl px-5 py-4 text-left transition-all"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-white font-semibold">
                      {new Date(game.date).toLocaleDateString("en-GB", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                    <p className="text-gray-500 text-xs mt-0.5">
                      {team1Count} Non Bibs · {team2Count} Bibs
                    </p>
                  </div>
                  <span className="text-gray-600 text-sm">→</span>
                </div>
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}
