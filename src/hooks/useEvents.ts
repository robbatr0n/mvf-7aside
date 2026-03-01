import { useEffect, useRef, useState } from 'react'
import { getEvents, addEvent, removeEvent, removeRelatedEvents } from '../services/events'
import type { Event, EventType } from '../types'

export function useEvents() {
  const [events, setEvents] = useState<Event[]>([])
  const [loading, setLoading] = useState(true)
  const queueRef = useRef<Promise<void>>(Promise.resolve())

  useEffect(() => {
    fetch()
  }, [])

  async function fetch() {
    try {
      setLoading(true)
      const data = await getEvents()
      setEvents(data)
    } catch (e) {
      console.error('Failed to load events', e)
    } finally {
      setLoading(false)
    }
  }

  async function createEvent(
    gameId: string,
    playerId: string,
    eventType: EventType,
    relatedEventId?: string
  ): Promise<Event | undefined> {
    return new Promise((resolve, reject) => {
      queueRef.current = queueRef.current.then(async () => {
        try {
          const event = await addEvent(gameId, playerId, eventType, relatedEventId)
          setEvents(prev => [...prev, event])
          resolve(event)
        } catch (e) {
          console.error('Failed to create event', e)
          reject(e)
        }
      })
    })
  }

  async function deleteEvent(id: string) {
    try {
      await removeEvent(id)
      await removeRelatedEvents(id)
      setEvents(prev => prev.filter(e => e.id !== id && e.related_event_id !== id))
    } catch (e) {
      console.error('Failed to delete event', e)
    }
  }

  return { events, loading, createEvent, removeEvent: deleteEvent, refresh: fetch }
}