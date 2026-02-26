import { useState } from 'react'
import { useEvents } from '../../hooks/useEvents'
import EventLog from './EventLog'
import GoalModal from './GoalModal'
import type { Game, Player } from '../../types'

interface Props {
  game: Game
  activePlayers: Player[]
  onFinish: () => void
}

type ShotStep = 'shooter' | 'key_passer'

interface PendingShot {
  type: 'shot_on_target' | 'shot_off_target'
  shooterId: string | null
  step: ShotStep
}

export default function EventLogger({ game, activePlayers, onFinish }: Props) {
  const { events, createEvent, removeEvent } = useEvents()
  const [showGoalModal, setShowGoalModal] = useState(false)
  const [pendingShot, setPendingShot] = useState<PendingShot | null>(null)

  const gameEvents = events.filter(e => e.game_id === game.id)

  // Goal flow
  async function handleGoalConfirm(scorerId: string, assisterId: string | null) {
    await createEvent(game.id, scorerId, 'goal')
    await createEvent(game.id, scorerId, 'shot_on_target')
    if (assisterId) {
      await createEvent(game.id, assisterId, 'assist')
      await createEvent(game.id, assisterId, 'key_pass')
    }
    setShowGoalModal(false)
  }

  // Shot flow — step 1: select shot type
  function handleShotTypeClick(type: 'shot_on_target' | 'shot_off_target') {
    setPendingShot({ type, shooterId: null, step: 'shooter' })
  }

  // Shot flow — step 2: select shooter
  async function handleShooterSelect(shooterId: string) {
    if (!pendingShot) return
    await createEvent(game.id, shooterId, pendingShot.type)
    setPendingShot({ ...pendingShot, shooterId, step: 'key_passer' })
  }

  // Shot flow — step 3: optional key passer
  async function handleKeyPasserSelect(keyPasserId: string | null) {
    if (!pendingShot) return
    if (keyPasserId) {
      await createEvent(game.id, keyPasserId, 'key_pass')
    }
    setPendingShot(null)
  }

  const shooterName = activePlayers.find(p => p.id === pendingShot?.shooterId)?.name

  return (
    <div className="min-h-screen bg-gray-950 text-white flex flex-col">

      {/* Header */}
      <div className="border-b border-gray-800 px-6 py-4 flex items-center justify-between">
        <span className="text-white font-semibold">Tagging</span>
        <button
          onClick={onFinish}
          className="bg-gray-800 hover:bg-gray-700 text-white rounded-lg px-4 py-2 text-sm font-medium transition-colors"
        >
          Finish →
        </button>
      </div>

      <div className="flex-1 p-4 space-y-6 max-w-2xl mx-auto w-full pt-8">

        {/* Default — event type buttons */}
        {!pendingShot && (
          <div className="space-y-3">
            <h2 className="text-gray-400 text-sm font-medium uppercase tracking-wider">
              Tag Event
            </h2>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowGoalModal(true)}
                className="bg-green-700 hover:bg-green-600 text-white rounded-xl px-4 py-4 font-semibold text-lg transition-colors col-span-2"
              >
                ⚽ Goal
              </button>
              <button
                onClick={() => handleShotTypeClick('shot_on_target')}
                className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-3 font-medium transition-colors"
              >
                🟢 Shot on Target
              </button>
              <button
                onClick={() => handleShotTypeClick('shot_off_target')}
                className="bg-gray-800 hover:bg-gray-700 text-white rounded-xl px-4 py-3 font-medium transition-colors"
              >
                🔴 Shot off Target
              </button>
            </div>
          </div>
        )}

        {/* Shot step 1 — select shooter */}
        {pendingShot?.step === 'shooter' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-white font-semibold">
                {pendingShot.type === 'shot_on_target'
                  ? '🟢 Shot on Target'
                  : '🔴 Shot off Target'} — Who shot?
              </h2>
              <button
                onClick={() => setPendingShot(null)}
                className="text-gray-500 hover:text-white text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {activePlayers.map(player => (
                <button
                  key={player.id}
                  onClick={() => handleShooterSelect(player.id)}
                  className="bg-gray-800 hover:bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
                >
                  {player.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Shot step 2 — optional key passer */}
        {pendingShot?.step === 'key_passer' && (
          <div className="space-y-3">
            <div className="space-y-1">
              <h2 className="text-white font-semibold">🔑 Who played the key pass?</h2>
              <p className="text-gray-500 text-sm">Shot by {shooterName}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {activePlayers
                .filter(p => p.id !== pendingShot.shooterId)
                .map(player => (
                  <button
                    key={player.id}
                    onClick={() => handleKeyPasserSelect(player.id)}
                    className="bg-gray-800 hover:bg-blue-600 text-white rounded-lg px-4 py-3 text-sm font-medium transition-colors"
                  >
                    {player.name}
                  </button>
                ))}
              <button
                onClick={() => handleKeyPasserSelect(null)}
                className="bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg px-4 py-3 text-sm font-medium transition-colors col-span-2"
              >
                No key pass
              </button>
            </div>
          </div>
        )}

        <EventLog
          events={gameEvents}
          players={activePlayers}
          onUndo={removeEvent}
        />
      </div>

      {showGoalModal && (
        <GoalModal
          players={activePlayers}
          onConfirm={handleGoalConfirm}
          onCancel={() => setShowGoalModal(false)}
        />
      )}
    </div>
  )
}