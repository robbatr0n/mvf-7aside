import { useState } from 'react'
import type { Player } from '../../types'
import { updatePlayer, deletePlayer } from '../../services/players'

interface Props {
  players: Player[]
  onClose: () => void
  onAdd: (name: string) => Promise<Player>
  onUpdate: (id: string, name: string) => void
  onDelete: (id: string) => void
}

export default function PlayerManagementPanel({ players, onClose, onAdd, onUpdate, onDelete }: Props) {
  const [newName, setNewName] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editingName, setEditingName] = useState('')
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null)

  async function handleAdd() {
    if (!newName.trim()) return
    await onAdd(newName.trim())
    setNewName('')
  }

  async function handleUpdate(id: string) {
    if (!editingName.trim()) return
    await updatePlayer(id, editingName.trim())
    onUpdate(id, editingName.trim())
    setEditingId(null)
  }

  async function handleDelete(id: string) {
    await deletePlayer(id)
    onDelete(id)
    setConfirmDeleteId(null)
  }

  function startEdit(player: Player) {
    setEditingId(player.id)
    setEditingName(player.name)
    setConfirmDeleteId(null)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 z-40"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-sm bg-gray-900 border-l border-gray-800 z-50 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-gray-800">
          <h2 className="font-bold text-white text-lg">Player Roster</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors text-xl leading-none"
          >
            ✕
          </button>
        </div>

        {/* Add player */}
        <div className="px-6 py-4 border-b border-gray-800">
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="New player name..."
              value={newName}
              onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-xl px-4 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-gray-500 transition-colors"
            />
            <button
              onClick={handleAdd}
              disabled={!newName.trim()}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white rounded-xl px-4 py-2.5 text-sm font-medium transition-colors"
            >
              Add
            </button>
          </div>
        </div>

        {/* Player list */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          <p className="text-gray-600 text-xs uppercase tracking-widest font-semibold mb-3">
            {players.length} Players
          </p>
          {players.map(player => (
            <div key={player.id} className="space-y-2">

              {editingId === player.id ? (
                // Edit mode
                <div className="flex gap-2">
                  <input
                    autoFocus
                    type="text"
                    value={editingName}
                    onChange={e => setEditingName(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') handleUpdate(player.id)
                      if (e.key === 'Escape') setEditingId(null)
                    }}
                    className="flex-1 bg-gray-800 border border-blue-500 rounded-xl px-4 py-2.5 text-sm text-white outline-none"
                  />
                  <button
                    onClick={() => handleUpdate(player.id)}
                    className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl px-3 text-sm transition-colors"
                  >
                    Save
                  </button>
                  <button
                    onClick={() => setEditingId(null)}
                    className="text-gray-500 hover:text-white px-2 text-sm transition-colors"
                  >
                    ✕
                  </button>
                </div>
              ) : confirmDeleteId === player.id ? (
                // Confirm delete mode
                <div className="flex items-center justify-between bg-red-900/30 border border-red-800 rounded-xl px-4 py-2.5">
                  <span className="text-red-300 text-sm">Delete {player.name}?</span>
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
                // Normal mode
                <div className="flex items-center justify-between bg-gray-800 rounded-xl px-4 py-2.5 group">
                  <span className="text-white text-sm">{player.name}</span>
                  <div className="flex gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={() => startEdit(player)}
                      className="text-gray-500 hover:text-white text-xs transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setConfirmDeleteId(player.id)}
                      className="text-gray-500 hover:text-red-400 text-xs transition-colors"
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
    </>
  )
}