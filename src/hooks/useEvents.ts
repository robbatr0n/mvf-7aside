import { useEffect, useState } from 'react'
import { getEvents, addEvent, deleteEvent } from '../services/events'
import type { Event, EventType } from '../types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch()
  }, [])

  async function fetch() {
    try {
      setLoading(true)
      const data = await getEvents()
      setEvents(data)
    } catch (e) {
      setError('Failed to load events')
    } finally {
      setLoading(false)
    }
  }

  async function createEvent(gameId: string, playerId: string, eventType: EventType) {
    const event = await addEvent(gameId, playerId, eventType)
    setEvents(prev => [...prev, event])
    return event
  }

  async function removeEvent(eventId: string) {
    await deleteEvent(eventId)
    setEvents(prev => prev.filter(e => e.id !== eventId))
  }

  return { events, loading, error, createEvent, removeEvent, refresh: fetch }
}