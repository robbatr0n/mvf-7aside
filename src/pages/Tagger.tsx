import { useState } from 'react'
import { TAGGER_PASSWORD } from '../constants'
import GameSetup from '../components/tagger/GameSetup'
import EventLogger from '../components/tagger/EventLogger'
import { setGameResult } from '../services/games'
import type { Game, Player } from '../types'
import { useGames } from '../hooks/useGames'

type Phase = 'auth' | 'setup' | 'tagging' | 'result'

export default function Tagger() {
  const [phase, setPhase] = useState<Phase>('auth')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [game, setGame] = useState<Game | null>(null)
  const [activePlayers, setActivePlayers] = useState<Player[]>([])
  const [teamAssignments, setTeamAssignments] = useState<Map<string, 1 | 2>>(new Map())
  const [submitting, setSubmitting] = useState(false)
  const { refresh: refreshGames } = useGames()

  function handleLogin() {
    if (password === TAGGER_PASSWORD) {
      setPhase('setup')
      setError('')
    } else {
      setError('Incorrect password')
    }
  }

  function handleGameReady(game: Game, players: Player[], assignments: Map<string, 1 | 2>) {
    setGame(game)
    setActivePlayers(players)
    setTeamAssignments(assignments)
    setPhase('tagging')
  }

  async function handleResult(result: 0 | 1 | 2) {
    if (!game) return
    setSubmitting(true)
    await setGameResult(game.id, result)
    refreshGames()
    setPhase('setup')
    setGame(null)
    setActivePlayers([])
    setTeamAssignments(new Map())
    setSubmitting(false)
  }

  if (phase === 'auth') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 p-8 rounded-xl w-full max-w-sm space-y-4">
          <h1 className="text-white text-xl font-bold">Tagger</h1>
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            className="w-full bg-gray-800 text-white rounded-lg px-4 py-2 outline-none"
          />
          {error && <p className="text-red-400 text-sm">{error}</p>}
          <button
            onClick={handleLogin}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white rounded-lg px-4 py-2 font-medium"
          >
            Enter
          </button>
        </div>
      </div>
    )
  }

  if (phase === 'setup') {
    return <GameSetup onReady={handleGameReady} />
  }

  if (phase === 'result') {
    const team1 = activePlayers.filter(p => teamAssignments.get(p.id) === 1)
    const team2 = activePlayers.filter(p => teamAssignments.get(p.id) === 2)

    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-950">
        <div className="bg-gray-900 p-8 rounded-xl w-full max-w-sm space-y-6">
          <div className="space-y-1">
            <h1 className="text-white text-xl font-bold">Who won?</h1>
            <p className="text-gray-500 text-sm">Select the winning team</p>
          </div>

          <div className="space-y-3">
            <button
              onClick={() => handleResult(1)}
              disabled={submitting}
              className="w-full bg-gray-800 hover:bg-blue-600 text-white rounded-xl px-5 py-4 text-left transition-colors space-y-1"
            >
              <p className="font-semibold">No Bib win</p>
              <p className="text-gray-400 text-xs">{team1.map(p => p.name).join(', ')}</p>
            </button>

            <button
              onClick={() => handleResult(2)}
              disabled={submitting}
              className="w-full bg-gray-800 hover:bg-orange-700 text-white rounded-xl px-5 py-4 text-left transition-colors space-y-1"
            >
              <p className="font-semibold">🟠 Orange Bib win</p>
              <p className="text-gray-400 text-xs">{team2.map(p => p.name).join(', ')}</p>
            </button>

            <button
              onClick={() => handleResult(0)}
              disabled={submitting}
              className="w-full bg-gray-800 hover:bg-gray-700 text-gray-300 rounded-xl px-5 py-4 font-semibold transition-colors"
            >
              Draw
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <EventLogger
      game={game!}
      activePlayers={activePlayers}
      teamAssignments={teamAssignments}
      onFinish={() => setPhase('result')}
    />
  )
}
