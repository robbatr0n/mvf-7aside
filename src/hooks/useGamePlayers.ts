import { useEffect, useState } from 'react'
import { getGamePlayers } from '../services/games'
import type { GamePlayer } from '../types'

export function useGamePlayers() {
    const [gamePlayers, setGamePlayers] = useState<GamePlayer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetch()
    }, [])

    async function fetch() {
        try {
            setLoading(true)
            const data = await getGamePlayers()
            setGamePlayers(data)
        } catch (e) {
            console.error('Failed to load game players')
        } finally {
            setLoading(false)
        }
    }

    return { gamePlayers, loading }
}