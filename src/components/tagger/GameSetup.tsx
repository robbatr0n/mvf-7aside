import { useState } from "react";
import { usePlayers } from "../../hooks/usePlayers";
import { addGame } from "../../services/games";
import type { Game, Player } from "../../types";
import PlayerManagementPanel from "./PlayerManagementPanel";
import ExistingGamePicker from "./ExistingGamePicker";

interface Props {
  onReady: (
    game: Game,
    players: Player[],
    teamAssignments: Map<string, 1 | 2>,
    existing?: boolean,
  ) => void;
}

type SetupMode = "choose" | "new" | "existing";

export default function GameSetup({ onReady }: Props) {
  const { players, loading, createPlayer, refresh } = usePlayers();
  const [mode, setMode] = useState<SetupMode>("choose");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [teamAssignments, setTeamAssignments] = useState<Map<string, 1 | 2>>(
    new Map(),
  );
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [newPlayerName, setNewPlayerName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [showRoster, setShowRoster] = useState(false);

  function togglePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }

  function setTeam(id: string, team: 1 | 2) {
    setTeamAssignments((prev) => {
      const next = new Map(prev);
      next.set(id, team);
      return next;
    });
  }

  async function handleAddPlayer(isGuest = false) {
    if (!newPlayerName.trim()) return;
    const player = await createPlayer(newPlayerName.trim(), isGuest);
    setSelectedIds((prev) => new Set(prev).add(player.id));
    setNewPlayerName("");
  }

  function handleDeletePlayer(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    refresh();
  }

  async function handleStart() {
    if (!canStart) return;
    setSubmitting(true);
    const game = await addGame(date);
    const selected = players.filter((p) => selectedIds.has(p.id));
    onReady(game, selected, teamAssignments);
  }

  const selectedPlayers = players.filter((p) => selectedIds.has(p.id));
  const allAssigned =
    selectedPlayers.length > 0 &&
    selectedPlayers.every((p) => teamAssignments.has(p.id));
  const canStart = selectedIds.size > 0 && allAssigned;

  if (mode === "existing") {
    return (
      <ExistingGamePicker
        onSelect={(game, players, teamAssignments, existing) =>
          onReady(game, players, teamAssignments, existing)
        }
        onBack={() => setMode("choose")}
      />
    );
  }

  if (mode === "choose") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="border-b border-gray-800 px-8 py-5 flex items-center gap-3">
          <span className="text-2xl">⚽</span>
          <span className="font-bold text-lg tracking-tight">Tagger</span>
        </div>
        <div className="max-w-2xl mx-auto px-6 py-10 space-y-4">
          <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-6">
            What would you like to do?
          </p>
          <button
            onClick={() => setMode("new")}
            className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl px-6 py-5 text-left transition-all"
          >
            <p className="text-white font-bold text-lg">⚽ New Game</p>
            <p className="text-gray-500 text-sm mt-1">
              Set up a new game and start tagging from scratch
            </p>
          </button>
          <button
            onClick={() => setMode("existing")}
            className="w-full bg-gray-900 border border-gray-800 hover:border-gray-600 rounded-2xl px-6 py-5 text-left transition-all"
          >
            <p className="text-white font-bold text-lg">
              📂 Continue Existing Game
            </p>
            <p className="text-gray-500 text-sm mt-1">
              Add tackles, interceptions or missing events to a previous game
            </p>
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
          <span className="font-bold text-lg tracking-tight">New Game</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setMode("choose")}
            className="text-gray-600 hover:text-gray-400 text-sm transition-colors"
          >
            ← Back
          </button>
          <button
            onClick={() => setShowRoster(true)}
            className="text-gray-400 hover:text-white text-sm transition-colors"
          >
            Manage Roster
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
        {/* Date */}
        <section className="space-y-3">
          <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
            Date
          </label>
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="bg-gray-900 border border-gray-800 rounded-xl px-5 py-3 text-white outline-none focus:border-blue-500 transition-colors w-full sm:w-auto"
          />
        </section>

        {/* Player selection */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Players in this Game
            </label>
            {selectedIds.size > 0 && (
              <span className="text-xs text-blue-400 font-medium">
                {selectedIds.size} selected
              </span>
            )}
          </div>

          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="h-11 bg-gray-800 rounded-xl animate-pulse"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {players.map((player) => {
                const selected = selectedIds.has(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => togglePlayer(player.id)}
                    className={`px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                      selected
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-900/40"
                        : "bg-gray-900 border border-gray-800 text-gray-300 hover:border-gray-600"
                    }`}
                  >
                    {player.name}
                  </button>
                );
              })}
            </div>
          )}

          <div className="flex gap-2 pt-1">
            <input
              type="text"
              placeholder="Add new player..."
              value={newPlayerName}
              onChange={(e) => setNewPlayerName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAddPlayer()}
              className="flex-1 bg-gray-900 border border-gray-800 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-600 transition-colors"
            />
            <button
              onClick={() => handleAddPlayer()}
              disabled={!newPlayerName.trim()}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => handleAddPlayer(true)}
              disabled={!newPlayerName.trim()}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
            >
              Guest
            </button>
          </div>
        </section>

        {/* Team assignment */}
        {selectedIds.size > 0 && (
          <section className="space-y-4">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Assign Teams
            </label>
            <div className="space-y-2">
              {selectedPlayers.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between bg-gray-900 border border-gray-800 rounded-xl px-4 py-3"
                >
                  <span className="text-white text-sm font-medium">
                    {player.name}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setTeam(player.id, 1)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        teamAssignments.get(player.id) === 1
                          ? "bg-blue-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      Non Bibs
                    </button>
                    <button
                      onClick={() => setTeam(player.id, 2)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                        teamAssignments.get(player.id) === 2
                          ? "bg-orange-600 text-white"
                          : "bg-gray-800 text-gray-400 hover:text-white"
                      }`}
                    >
                      🟠 Bibs
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        <button
          onClick={handleStart}
          disabled={!canStart || submitting}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 font-bold text-base transition-all shadow-lg shadow-blue-900/30"
        >
          {submitting ? "Starting..." : "Start Tagging →"}
        </button>
      </div>

      {showRoster && (
        <PlayerManagementPanel
          players={players}
          onClose={() => setShowRoster(false)}
          onAdd={createPlayer}
          onUpdate={() => refresh()}
          onDelete={handleDeletePlayer}
        />
      )}
    </div>
  );
}
