import type { Event, EventType } from '../types'

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

export async function getEvents(): Promise<Event[]> {
  return apiFetch<Event[]>('/api/events')
}

export async function addEvent(
  gameId: string,
  playerId: string,
  eventType: EventType,
  relatedEventId?: string,
): Promise<Event> {
  return apiFetch<Event>('/api/events', {
    method: 'POST',
    body: JSON.stringify({
      game_id: gameId,
      player_id: playerId,
      event_type: eventType,
      related_event_id: relatedEventId ?? null,
    }),
  })
}

export async function removeEvent(id: string): Promise<void> {
  return apiFetch<void>(`/api/events?id=${id}`, { method: 'DELETE' })
}

export async function removeRelatedEvents(relatedEventId: string): Promise<void> {
  return apiFetch<void>(`/api/events?related_event_id=${relatedEventId}`, { method: 'DELETE' })
}

export async function updateEventClipUrl(id: string, clip_url: string | null): Promise<void> {
  return apiFetch<void>(`/api/events?id=${id}`, {
    method: 'PATCH',
    body: JSON.stringify({ clip_url }),
  })
}
