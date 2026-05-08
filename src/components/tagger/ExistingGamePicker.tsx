import { useMemo, useState } from "react";
import { useGames } from "../../hooks/useGames";
import { useGamePlayers } from "../../hooks/useGamePlayers";
import { usePlayers } from "../../hooks/usePlayers";
import { setGameKeeper } from "../../services/games";
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

  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [gkId, setGkId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const loading = gamesLoading || gpLoading || playersLoading;

  const sortedGames = useMemo(
    () =>
      [...games].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [games],
  );

  function handleGameClick(game: Game) {
    const existing = gamePlayers.find(
      gp => gp.game_id === game.id && gp.is_goalkeeper
    )
    setGkId(existing?.player_id ?? null);
    setSelectedGame(game);
  }

  async function handleContinue() {
    if (!selectedGame) return;
    setSaving(true);

    const gamePlayerEntries = gamePlayers.filter(gp => gp.game_id === selectedGame.id);
    const currentGkEntry = gamePlayerEntries.find(gp => gp.is_goalkeeper);
    const gkChanged = (currentGkEntry?.player_id ?? null) !== gkId;

    if (gkChanged) await setGameKeeper(selectedGame.id, gkId);

    const gamePlayers_ = gamePlayerEntries
      .map(gp => players.find(p => p.id === gp.player_id))
      .filter(Boolean) as Player[];

    const teamAssignments = new Map<string, 1 | 2>();
    gamePlayerEntries.forEach(gp => {
      teamAssignments.set(gp.player_id, gp.team as 1 | 2);
    });

    onSelect(selectedGame, gamePlayers_, teamAssignments, true);
  }

  if (selectedGame) {
    const gamePlayerEntries = gamePlayers.filter(gp => gp.game_id === selectedGame.id);
    const team1 = gamePlayerEntries
      .filter(gp => gp.team === 1)
      .map(gp => players.find(p => p.id === gp.player_id))
      .filter(Boolean) as Player[];
    const team2 = gamePlayerEntries
      .filter(gp => gp.team === 2)
      .map(gp => players.find(p => p.id === gp.player_id))
      .filter(Boolean) as Player[];

    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">⚽</span>
            <span className="font-bold text-lg tracking-tight">Select GK</span>
          </div>
          <button
            onClick={() => setSelectedGame(null)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            ← Back
          </button>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10 space-y-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Who was the goalkeeper? (optional)
          </p>

          {[{ label: "Non Bibs", players: team1 }, { label: "🟠 Bibs", players: team2 }].map(({ label, players: teamPlayers }) => (
            teamPlayers.length > 0 && (
              <div key={label} className="space-y-2">
                <p className="text-xs text-gray-500 uppercase tracking-widest">{label}</p>
                <div className="space-y-2">
                  {teamPlayers.map(player => (
                    <div
                      key={player.id}
                      className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
                    >
                      <span className={`text-sm font-medium ${gkId === player.id ? "text-yellow-400" : "text-white"}`}>
                        {player.name}
                      </span>
                      <button
                        onClick={() => setGkId(gkId === player.id ? null : player.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          gkId === player.id
                            ? "bg-yellow-600 text-white"
                            : "bg-gray-800 text-gray-400 hover:text-white"
                        }`}
                      >
                        GK
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )
          ))}

          <button
            onClick={handleContinue}
            disabled={saving}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-2xl px-6 py-4 font-bold text-base transition-all"
          >
            {saving ? "Saving..." : "Continue →"}
          </button>
        </div>
      </div>
    );
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
            const hasGk = gamePlayerEntries.some(gp => gp.is_goalkeeper);

            return (
              <button
                key={game.id}
                onClick={() => handleGameClick(game)}
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
                      {hasGk && <span className="text-yellow-600 ml-2">· GK set</span>}
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
