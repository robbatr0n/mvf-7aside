import { useMemo } from "react";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useStats } from "../hooks/useStats";
import { calculateAwards } from "../utils/awards";
import type { Award, PartnershipAward } from "../utils/awards";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";
import { useTeamStats } from "../hooks/useTeamStats";

function AwardCard({ award }: { award: Award }) {
  return (
    <div
      className={`bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-3 flex items-start gap-3 ${award.noWinner ? "opacity-40" : ""}`}
    >
      <span className="text-xl w-7 flex-shrink-0">{award.emoji}</span>
      <div className="min-w-0">
        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">{award.title}</p>
        {award.noWinner ? (
          <>
            <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5">Not yet claimed</p>
            <p className="text-gray-600 dark:text-[#9CA3AF] text-xs mt-0.5">{award.description}</p>
          </>
        ) : (
          <>
            <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5 truncate">{award.winners.join(", ")}</p>
            <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-xs mt-0.5">{award.value}</p>
            <p className="text-gray-600 dark:text-[#9CA3AF] text-xs mt-0.5">{award.description}</p>
          </>
        )}
      </div>
    </div>
  );
}

function PartnershipCard({ award }: { award: PartnershipAward }) {
  return (
    <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-3 flex items-start gap-3">
      <span className="text-xl w-7 flex-shrink-0">{award.emoji}</span>
      <div className="min-w-0">
        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">{award.title}</p>
        <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5 truncate">{award.players.join(" & ")}</p>
        <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-xs mt-0.5">{award.value}</p>
        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs mt-0.5">{award.description}</p>
      </div>
    </div>
  );
}

const SECTIONS = [
  { title: 'Attacking', titles: ['Top Scorer', 'Goal Machine', 'Playmaker', 'Assist Hero', 'Most Involved', 'One Game Wonder', 'Chance Creator', 'Key Pass Hero', 'Hat Trick Hero', 'Clinical', 'Trigger Happy', 'Nearly Man', 'Swing and a Miss'] },
  { title: 'Defending', titles: ['Hardman', 'Sweeper', 'Enforcer', 'Tackle Hero', 'Interception Hero', 'Terminator', 'The Interceptor'] },
  { title: 'Goalkeepers', titles: ['The Wall', 'Stone Cold', 'Superhero'] },
  { title: 'Consistency', titles: ['Reliable', 'Always There', 'On Fire', 'TOTW King', 'Winner', 'Unlucky', 'Hardest Worker', 'Best Partnership'] },
]

export default function Awards() {
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const { stats } = useStats(players, events, games, gamePlayers);

  const goalkeeperStats = useGoalkeeperStats(players, events, games, gamePlayers);

  const { totwAppearances } = useTeamStats(
    stats, goalkeeperStats, players, events, games, gamePlayers,
  );

  const { awards, partnership } = useMemo(
    () => calculateAwards(stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances),
    [stats, events, games, gamePlayers, players, goalkeeperStats, totwAppearances],
  );

  const loading = playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  const awardsByTitle = useMemo(
    () => Object.fromEntries(awards.map((a) => [a.title, a])),
    [awards],
  );

  return (
    <div className="min-h-screen bg-[#F5F4F2] dark:bg-[#030809] text-[#1C1C1C] dark:text-[#E5E6E3]">
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-[#1C1C1C] dark:text-[#E5E6E3]">Awards</h1>
          <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">
            {awards.filter((a) => !a.noWinner).length} active
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-12 bg-gray-200 dark:bg-[#111518] rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.title} className="space-y-4">
                <div className="border-b-2 border-b-mvf pb-2 mb-4">
                  <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
                    {section.title}
                  </h2>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                  {section.titles.map((title) => {
                    if (title === 'Best Partnership') {
                      return partnership ? <PartnershipCard key={title} award={partnership} /> : null
                    }
                    const award = awardsByTitle[title]
                    if (!award) return null
                    return <AwardCard key={title} award={award} />
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}