import { useMemo } from "react";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useStats } from "../hooks/useStats";
import { calculateGameSummaries } from "../utils/stats";
import { calculateAwards } from "../utils/awards";
import AwardCards from "../components/dashboard/AwardCards";
import Leaderboard from "../components/dashboard/Leaderboard";
import GameBreakdown from "../components/dashboard/GameBreakdown";
import { Link } from "react-router-dom";
import GoalkeeperLeaderboard from "../components/dashboard/GoalkeeperLeaderboard";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";

export default function Dashboard() {
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const { stats } = useStats(players, events, games, gamePlayers);
  const goalkeeperStats = useGoalkeeperStats(
    players,
    events,
    games,
    gamePlayers,
  );

  const gameSummaries = useMemo(
    () => calculateGameSummaries(games, players, events, gamePlayers),
    [games, players, events, gamePlayers],
  );

  const { partnership } = useMemo(
    () => calculateAwards(stats, events, games, gamePlayers, players),
    [stats, events, games, gamePlayers, players],
  );

  const loading =
    playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  console.log(
    "latest game events:",
    events.filter((e) => e.game_id === "e951688b-2fc5-4111-9e3b-865b1c94f4ef"),
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-24 bg-gray-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <>
            <div className="flex justify-between gap-3">
              <p className="text-gray-600 text-xs">
                {games.length} {games.length === 1 ? "game" : "games"} tracked
              </p>
              <Link
                to="/changelog"
                className="text-gray-600 hover:text-gray-400 text-xs transition-colors"
              >
                Changelog
              </Link>
            </div>
            <AwardCards stats={stats} partnership={partnership} />
            <Leaderboard
              stats={stats}
              players={players}
              events={events}
              games={games}
              gamePlayers={gamePlayers}
            />
            <GoalkeeperLeaderboard stats={goalkeeperStats} />
            <GameBreakdown summaries={gameSummaries} />
          </>
        )}
      </div>
    </div>
  );
}
