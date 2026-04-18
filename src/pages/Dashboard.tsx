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
import InfoBar from "../components/dashboard/InfoBar";
import GoalkeeperLeaderboard from "../components/dashboard/GoalkeeperLeaderboard";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";
import TeamOfTheSeason from "../components/dashboard/TeamOfTheSeason";
import { useTeamStats } from "../hooks/useTeamStats";

export default function Dashboard() {
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const { stats } = useStats(players, events, games, gamePlayers);

  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers);

  const { teamOfSeasonIds, totwAppearances, motmAppearances } = useTeamStats(
    stats, goalkeeperStats, players, events, games, gamePlayers,
  );

  const gameSummaries = useMemo(
    () => calculateGameSummaries(games, players, events, gamePlayers),
    [games, players, events, gamePlayers],
  );

  const { partnership } = useMemo(
    () => calculateAwards(stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances),
    [stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances, motmAppearances],
  );

  const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10 space-y-10">
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <>
            <InfoBar games={games} />
            <AwardCards stats={stats} partnership={partnership} />
            <Leaderboard
              stats={stats}
              players={players}
              events={events}
              games={games}
              gamePlayers={gamePlayers}
              teamOfSeasonIds={teamOfSeasonIds}
            />
            <GoalkeeperLeaderboard
              stats={goalkeeperStats}
              teamOfSeasonIds={teamOfSeasonIds}
            />
            <TeamOfTheSeason
              stats={stats}
              goalkeeperStats={goalkeeperStats}
              players={players}
              events={events}
              games={games}
              gamePlayers={gamePlayers}
            />
            <GameBreakdown summaries={gameSummaries} />
          </>
        )}
      </div>
    </div>
  );
}