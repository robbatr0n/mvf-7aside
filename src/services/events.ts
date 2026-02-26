import { supabase } from '../lib/supabaseClient'
import type { Event, EventType } from '../types'

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')

  if (error) throw error
  return data
}

export async function getEventsByPlayer(playerId: string): Promise<Event[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('player_id', playerId)

  if (error) throw error
  return data
}

export async function addEvent(
  gameId: string,
  playerId: string,
  eventType: EventType
): Promise<Event> {
  const { data, error } = await supabase
    .from('events')
    .insert({ game_id: gameId, player_id: playerId, event_type: eventType })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteEvent(eventId: string): Promise<void> {
  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)

  if (error) throw error
}