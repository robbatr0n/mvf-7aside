import { supabase } from "../lib/supabaseClient";
import type { Event, EventType } from "../types";

export async function getEvents(): Promise<Event[]> {
  const { data, error } = await supabase
    .from("events")
    .select("*")
    .order("created_at", { ascending: true })
    .limit(10000);
  if (error) throw error;
  console.log("events fetched:", data.length);
  return data;
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
