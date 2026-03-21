import type { Event, Game, GamePlayer, PlayerStats, Player } from "../types";
import type { EventType } from "../types";

export interface Award {
  emoji: string;
  title: string;
  description: string;
  winners: string[];
  value: string;
  noWinner?: boolean;
}

export interface PartnershipAward {
  emoji: string;
  title: string;
  description: string;
  players: string[];
  value: string;
  noWinner?: boolean;
}

const MIN_GAMES = 3;
const MIN_SHOTS = 5;

function topN(stats: PlayerStats[], key: keyof PlayerStats): PlayerStats[] {
  const sorted = [...stats].sort(
    (a, b) => (b[key] as number) - (a[key] as number),
  );
  const best = sorted[0]?.[key];
  if (best === undefined || best === 0) return [];
  return sorted.filter((s) => s[key] === best);
}

function bestSingleGameStat(
  eventType: EventType,
  eligibleStats: PlayerStats[],
  events: Event[],
  players: Player[],
): { winners: string[]; best: number } {
  const byGameKey = new Map<string, number>();
  events.forEach((e) => {
    if (e.event_type !== eventType) return;
    const player = players.find((p) => p.id === e.player_id);
    if (!player || player.is_guest) return;
    const key = `${e.player_id}:${e.game_id}`;
    byGameKey.set(key, (byGameKey.get(key) ?? 0) + 1);
  });

  const bestByPlayer = new Map<string, number>();
  byGameKey.forEach((count, key) => {
    const playerId = key.split(":")[0];
    const current = bestByPlayer.get(playerId) ?? 0;
    if (count > current) bestByPlayer.set(playerId, count);
  });

  const best = Math.max(
    0,
    ...Array.from(bestByPlayer.entries())
      .filter(([playerId]) => !players.find((p) => p.id === playerId)?.is_guest)
      .map(([, count]) => count),
  );

  const winners = eligibleStats
    .filter((s) => (bestByPlayer.get(s.player.id) ?? 0) === best && best > 0)
    .map((s) => s.player.name);

  return { winners, best };
}

export function calculateAwards(
  stats: PlayerStats[],
  events: Event[],
  games: Game[],
  gamePlayers: GamePlayer[],
  players: Player[],
): { awards: Award[]; partnership: PartnershipAward | null } {
  const eligibleStats = stats.filter((s) => !s.player.exclude_from_awards);
  const qualified = eligibleStats.filter((s) => s.games_played >= MIN_GAMES);
  const shotQualified = eligibleStats.filter(
    (s) => s.shots_on_target + s.shots_off_target >= MIN_SHOTS,
  );

  // Top Scorer
  const topScorers = topN(eligibleStats, "goals");
  const topScorer: Award = {
    emoji: "🏆",
    title: "Top Scorer",
    description: "Most goals scored",
    winners: topScorers.map((s) => s.player.name),
    value: `${topScorers[0]?.goals ?? 0} goals`,
    noWinner: !topScorers[0] || topScorers[0].goals === 0,
  };

  // Goal Machine
  const goalMachineResult = bestSingleGameStat(
    "goal",
    eligibleStats,
    events,
    players,
  );
  const goalMachine: Award = {
    emoji: "💥",
    title: "Goal Machine",
    description: "Most goals in a single game",
    winners: goalMachineResult.winners,
    value: `${goalMachineResult.best} goals in one game`,
    noWinner: goalMachineResult.winners.length === 0,
  };

  // Playmaker
  const playmakers = topN(eligibleStats, "assists");
  const playmaker: Award = {
    emoji: "🎯",
    title: "Playmaker",
    description: "Most assists",
    winners: playmakers.map((s) => s.player.name),
    value: `${playmakers[0]?.assists ?? 0} assists`,
    noWinner: !playmakers[0] || playmakers[0].assists === 0,
  };

  // Assist Hero
  const assistHeroResult = bestSingleGameStat(
    "assist",
    eligibleStats,
    events,
    players,
  );
  const assistHero: Award = {
    emoji: "🎯",
    title: "Assist Hero",
    description: "Most assists in a single game",
    winners: assistHeroResult.winners,
    value: `${assistHeroResult.best} assists in one game`,
    noWinner: assistHeroResult.winners.length === 0,
  };

  // Most Involved
  const involved = topN(eligibleStats, "goal_involvements");
  const mostInvolved: Award = {
    emoji: "⭐",
    title: "Most Involved",
    description: "Highest goals + assists combined",
    winners: involved.map((s) => s.player.name),
    value: `${involved[0]?.goal_involvements ?? 0} G+A`,
    noWinner: !involved[0] || involved[0].goal_involvements === 0,
  };

  const bestGameByPlayer = new Map<string, number>();
  events.forEach((e) => {
    if (e.event_type !== "goal" && e.event_type !== "assist") return;
    const player = players.find((p) => p.id === e.player_id);
    if (!player || player.is_guest) return;
    const key = `${e.player_id}:${e.game_id}`;
    bestGameByPlayer.set(key, (bestGameByPlayer.get(key) ?? 0) + 1);
  });
  const bestSingleGA = new Map<string, number>();
  bestGameByPlayer.forEach((count, key) => {
    const playerId = key.split(":")[0];
    const current = bestSingleGA.get(playerId) ?? 0;
    if (count > current) bestSingleGA.set(playerId, count);
  });
  const bestSingle = Math.max(
    0,
    ...Array.from(bestSingleGA.entries())
      .filter(([playerId]) => !players.find((p) => p.id === playerId)?.is_guest)
      .map(([, count]) => count),
  );
  const wonderWinners = eligibleStats
    .filter(
      (s) =>
        (bestSingleGA.get(s.player.id) ?? 0) === bestSingle && bestSingle > 0,
    )
    .map((s) => s.player.name);
  const oneGameWonder: Award = {
    emoji: "🌟",
    title: "One Game Wonder",
    description: "Best single game G+A",
    winners: wonderWinners,
    value: `${bestSingle} G+A in one game`,
    noWinner: wonderWinners.length === 0,
  };

  // Chance Creator
  const creators = topN(eligibleStats, "key_passes");
  const chanceCreator: Award = {
    emoji: "🎪",
    title: "Chance Creator",
    description: "Most key passes",
    winners: creators.map((s) => s.player.name),
    value: `${creators[0]?.key_passes ?? 0} key passes`,
    noWinner: !creators[0] || creators[0].key_passes === 0,
  };

  // Key Pass Hero
  const keyPassHeroResult = bestSingleGameStat(
    "key_pass",
    eligibleStats,
    events,
    players,
  );
  const keyPassHero: Award = {
    emoji: "🎪",
    title: "Key Pass Hero",
    description: "Most key passes in a single game",
    winners: keyPassHeroResult.winners,
    value: `${keyPassHeroResult.best} key passes in one game`,
    noWinner: keyPassHeroResult.winners.length === 0,
  };

  // Hat Trick Hero
  const hatTrickers = eligibleStats
    .filter((s) => s.hat_tricks > 0)
    .sort((a, b) => b.hat_tricks - a.hat_tricks);
  const bestHatTricks = hatTrickers[0]?.hat_tricks;
  const hatTrickHeroes = hatTrickers.filter(
    (s) => s.hat_tricks === bestHatTricks,
  );
  const hatTrickHero: Award = {
    emoji: "🎩",
    title: "Hat Trick Hero",
    description: "Scored 3+ goals in a single game",
    winners: hatTrickHeroes.map((s) => s.player.name),
    value: bestHatTricks
      ? `${bestHatTricks} hat trick${bestHatTricks > 1 ? "s" : ""}`
      : "",
    noWinner: hatTrickHeroes.length === 0,
  };

  // Clinical
  const clinicalSorted = [...shotQualified].sort(
    (a, b) => b.shot_conversion - a.shot_conversion,
  );
  const bestConversion = clinicalSorted[0]?.shot_conversion;
  const clinicalWinners = clinicalSorted.filter(
    (s) => s.shot_conversion === bestConversion,
  );
  const clinical: Award = {
    emoji: "⚡",
    title: "Clinical",
    description: `Best shot conversion (min ${MIN_SHOTS} shots)`,
    winners: clinicalWinners.map((s) => s.player.name),
    value: bestConversion !== undefined ? `${bestConversion}% conversion` : "",
    noWinner: clinicalWinners.length === 0,
  };

  // Trigger Happy
  const totalShots = (s: PlayerStats) => s.shots_on_target + s.shots_off_target;
  const triggerSorted = [...eligibleStats]
    .filter((s) => totalShots(s) > 0)
    .sort((a, b) => totalShots(b) - totalShots(a));
  const mostShots = triggerSorted[0] ? totalShots(triggerSorted[0]) : 0;
  const triggerWinners = triggerSorted.filter(
    (s) => totalShots(s) === mostShots,
  );
  const triggerHappy: Award = {
    emoji: "🔫",
    title: "Trigger Happy",
    description: "Most total shots",
    winners: triggerWinners.map((s) => s.player.name),
    value: `${mostShots} shots`,
    noWinner: triggerWinners.length === 0,
  };

  // Nearly Man
  const nearlyManSorted = [...eligibleStats]
    .filter((s) => s.shots_on_target > s.goals)
    .sort(
      (a, b) => b.shots_on_target - b.goals - (a.shots_on_target - a.goals),
    );
  const mostSaved = nearlyManSorted[0]
    ? nearlyManSorted[0].shots_on_target - nearlyManSorted[0].goals
    : 0;
  const nearlyWinners = nearlyManSorted.filter(
    (s) => s.shots_on_target - s.goals === mostSaved,
  );
  const nearlyMan: Award = {
    emoji: "😬",
    title: "Nearly Man",
    description: "Most shots on target that were saved",
    winners: nearlyWinners.map((s) => s.player.name),
    value: `${mostSaved} saved`,
    noWinner: nearlyWinners.length === 0,
  };

  // Reliable
  const reliableSorted = [...qualified].sort(
    (a, b) => b.goals_per_game - a.goals_per_game,
  );
  const bestGPG = reliableSorted[0]?.goals_per_game;
  const reliableWinners = reliableSorted.filter(
    (s) => s.goals_per_game === bestGPG,
  );
  const reliable: Award = {
    emoji: "📈",
    title: "Reliable",
    description: `Best goals per game (min ${MIN_GAMES} games)`,
    winners: reliableWinners.map((s) => s.player.name),
    value: bestGPG !== undefined ? `${bestGPG} per game` : "",
    noWinner: reliableWinners.length === 0,
  };

  // Always There
  const maxGames = Math.max(0, ...eligibleStats.map((s) => s.games_played));
  const alwaysThereWinners = eligibleStats.filter(
    (s) => s.games_played === maxGames,
  );
  const alwaysThere: Award = {
    emoji: "🔴",
    title: "Always There",
    description: "Most games played",
    winners: alwaysThereWinners.map((s) => s.player.name),
    value: `${maxGames} games`,
    noWinner: alwaysThereWinners.length === 0,
  };

  // On Fire
  const streakSorted = [...eligibleStats]
    .filter((s) => s.current_scoring_streak > 0)
    .sort((a, b) => b.current_scoring_streak - a.current_scoring_streak);
  const bestStreak = streakSorted[0]?.current_scoring_streak ?? 0;
  const streakWinners = streakSorted.filter(
    (s) => s.current_scoring_streak === bestStreak,
  );
  const onFire: Award = {
    emoji: "🔥",
    title: "On Fire",
    description: "Longest current scoring streak",
    winners: streakWinners.map((s) => s.player.name),
    value: `${bestStreak} game${bestStreak !== 1 ? "s" : ""} in a row`,
    noWinner: streakWinners.length === 0,
  };

  // Winner
  const winnerWinners = topN(eligibleStats, "wins");
  const winner: Award = {
    emoji: "👑",
    title: "Winner",
    description: "Most wins",
    winners: winnerWinners.map((s) => s.player.name),
    value: `${winnerWinners[0]?.wins ?? 0} wins`,
    noWinner: !winnerWinners[0] || winnerWinners[0].wins === 0,
  };

  // Unbeaten
  const unbeatenPlayers = qualified
    .filter((s) => s.losses === 0)
    .sort((a, b) => b.wins - a.wins);
  const mostWinsUnbeaten = unbeatenPlayers[0]?.wins;
  const unbeatenWinners = unbeatenPlayers.filter(
    (s) => s.wins === mostWinsUnbeaten,
  );
  const unbeaten: Award = {
    emoji: "😤",
    title: "Unbeaten",
    description: `No losses (min ${MIN_GAMES} games)`,
    winners: unbeatenWinners.map((s) => s.player.name),
    value: unbeatenWinners[0]
      ? `${unbeatenWinners[0].wins}W ${unbeatenWinners[0].draws}D`
      : "",
    noWinner: unbeatenWinners.length === 0,
  };

  // Unlucky
  const unluckyWinners = topN(eligibleStats, "losses");
  const unlucky: Award = {
    emoji: "💔",
    title: "Unlucky",
    description: "Most losses",
    winners: unluckyWinners.map((s) => s.player.name),
    value: `${unluckyWinners[0]?.losses ?? 0} losses`,
    noWinner: !unluckyWinners[0] || unluckyWinners[0].losses === 0,
  };

  // Unlucky Hero
  const unluckyHeroSorted = [...qualified]
    .filter((s) => s.games_played > 0)
    .sort((a, b) => {
      const aScore = a.goals_per_game - a.wins / a.games_played;
      const bScore = b.goals_per_game - b.wins / b.games_played;
      return bScore - aScore;
    });
  const unluckyHeroWinner = unluckyHeroSorted[0];
  const unluckyHero: Award = {
    emoji: "💪",
    title: "Unlucky Hero",
    description: `Best scorer on losing teams (min ${MIN_GAMES} games)`,
    winners: unluckyHeroWinner ? [unluckyHeroWinner.player.name] : [],
    value: unluckyHeroWinner
      ? `${unluckyHeroWinner.goals_per_game} GPG, ${Math.round((unluckyHeroWinner.wins / unluckyHeroWinner.games_played) * 100)}% win rate`
      : "",
    noWinner: !unluckyHeroWinner,
  };

  // Ghost
  const ghostByPlayer = new Map<string, number>();
  qualified.forEach((s) => {
    let blankGames = 0;
    games.forEach((game) => {
      const played = gamePlayers.some(
        (gp) => gp.player_id === s.player.id && gp.game_id === game.id,
      );
      if (!played) return;
      const involvement = events.filter(
        (e) =>
          e.player_id === s.player.id &&
          e.game_id === game.id &&
          (e.event_type === "goal" || e.event_type === "assist"),
      ).length;
      if (involvement === 0) blankGames++;
    });
    ghostByPlayer.set(s.player.id, blankGames);
  });
  const mostBlankGames = Math.max(0, ...Array.from(ghostByPlayer.values()));
  const ghostWinners = qualified
    .filter(
      (s) =>
        (ghostByPlayer.get(s.player.id) ?? 0) === mostBlankGames &&
        mostBlankGames > 0,
    )
    .map((s) => s.player.name);
  const ghost: Award = {
    emoji: "👻",
    title: "Ghost",
    description: `Most games with zero goals or assists (min ${MIN_GAMES} games)`,
    winners: ghostWinners,
    value: `${mostBlankGames} blank game${mostBlankGames !== 1 ? "s" : ""}`,
    noWinner: true,
  };

  // Hardman
  const hardmanWinners = topN(eligibleStats, "tackles");
  const hardman: Award = {
    emoji: "💪",
    title: "Hardman",
    description: "Most tackles",
    winners: hardmanWinners.map((s) => s.player.name),
    value: `${hardmanWinners[0]?.tackles ?? 0} tackles`,
    noWinner: !hardmanWinners[0] || hardmanWinners[0].tackles === 0,
  };

  // Sweeper
  const sweeperWinners = topN(eligibleStats, "interceptions");
  const sweeper: Award = {
    emoji: "✋",
    title: "Sweeper",
    description: "Most interceptions",
    winners: sweeperWinners.map((s) => s.player.name),
    value: `${sweeperWinners[0]?.interceptions ?? 0} interceptions`,
    noWinner: !sweeperWinners[0] || sweeperWinners[0].interceptions === 0,
  };

  // Enforcer
  const enforcerWinners = topN(eligibleStats, "defensive_actions");
  const enforcer: Award = {
    emoji: "🛡️",
    title: "Enforcer",
    description: "Most tackles + interceptions combined",
    winners: enforcerWinners.map((s) => s.player.name),
    value: `${enforcerWinners[0]?.defensive_actions ?? 0} defensive actions`,
    noWinner: !enforcerWinners[0] || enforcerWinners[0].defensive_actions === 0,
  };

  // Tackle Hero
  const tackleHeroResult = bestSingleGameStat(
    "tackle",
    eligibleStats,
    events,
    players,
  );
  const tackleHero: Award = {
    emoji: "🦵",
    title: "Tackle Hero",
    description: "Most tackles in a single game",
    winners: tackleHeroResult.winners,
    value: `${tackleHeroResult.best} tackles in one game`,
    noWinner: tackleHeroResult.winners.length === 0,
  };

  // Interception Hero
  const interceptionHeroResult = bestSingleGameStat(
    "interception",
    eligibleStats,
    events,
    players,
  );
  const interceptionHero: Award = {
    emoji: "🕵️",
    title: "Interception Hero",
    description: "Most interceptions in a single game",
    winners: interceptionHeroResult.winners,
    value: `${interceptionHeroResult.best} interceptions in one game`,
    noWinner: interceptionHeroResult.winners.length === 0,
  };

  // Terminator
  const tacklesPerGameWinners = topN(qualified, "tackles_per_game");
  const tacklesPerGame: Award = {
    emoji: "💪",
    title: "Terminator",
    description: "Best tackles per game rate",
    winners: tacklesPerGameWinners.map((s) => s.player.name),
    value: `${tacklesPerGameWinners[0]?.tackles_per_game ?? 0} per game`,
    noWinner:
      !tacklesPerGameWinners[0] ||
      tacklesPerGameWinners[0].tackles_per_game === 0,
  };

  // The Interceptor
  const interceptionsPerGameWinners = topN(qualified, "interceptions_per_game");
  const interceptionsPerGame: Award = {
    emoji: "✋",
    title: "The Interceptor",
    description: "Best interceptions per game rate",
    winners: interceptionsPerGameWinners.map((s) => s.player.name),
    value: `${interceptionsPerGameWinners[0]?.interceptions_per_game ?? 0} per game`,
    noWinner:
      !interceptionsPerGameWinners[0] ||
      interceptionsPerGameWinners[0].interceptions_per_game === 0,
  };

  // Best Partnership
  const partnerships = new Map<string, number>();
  games.forEach((game) => {
    const gameEvents = events.filter((e) => e.game_id === game.id);
    const goalEvents = gameEvents.filter((e) => e.event_type === "goal");
    goalEvents.forEach((goal) => {
      const assistEvent = gameEvents.find(
        (e) => e.event_type === "assist" && e.related_event_id === goal.id,
      );
      if (!assistEvent) return;
      if (assistEvent.player_id === goal.player_id) return;
      const scorerPlayer = players.find((p) => p.id === goal.player_id);
      const assisterPlayer = players.find(
        (p) => p.id === assistEvent.player_id,
      );
      if (!scorerPlayer || !assisterPlayer) return;
      if (scorerPlayer.is_guest || assisterPlayer.is_guest) return;
      const key = [goal.player_id, assistEvent.player_id].sort().join(":");
      partnerships.set(key, (partnerships.get(key) ?? 0) + 1);
    });
  });

  let bestPartnership: PartnershipAward | null = null;
  if (partnerships.size > 0) {
    const sortedPartnerships = Array.from(partnerships.entries()).sort(
      (a, b) => b[1] - a[1],
    );
    for (const [key, count] of sortedPartnerships) {
      const [id1, id2] = key.split(":");
      const p1Player =
        eligibleStats.find((s) => s.player.id === id1)?.player ??
        players.find((p) => p.id === id1);
      const p2Player =
        eligibleStats.find((s) => s.player.id === id2)?.player ??
        players.find((p) => p.id === id2);
      if (p1Player && p2Player && !p1Player.is_guest && !p2Player.is_guest) {
        bestPartnership = {
          emoji: "🤝",
          title: "Best Partnership",
          description: "Most common goal + assist combination",
          players: [p1Player.name, p2Player.name],
          value: `${count} time${count > 1 ? "s" : ""}`,
        };
        break;
      }
    }
  }

  // Hardcoded
  const celebrated: Award = {
    emoji: "🎉",
    title: "Not Too Cool 4 Skool",
    description:
      "Players that actually celebrated a goal instead of nonchalantly putting their head down",
    winners: ["Aqeel Zaman"],
    value: "",
    noWinner: false,
  };

  const hardestWorker: Award = {
    emoji: "🏃",
    title: "Hardest Worker",
    description:
      "Works the hardest and always gives 100% despite what Mark says",
    winners: ["Aqeel Zaman"],
    value: "",
    noWinner: false,
  };

  return {
    awards: [
      topScorer,
      goalMachine,
      playmaker,
      assistHero,
      mostInvolved,
      oneGameWonder,
      chanceCreator,
      keyPassHero,
      hatTrickHero,
      clinical,
      triggerHappy,
      nearlyMan,
      reliable,
      alwaysThere,
      onFire,
      winner,
      unbeaten,
      unlucky,
      unluckyHero,
      ghost,
      hardman,
      sweeper,
      enforcer,
      tackleHero,
      interceptionHero,
      tacklesPerGame,
      interceptionsPerGame,
      celebrated,
      hardestWorker,
    ],
    partnership: bestPartnership,
  };
}
