import { useMemo } from "react";
import type {
  PlayerStats,
  GoalkeeperStats,
  Player,
  Event,
  Game,
  GamePlayer,
} from "../types";
import {
  getTeamOfSeasonPlayerIds,
  calculateTotwAppearances,
  calculateMotmAppearances,
  calculateMotmByGame,
} from "../utils/stats";

export function useTeamStats(
  stats: PlayerStats[],
  goalkeeperStats: GoalkeeperStats[],
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
) {
  const teamOfSeasonIds = useMemo(
    () => getTeamOfSeasonPlayerIds(stats, goalkeeperStats),
    [stats, goalkeeperStats],
  );

  const totwAppearances = useMemo(
    () => calculateTotwAppearances(players, events, games, gamePlayers),
    [players, events, games, gamePlayers],
  );

  const motmAppearances = useMemo(
    () => calculateMotmAppearances(players, events, games, gamePlayers),
    [players, events, games, gamePlayers],
  );

  const motmByGame = useMemo(
    () => calculateMotmByGame(players, events, games, gamePlayers),
    [players, events, games, gamePlayers],
  );

  return { teamOfSeasonIds, totwAppearances, motmAppearances, motmByGame };
}
