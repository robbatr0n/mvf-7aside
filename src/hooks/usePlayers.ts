import { useEffect, useState } from 'react'
import { getPlayers, addPlayer } from '../services/players'
import type { Player } from '../types'

export function usePlayers() {
  const [players, setPlayers] = useState<Player[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch()
  }, [])

  async function fetch() {
    try {
      setLoading(true)
      const data = await getPlayers()
      setPlayers(data)
    } catch (e) {
      setError('Failed to load players')
    } finally {
      setLoading(false)
    }
  }

  async function createPlayer(name: string) {
    const player = await addPlayer(name)
    setPlayers(prev => [...prev, player].sort((a, b) => a.name.localeCompare(b.name)))
    return player
  }

  return { players, loading, error, createPlayer, refresh: fetch }
}