import { supabase } from "../lib/supabaseClient";
import type { Event, EventType } from "../types";

export async function getEvents(): Promise<Event[]> {
  const allEvents: Event[] = []
  const PAGE_SIZE = 1000
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .order('created_at', { ascending: true })
      .range(from, from + PAGE_SIZE - 1)

    if (error) throw error
    if (!data || data.length === 0) break

    allEvents.push(...data)

    if (data.length < PAGE_SIZE) break
    from += PAGE_SIZE
  }

  console.log('events fetched:', allEvents.length)
  return allEvents
}
export async function addEvent(
  gameId: string,
  playerId: string,
  eventType: EventType,
  relatedEventId?: string,
): Promise<Event> {
  const { data, error } = await supabase
    .from("events")
    .insert({
      game_id: gameId,
      player_id: playerId,
      event_type: eventType,
      ...(relatedEventId ? { related_event_id: relatedEventId } : {}),
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function removeEvent(id: string): Promise<void> {
  const { error } = await supabase.from("events").delete().eq("id", id);

  if (error) throw error;
}

export async function removeRelatedEvents(
  relatedEventId: string,
): Promise<void> {
  const { error } = await supabase
    .from("events")
    .delete()
    .eq("related_event_id", relatedEventId);

  if (error) throw error;
}
