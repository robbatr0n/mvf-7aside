import { useState } from "react";
import type { Player } from "../../types";
import {
  updatePlayer,
  deletePlayer,
  promoteGuest,
} from "../../services/players";

interface Props {
  players: Player[];
  onClose: () => void;
  onAdd: (name: string, isGuest?: boolean) => Promise<Player>;
  onUpdate: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

export default function PlayerManagementPanel({
  players,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [promoting, setPromoting] = useState<string | null>(null);
  const [promoteName, setPromoteName] = useState("");

  async function handleAdd(isGuest = false) {
    if (!newName.trim()) return;
    await onAdd(newName.trim(), isGuest);
    setNewName("");
  }

  function startEdit(player: Player) {
    setEditingId(player.id);
    setEditingName(player.name);
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return;
    await updatePlayer(id, editingName.trim());
    onUpdate(id, editingName.trim());
    setEditingId(null);
  }

  async function handleDelete(id: string) {
    await deletePlayer(id);
    onDelete(id);
    setConfirmDeleteId(null);
  }

  function startPromote(player: Player) {
    setPromoting(player.id);
    setPromoteName(player.name);
  }

  async function handlePromote(id: string) {
    if (!promoteName.trim()) return;
    await promoteGuest(id, promoteName.trim());
    onUpdate(id, promoteName.trim());
    setPromoting(null);
  }

  const regularPlayers = players.filter((p) => !p.is_guest);
  const guestPlayers = players.filter((p) => p.is_guest);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/60 z-40" onClick={onClose} />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <span className="text-white font-semibold">Manage Roster</span>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-lg"
          >
            ✕
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {/* Add player */}
          <div className="space-y-2">
            <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
              Add Player
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name..."
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAdd(false)}
                className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-500 transition-colors"
              />
              <button
                onClick={() => handleAdd(false)}
                disabled={!newName.trim()}
                className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
              >
                Add
              </button>
              <button
                onClick={() => handleAdd(true)}
                disabled={!newName.trim()}
                title="Add as guest — hidden from stats until promoted"
                className="bg-gray-800 hover:bg-gray-700 disabled:opacity-40 text-gray-400 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors"
              >
                Guest
              </button>
            </div>
          </div>

          {/* Regular players */}
          {regularPlayers.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Players ({regularPlayers.length})
              </label>
              <div className="space-y-1">
                {regularPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="group flex items-center justify-between bg-gray-800/50 hover:bg-gray-800 rounded-xl px-4 py-3 transition-colors"
                  >
                    {editingId === player.id ? (
                      <div className="flex items-center gap-2 flex-1">
                        <input
                          type="text"
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdate(player.id);
                            if (e.key === "Escape") setEditingId(null);
                          }}
                          autoFocus
                          className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                        />
                        <button
                          onClick={() => handleUpdate(player.id)}
                          className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-gray-500 hover:text-white text-sm transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : confirmDeleteId === player.id ? (
                      <div className="flex items-center justify-between flex-1">
                        <span className="text-gray-400 text-sm">
                          Delete {player.name}?
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-gray-500 hover:text-white text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span className="text-white text-sm font-medium">
                          {player.name}
                        </span>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startEdit(player)}
                            className="text-gray-400 hover:text-white text-xs transition-colors"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(player.id)}
                            className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Guest players */}
          {guestPlayers.length > 0 && (
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                Guests ({guestPlayers.length})
              </label>
              <p className="text-gray-600 text-xs">
                Hidden from stats. Promote to add them to the leaderboard.
              </p>
              <div className="space-y-1">
                {guestPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="group bg-gray-800/30 hover:bg-gray-800/60 border border-gray-800 rounded-xl px-4 py-3 transition-colors"
                  >
                    {promoting === player.id ? (
                      <div className="space-y-2">
                        <p className="text-gray-400 text-xs">Promote as:</p>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={promoteName}
                            onChange={(e) => setPromoteName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handlePromote(player.id);
                              if (e.key === "Escape") setPromoting(null);
                            }}
                            autoFocus
                            className="flex-1 bg-gray-700 border border-gray-600 rounded-lg px-3 py-1.5 text-sm text-white outline-none focus:border-blue-500"
                          />
                          <button
                            onClick={() => handlePromote(player.id)}
                            className="text-green-400 hover:text-green-300 text-sm font-medium transition-colors"
                          >
                            Promote
                          </button>
                          <button
                            onClick={() => setPromoting(null)}
                            className="text-gray-500 hover:text-white text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : confirmDeleteId === player.id ? (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 text-sm">
                          Delete {player.name}?
                        </span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleDelete(player.id)}
                            className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(null)}
                            className="text-gray-500 hover:text-white text-sm transition-colors"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-400 text-sm">
                            {player.name}
                          </span>
                          <span className="text-xs text-gray-600 bg-gray-800 px-1.5 py-0.5 rounded">
                            guest
                          </span>
                        </div>
                        <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => startPromote(player)}
                            className="text-green-500 hover:text-green-400 text-xs font-medium transition-colors"
                          >
                            Promote
                          </button>
                          <button
                            onClick={() => setConfirmDeleteId(player.id)}
                            className="text-gray-400 hover:text-red-400 text-xs transition-colors"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
