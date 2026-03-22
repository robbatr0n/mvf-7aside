import type {
  Event,
  Game,
  GamePlayer,
  GoalkeeperStats,
  Player,
  PlayerStats,
} from "../types";

export function calculatePlayerStats(
  player: Player,
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
): PlayerStats {
  const playerEvents = events.filter((e) => e.player_id === player.id);

  const goals = playerEvents.filter((e) => e.event_type === "goal").length;
  const assists = playerEvents.filter((e) => e.event_type === "assist").length;
  const key_passes = playerEvents.filter(
    (e) => e.event_type === "key_pass",
  ).length;
  const shots_on_target = playerEvents.filter(
    (e) => e.event_type === "shot_on_target",
  ).length;
  const shots_off_target = playerEvents.filter(
    (e) => e.event_type === "shot_off_target",
  ).length;
  const total_shots = shots_on_target + shots_off_target;
  const shot_accuracy =
    total_shots > 0 ? Math.round((shots_on_target / total_shots) * 100) : 0;
  const shot_conversion =
    total_shots > 0 ? Math.round((goals / total_shots) * 100) : 0;

  const playerGameEntries = gamePlayers.filter(
    (gp) => gp.player_id === player.id,
  );
  const games_played = playerGameEntries.length;
  const goals_per_game =
    games_played > 0 ? Math.round((goals / games_played) * 100) / 100 : 0;

  const goalsByGame = new Map<string, number>();
  playerEvents
    .filter((e) => e.event_type === "goal")
    .forEach((e) => {
      goalsByGame.set(e.game_id, (goalsByGame.get(e.game_id) ?? 0) + 1);
    });
  const hat_tricks = Array.from(goalsByGame.values()).filter(
    (g) => g >= 3,
  ).length;

  const tackles = playerEvents.filter((e) => e.event_type === "tackle").length;
  const interceptions = playerEvents.filter(
    (e) => e.event_type === "interception",
  ).length;
  const defensive_actions = tackles + interceptions;
  const tackles_per_game =
    games_played > 0 ? Math.round((tackles / games_played) * 100) / 100 : 0;
  const interceptions_per_game =
    games_played > 0
      ? Math.round((interceptions / games_played) * 100) / 100
      : 0;

  let wins = 0;
  let losses = 0;
  let draws = 0;
  playerGameEntries.forEach((entry) => {
    const game = games.find((g) => g.id === entry.game_id);
    if (!game || game.winning_team === null) return;
    if (game.winning_team === 0) draws++;
    else if (game.winning_team === entry.team) wins++;
    else losses++;
  });

  const goal_involvements = goals + assists;
  const win_rate =
    games_played > 0 ? Math.round((wins / games_played) * 100) : 0;

  // Form — last 5 games in date order
  const playerGames = gamePlayers
    .filter((gp) => gp.player_id === player.id)
    .map((gp) => {
      const game = games.find((g) => g.id === gp.game_id);
      return game ? { game, team: gp.team } : null;
    })
    .filter(Boolean) as { game: Game; team: number }[];

  const sortedPlayerGames = playerGames.sort(
    (a, b) => new Date(b.game.date).getTime() - new Date(a.game.date).getTime(),
  );

  const form: ("W" | "L" | "D")[] = sortedPlayerGames
    .slice(0, 5)
    .map(({ game, team }) => {
      if (game.winning_team === null) return null;
      if (game.winning_team === 0) return "D";
      return game.winning_team === team ? "W" : "L";
    })
    .filter(Boolean) as ("W" | "L" | "D")[];

  // Best scoring streak
  const gamesChronological = [...sortedPlayerGames].reverse();
  let best_scoring_streak = 0;
  let streak = 0;

  gamesChronological.forEach(({ game }) => {
    const scored = events.some(
      (e) =>
        e.player_id === player.id &&
        e.game_id === game.id &&
        e.event_type === "goal",
    );
    if (scored) {
      streak++;
      if (streak > best_scoring_streak) best_scoring_streak = streak;
    } else {
      streak = 0;
    }
  });

  // Current scoring streak
  let current_scoring_streak = 0;
  for (const { game } of sortedPlayerGames) {
    const scored = events.some(
      (e) =>
        e.player_id === player.id &&
        e.game_id === game.id &&
        e.event_type === "goal",
    );
    if (scored) current_scoring_streak++;
    else break;
  }

  return {
    player,
    goals,
    assists,
    key_passes,
    shots_on_target,
    shots_off_target,
    shot_accuracy,
    shot_conversion,
    goal_involvements,
    games_played,
    goals_per_game,
    hat_tricks,
    wins,
    losses,
    draws,
    win_rate,
    form,
    current_scoring_streak,
    best_scoring_streak,
    tackles,
    interceptions,
    defensive_actions,
    tackles_per_game,
    interceptions_per_game,
  };
}

export function calculateAllPlayerStats(
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
): PlayerStats[] {
  return players
    .filter((p) => !p.is_guest && !p.is_goalkeeper)
    .map((player) => calculatePlayerStats(player, events, games, gamePlayers))
    .sort((a, b) => b.goals - a.goals);
}

export interface GoalEntry {
  scorer: Player;
  assister: Player | null;
  team_override: number | null;
}

export interface TeamStats {
  shots: number;
  shotsOnTarget: number;
  shotAccuracy: number;
  shotConversion: number;
  keyPasses: number;
  tackles: number;
  interceptions: number;
}

export interface GameSummary {
  game: Game;
  team1Players: Player[];
  team2Players: Player[];
  team1Goals: GoalEntry[];
  team2Goals: GoalEntry[];
  totalGoals: number;
  team1Stats: TeamStats;
  team2Stats: TeamStats;
}

export interface PlayerGameStats {
  game: Game;
  goals: number;
  assists: number;
  key_passes: number;
  shots_on_target: number;
  shots_off_target: number;
  goal_involvements: number;
  tackles: number;
  interceptions: number;
}

export function calculatePlayerGameBreakdown(
  playerId: string,
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
): PlayerGameStats[] {
  const playerGameIds = gamePlayers
    .filter((gp) => gp.player_id === playerId)
    .map((gp) => gp.game_id);

  return games
    .filter((g) => playerGameIds.includes(g.id))
    .map((game) => {
      const gameEvents = events.filter(
        (e) => e.player_id === playerId && e.game_id === game.id,
      );
      return {
        game,
        goals: gameEvents.filter((e) => e.event_type === "goal").length,
        assists: gameEvents.filter((e) => e.event_type === "assist").length,
        key_passes: gameEvents.filter((e) => e.event_type === "key_pass")
          .length,
        shots_on_target: gameEvents.filter(
          (e) => e.event_type === "shot_on_target",
        ).length,
        shots_off_target: gameEvents.filter(
          (e) => e.event_type === "shot_off_target",
        ).length,
        goal_involvements: gameEvents.filter(
          (e) => e.event_type === "goal" || e.event_type === "assist",
        ).length,
        tackles: gameEvents.filter((e) => e.event_type === "tackle").length,
        interceptions: gameEvents.filter((e) => e.event_type === "interception")
          .length,
      };
    })
    .sort(
      (a, b) =>
        new Date(b.game.date).getTime() - new Date(a.game.date).getTime(),
    );
}

function calcTeamStats(
  teamPlayers: Player[],
  gameEvents: Event[],
  teamGoals: number,
): TeamStats {
  const playerIds = new Set(teamPlayers.map((p) => p.id));
  const allShots = gameEvents.filter(
    (e) =>
      playerIds.has(e.player_id) &&
      (e.event_type === "shot_on_target" || e.event_type === "shot_off_target"),
  );
  const shotsOnTarget = allShots.filter(
    (e) => e.event_type === "shot_on_target",
  ).length;
  const totalShots = allShots.length;
  const keyPasses = gameEvents.filter(
    (e) => playerIds.has(e.player_id) && e.event_type === "key_pass",
  ).length;

  const tackles = gameEvents.filter(
    (e) => playerIds.has(e.player_id) && e.event_type === "tackle",
  ).length;

  const interceptions = gameEvents.filter(
    (e) => playerIds.has(e.player_id) && e.event_type === "interception",
  ).length;

  return {
    shots: totalShots,
    shotsOnTarget,
    shotAccuracy:
      totalShots > 0 ? Math.round((shotsOnTarget / totalShots) * 100) : 0,
    shotConversion:
      totalShots > 0 ? Math.round((teamGoals / totalShots) * 100) : 0,
    keyPasses,
    tackles,
    interceptions,
  };
}

export function calculateGameSummaries(
  games: Game[],
  players: Player[],
  events: Event[],
  gamePlayers: GamePlayer[],
): GameSummary[] {
  return [...games]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((game) => {
      const gameEvents = events.filter((e) => e.game_id === game.id);

      const gpEntries = gamePlayers.filter((gp) => gp.game_id === game.id);
      const team1Players = gpEntries
        .filter((gp) => gp.team === 1)
        .map((gp) => players.find((p) => p.id === gp.player_id))
        .filter(Boolean) as Player[];
      const team2Players = gpEntries
        .filter((gp) => gp.team === 2)
        .map((gp) => players.find((p) => p.id === gp.player_id))
        .filter(Boolean) as Player[];

      const goalEvents = gameEvents.filter((e) => e.event_type === "goal");

      const goalEntries: GoalEntry[] = goalEvents
        .map((goal) => {
          const scorer = players.find((p) => p.id === goal.player_id) ?? null;
          if (!scorer) return null;

          const linkedAssist = gameEvents.find(
            (e) => e.event_type === "assist" && e.related_event_id === goal.id,
          );

          let assister: Player | null = null;
          if (linkedAssist) {
            assister =
              players.find((p) => p.id === linkedAssist.player_id) ?? null;
          } else {
            const goalTime = new Date(goal.created_at).getTime();
            const unlinkedAssists = gameEvents.filter(
              (e) => e.event_type === "assist" && e.related_event_id === null,
            );
            const closest = unlinkedAssists
              .filter((a) => a.player_id !== goal.player_id)
              .filter((a) => new Date(a.created_at).getTime() >= goalTime)
              .sort(
                (a, b) =>
                  Math.abs(new Date(a.created_at).getTime() - goalTime) -
                  Math.abs(new Date(b.created_at).getTime() - goalTime),
              )[0];
            if (closest) {
              assister =
                players.find((p) => p.id === closest.player_id) ?? null;
            }
          }

          return {
            scorer,
            assister,
            team_override: goal.team_override ?? null,
          };
        })
        .filter(Boolean) as GoalEntry[];

      const team1Goals = goalEntries.filter((g) => {
        if (g.team_override !== null) return g.team_override === 1;
        return team1Players.some((p) => p.id === g.scorer.id);
      });

      const team2Goals = goalEntries.filter((g) => {
        if (g.team_override !== null) return g.team_override === 2;
        return team2Players.some((p) => p.id === g.scorer.id);
      });

      return {
        game,
        team1Players,
        team2Players,
        team1Goals,
        team2Goals,
        totalGoals: goalEntries.length,
        team1Stats: calcTeamStats(team1Players, gameEvents, team1Goals.length),
        team2Stats: calcTeamStats(team2Players, gameEvents, team2Goals.length),
      };
    });
}

export function calculateGoalkeeperStats(
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
): GoalkeeperStats[] {
  const goalkeepers = players.filter((p) => p.is_goalkeeper && !p.is_guest);

  return goalkeepers
    .map((keeper) => {
      let totalSaves = 0;
      let totalConceded = 0;
      let cleanSheets = 0;
      let gamesPlayed = 0;
      let wins = 0;
      let losses = 0;
      let draws = 0;
      const formHistory: ("W" | "L" | "D")[] = [];

      const sortedGames = [...games].sort(
        (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

      sortedGames.forEach((game) => {
        const keeperEntry = gamePlayers.find(
          (gp) => gp.game_id === game.id && gp.player_id === keeper.id,
        );
        if (!keeperEntry) return;

        gamesPlayed++;
        const keeperTeam = keeperEntry.team;
        const gameEvents = events.filter((e) => e.game_id === game.id);

        const opposingPlayerIds = new Set(
          gamePlayers
            .filter((gp) => gp.game_id === game.id && gp.team !== keeperTeam)
            .map((gp) => gp.player_id),
        );

        const saves = gameEvents.filter(
          (e) =>
            e.event_type === "shot_on_target" &&
            e.related_event_id === null &&
            opposingPlayerIds.has(e.player_id),
        ).length;

        const goalsConceded = gameEvents.filter((e) => {
          if (e.event_type !== "goal") return false;
          const override = e.team_override;
          if (override !== null) return override !== keeperTeam;
          return opposingPlayerIds.has(e.player_id);
        }).length;

        totalSaves += saves;
        totalConceded += goalsConceded;
        if (goalsConceded === 0) cleanSheets++;

        // Win/loss/draw
        if (game.winning_team === null) return;
        if (game.winning_team === 0) {
          draws++;
          formHistory.push("D");
        } else if (game.winning_team === keeperTeam) {
          wins++;
          formHistory.push("W");
        } else {
          losses++;
          formHistory.push("L");
        }
      });

      const totalShots = totalSaves + totalConceded;
      const savePercentage =
        totalShots > 0 ? Math.round((totalSaves / totalShots) * 100) : 0;

      return {
        player: keeper,
        games: gamesPlayed,
        saves: totalSaves,
        goalsConceded: totalConceded,
        savePercentage,
        cleanSheets,
        goalsConcededPerGame:
          gamesPlayed > 0
            ? Math.round((totalConceded / gamesPlayed) * 100) / 100
            : 0,
        wins,
        losses,
        draws,
        form: formHistory.slice(-5),
      };
    })
    .sort((a, b) => b.savePercentage - a.savePercentage);
}

export function calculateLastNPlayerStats(
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
  n: number,
): PlayerStats[] {
  return players
    .filter((p) => !p.is_guest && !p.is_goalkeeper)
    .map((player) => {
      // Find this player's last N games by date
      const playerGameEntries = gamePlayers
        .filter((gp) => gp.player_id === player.id)
        .map((gp) => {
          const game = games.find((g) => g.id === gp.game_id);
          return game ? { game, team: gp.team, game_id: gp.game_id } : null;
        })
        .filter(Boolean) as { game: Game; team: number; game_id: string }[];

      const lastNEntries = [...playerGameEntries]
        .sort(
          (a, b) =>
            new Date(b.game.date).getTime() - new Date(a.game.date).getTime(),
        )
        .slice(0, n);

      const lastNGameIds = new Set(lastNEntries.map((e) => e.game_id));

      // Filter events to last N games only
      const filteredEvents = events.filter(
        (e) => e.player_id === player.id && lastNGameIds.has(e.game_id),
      );
      const filteredGamePlayers = gamePlayers.filter(
        (gp) => gp.player_id === player.id && lastNGameIds.has(gp.game_id),
      );

      return calculatePlayerStats(
        player,
        filteredEvents,
        games,
        filteredGamePlayers,
      );
    })
    .filter((s) => s.games_played > 0)
    .sort((a, b) => b.goal_involvements - a.goal_involvements);
}

export interface TeamOfTheSeasonPlayer {
  player: Player;
  score: number;
  role: "goalkeeper" | "outfield";
}

export interface TeamOfTheSeason {
  goalkeeper: TeamOfTheSeasonPlayer | null;
  outfield: TeamOfTheSeasonPlayer[];
}

export function calculateTeamOfTheSeason(
  stats: PlayerStats[],
  goalkeeperStats: GoalkeeperStats[],
  minGames: number = 3,
): TeamOfTheSeason {
  // Goalkeeper — best save percentage with min games
  const bestKeeper =
    goalkeeperStats.sort((a, b) => b.savePercentage - a.savePercentage)[0] ??
    null;

  // Outfield composite score
  const qualifiedOutfield = stats.filter((s) => s.games_played >= minGames);

  const scored = qualifiedOutfield
    .map((s) => {
      const assistsPerGame =
        s.games_played > 0 ? s.assists / s.games_played : 0;
      const sotPerGame =
        s.games_played > 0 ? s.shots_on_target / s.games_played : 0;
      const kpPerGame = s.games_played > 0 ? s.key_passes / s.games_played : 0;
      const winRate = s.games_played > 0 ? s.wins / s.games_played : 0;

      const score =
        s.goals_per_game * 4 +
        assistsPerGame * 2.5 +
        sotPerGame * 0.5 +
        kpPerGame * 0.5 +
        s.tackles_per_game * 1 +
        s.interceptions_per_game * 1 +
        winRate * 2;

      return {
        player: s.player,
        score: Math.round(score * 100) / 100,
        role: "outfield" as const,
      };
    })
    .sort((a, b) => b.score - a.score);

  return {
    goalkeeper: bestKeeper
      ? {
          player: bestKeeper.player,
          score: bestKeeper.savePercentage,
          role: "goalkeeper",
        }
      : null,
    outfield: scored.slice(0, 6),
  };
}

export function calculateTeamOfTheWeek(
  gameId: string,
  players: Player[],
  events: Event[],
  gamePlayers: GamePlayer[],
): TeamOfTheSeason {
  const gameEvents = events.filter((e) => e.game_id === gameId);
  const gamePlayerEntries = gamePlayers.filter((gp) => gp.game_id === gameId);

  const outfieldEntries = gamePlayerEntries.filter((gp) => {
    const player = players.find((p) => p.id === gp.player_id);
    return player && !player.is_guest && !player.is_goalkeeper;
  });

  const scored = outfieldEntries
    .map((gp) => {
      const player = players.find((p) => p.id === gp.player_id)!;
      const playerEvents = gameEvents.filter(
        (e) => e.player_id === gp.player_id,
      );

      const goals = playerEvents.filter((e) => e.event_type === "goal").length;
      const assists = playerEvents.filter(
        (e) => e.event_type === "assist",
      ).length;
      const sot = playerEvents.filter(
        (e) => e.event_type === "shot_on_target",
      ).length;
      const kp = playerEvents.filter((e) => e.event_type === "key_pass").length;
      const tackles = playerEvents.filter(
        (e) => e.event_type === "tackle",
      ).length;
      const interceptions = playerEvents.filter(
        (e) => e.event_type === "interception",
      ).length;

      const score =
        goals * 4 +
        assists * 2.5 +
        sot * 0.5 +
        kp * 0.5 +
        tackles * 1 +
        interceptions * 1;

      return {
        player,
        score: Math.round(score * 100) / 100,
        role: "outfield" as const,
      };
    })
    .sort((a, b) => b.score - a.score);

  // Best keeper who played this game
  const keeperEntry = gamePlayerEntries.find((gp) => {
    const player = players.find((p) => p.id === gp.player_id);
    return player?.is_goalkeeper;
  });

  const goalkeeper = keeperEntry
    ? (() => {
        const player = players.find((p) => p.id === keeperEntry.player_id)!;
        return { player, score: 0, role: "goalkeeper" as const };
      })()
    : null;

  return {
    goalkeeper,
    outfield: scored.slice(0, 6),
  };
}

export function getTeamOfSeasonPlayerIds(
  stats: PlayerStats[],
  goalkeeperStats: GoalkeeperStats[],
): Set<string> {
  const team = calculateTeamOfTheSeason(stats, goalkeeperStats);
  const ids = new Set<string>();
  team.outfield.forEach((p) => ids.add(p.player.id));
  if (team.goalkeeper) ids.add(team.goalkeeper.player.id);
  return ids;
}

export function calculateTotwAppearances(
  players: Player[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
): Map<string, number> {
  const appearances = new Map<string, number>();

  const sortedGames = [...games].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  sortedGames.forEach((game) => {
    const team = calculateTeamOfTheWeek(game.id, players, events, gamePlayers);
    team.outfield.forEach((p) => {
      appearances.set(p.player.id, (appearances.get(p.player.id) ?? 0) + 1);
    });
    if (team.goalkeeper) {
      appearances.set(
        team.goalkeeper.player.id,
        (appearances.get(team.goalkeeper.player.id) ?? 0) + 1,
      );
    }
  });

  return appearances;
}
