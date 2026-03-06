import { useMemo } from 'react'
import { calculateGoalkeeperStats } from '../utils/stats'
import type { Player, Event, Game, GamePlayer, GoalkeeperStats } from '../types'

export function useGoalkeeperStats(
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[]
): GoalkeeperStats[] {
  return useMemo(
    () => calculateGoalkeeperStats(players, events, games, gamePlayers),
    [players, events, games, gamePlayers]
  )
}