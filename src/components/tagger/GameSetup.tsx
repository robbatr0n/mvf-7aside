import { useState } from "react";
import { usePlayers } from "../../hooks/usePlayers";
import { addGame, addGamePlayers } from "../../services/games";
import type { Game, Player } from "../../types";
import PlayerManagementPanel from "./PlayerManagementPanel";

interface Props {
  onReady: (
    game: Game,
    players: Player[],
    teamAssignments: Map<string, 1 | 2>,
  ) => void;
}

type SetupPhase = "players" | "teams";

export default function GameSetup({ onReady }: Props) {
  const { players, loading, createPlayer, refresh } = usePlayers();
  const [setupPhase, setSetupPhase] = useState<SetupPhase>("players");
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
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function assignTeam(playerId: string, team: 1 | 2) {
    setTeamAssignments((prev) => new Map(prev).set(playerId, team));
  }

  function handleProceedToTeams() {
    // Default everyone to team 1
    const assignments = new Map<string, 1 | 2>();
    selectedIds.forEach((id) => assignments.set(id, 1));
    setTeamAssignments(assignments);
    setSetupPhase("teams");
  }

  async function handleAddPlayer(isGuest = false) {
    if (!newPlayerName.trim()) return;
    const player = await createPlayer(newPlayerName.trim(), isGuest);
    setSelectedIds((prev) => new Set(prev).add(player.id));
    setNewPlayerName("");
  }

  function handleUpdatePlayer(_id: string, _name: string) {
    refresh();
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
    const assignments = Array.from(teamAssignments.entries()).map(
      ([playerId, team]) => ({ playerId, team }),
    );
    await addGamePlayers(game.id, assignments);
    onReady(game, selected, teamAssignments);
  }

  const selectedPlayers = players.filter((p) => selectedIds.has(p.id));
  const team1 = selectedPlayers.filter((p) => teamAssignments.get(p.id) === 1);
  const team2 = selectedPlayers.filter((p) => teamAssignments.get(p.id) === 2);
  const canStart = team1.length > 0 && team2.length > 0;

  if (setupPhase === "teams") {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        <div className="border-b border-gray-800 px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSetupPhase("players")}
              className="text-gray-500 hover:text-white transition-colors"
            >
              ←
            </button>
            <span className="font-bold text-lg tracking-tight">
              Assign Teams
            </span>
          </div>
          <span className="text-gray-500 text-sm">
            {selectedPlayers.length} players
          </span>
        </div>

        <div className="max-w-2xl mx-auto px-6 py-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
            {/* Team 1 */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                No Bib
              </div>
              <div className="space-y-2 min-h-32">
                {team1.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => assignTeam(player.id, 2)}
                    className="w-full bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left"
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Team 2 */}
            <div className="space-y-3">
              <div className="text-xs font-semibold uppercase tracking-widest text-orange-500">
                🟠 Orange Bibs
              </div>
              <div className="space-y-2 min-h-32">
                {team2.map((player) => (
                  <button
                    key={player.id}
                    onClick={() => assignTeam(player.id, 1)}
                    className="w-full bg-orange-900/40 hover:bg-orange-900/60 border border-orange-800/50 text-white rounded-xl px-4 py-3 text-sm font-medium transition-colors text-left"
                  >
                    {player.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-gray-600 text-xs text-center">
            Click a player to move them between teams
          </p>

          <button
            onClick={handleStart}
            disabled={!canStart || submitting}
            className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 font-bold text-base transition-all"
          >
            {submitting ? "Starting..." : "Start Tagging →"}
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
        <button
          onClick={() => setShowRoster(true)}
          className="text-gray-400 hover:text-white text-sm transition-colors"
        >
          Manage Roster
        </button>
      </div>

      <div className="max-w-2xl mx-auto px-6 py-10 space-y-10">
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
              onClick={() => handleAddPlayer(false)}
              disabled={!newPlayerName.trim()}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-white rounded-xl px-5 py-3 text-sm font-medium transition-colors"
            >
              Add
            </button>
            <button
              onClick={() => handleAddPlayer(true)}
              disabled={!newPlayerName.trim()}
              className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-400 rounded-xl px-4 py-3 text-sm font-medium transition-colors"
              title="Add as guest — hidden from stats until promoted"
            >
              Guest
            </button>
          </div>
        </section>

        <button
          onClick={handleProceedToTeams}
          disabled={selectedIds.size === 0}
          className="w-full bg-blue-600 hover:bg-blue-500 disabled:opacity-30 disabled:cursor-not-allowed text-white rounded-2xl px-6 py-4 font-bold text-base transition-all shadow-lg shadow-blue-900/30"
        >
          Assign Teams →
        </button>
      </div>

      {showRoster && (
        <PlayerManagementPanel
          players={players}
          onClose={() => setShowRoster(false)}
          onAdd={createPlayer}
          onUpdate={handleUpdatePlayer}
          onDelete={handleDeletePlayer}
        />
      )}
    </div>
  );
}
