import type { Player } from '../types'

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

export async function getPlayers(): Promise<Player[]> {
  return apiFetch<Player[]>('/api/players')
}

export async function addPlayer(name: string, isGuest = false): Promise<Player> {
  return apiFetch<Player>('/api/players', {
    method: 'POST',
    body: JSON.stringify({ name, is_guest: isGuest }),
  })
}

export async function updatePlayer(id: string, name: string): Promise<void> {
  return apiFetch<void>(`/api/players?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name }),
  })
}

export async function deletePlayer(id: string): Promise<void> {
  return apiFetch<void>(`/api/players?id=${id}`, { method: 'DELETE' })
}

export async function promoteGuest(id: string, name: string): Promise<void> {
  return apiFetch<void>(`/api/players?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ name, is_guest: false }),
  })
}
