import { useEffect, useState } from 'react'
import { getGames } from '../services/games'
import type { Game } from '../types'

export function useGames() {
    const [games, setGames] = useState<Game[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    useEffect(() => {
        fetch()
    }, [])

    async function fetch() {
        try {
            setLoading(true)
            const data = await getGames()
            setGames(data)
        } catch (e) {
            setError('Failed to load games')
        } finally {
            setLoading(false)
        }
    }

    return { games, loading, error }
}