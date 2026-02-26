import { supabase } from '../lib/supabaseClient'
import type { Game, GamePlayer } from '../types'

export async function getGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select('*')
    .order('date', { ascending: false })

  if (error) throw error
  return data
}

export async function addGame(date: string): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .insert({ date })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function addGamePlayers(
  gameId: string,
  teamAssignments: { playerId: string; team: 1 | 2 }[]
): Promise<void> {
  const rows = teamAssignments.map(({ playerId, team }) => ({
    game_id: gameId,
    player_id: playerId,
    team,
  }))

  const { error } = await supabase.from('game_players').insert(rows)
  if (error) throw error
}

export async function setGameResult(
  gameId: string,
  winningTeam: 0 | 1 | 2
): Promise<void> {
  const { error } = await supabase
    .from('games')
    .update({ winning_team: winningTeam })
    .eq('id', gameId)

  if (error) throw error
}

export async function getGamePlayers(): Promise<GamePlayer[]> {
  const { data, error } = await supabase
    .from('game_players')
    .select('*')

  if (error) throw error
  return data
}