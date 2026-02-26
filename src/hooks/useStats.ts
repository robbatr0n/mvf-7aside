import { useMemo } from 'react'
import { calculateAllPlayerStats } from '../utils/stats'
import type { Game, GamePlayer, Player, Event, PlayerStats } from '../types'

export function useStats(
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[]
) {
  const stats = useMemo(
    () => calculateAllPlayerStats(players, events, games, gamePlayers),
    [players, events, games, gamePlayers]
  ) as PlayerStats[]

  const topScorer = [...stats].sort((a, b) => b.goals - a.goals)[0] ?? null
  const mostAssists = [...stats].sort((a, b) => b.assists - a.assists)[0] ?? null
  const mostInvolvements = [...stats].sort((a, b) => b.goal_involvements - a.goal_involvements)[0] ?? null
  const hatTrickHero = stats.find(s => s.hat_tricks > 0) ?? null

  return { stats, topScorer, mostAssists, mostInvolvements, hatTrickHero }
}