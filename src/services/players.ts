import { supabase } from '../lib/supabaseClient'
import type { Player } from '../types'

export async function getPlayers(): Promise<Player[]> {
  const { data, error } = await supabase
    .from('players')
    .select('*')
    .order('name')

  if (error) throw error
  return data
}

export async function addPlayer(name: string): Promise<Player> {
  const { data, error } = await supabase
    .from('players')
    .insert({ name })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updatePlayer(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .update({ name })
    .eq('id', id)

  if (error) throw error
}

export async function deletePlayer(id: string): Promise<void> {
  const { error } = await supabase
    .from('players')
    .delete()
    .eq('id', id)

  if (error) throw error
}