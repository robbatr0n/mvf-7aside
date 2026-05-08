import type { Game, GamePlayer } from '../types'

async function apiFetch<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`API error ${res.status}: ${body}`)
  }
  if (res.status === 204) return undefined as T
  return res.json() as Promise<T>
}

export async function getGames(): Promise<Game[]> {
  return apiFetch<Game[]>('/api/games')
}

export async function addGame(date: string): Promise<Game> {
  return apiFetch<Game>('/api/games', {
    method: 'POST',
    body: JSON.stringify({ date }),
  })
}

export async function addGamePlayers(
  gameId: string,
  teamAssignments: { playerId: string; team: 1 | 2; is_goalkeeper?: boolean }[],
): Promise<void> {
  return apiFetch<void>('/api/game-players', {
    method: 'POST',
    body: JSON.stringify({
      rows: teamAssignments.map(({ playerId, team, is_goalkeeper }) => ({
        game_id: gameId,
        player_id: playerId,
        team,
        is_goalkeeper: is_goalkeeper ?? false,
      })),
    }),
  })
}

export async function setGameResult(gameId: string, winningTeam: 0 | 1 | 2): Promise<void> {
  return apiFetch<void>(`/api/games?id=${gameId}`, {
    method: 'PATCH',
    body: JSON.stringify({ winning_team: winningTeam }),
  })
}

export async function getGamePlayers(): Promise<GamePlayer[]> {
  return apiFetch<GamePlayer[]>('/api/game-players')
}

export async function setGameKeeper(gameId: string, playerId: string | null): Promise<void> {
  return apiFetch<void>('/api/game-players', {
    method: 'PATCH',
    body: JSON.stringify({ game_id: gameId, player_id: playerId }),
  })
}
