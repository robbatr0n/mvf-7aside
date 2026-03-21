import { useMemo } from "react";
import { usePlayers } from "../hooks/usePlayers";
import { useEvents } from "../hooks/useEvents";
import { useGames } from "../hooks/useGames";
import { useGamePlayers } from "../hooks/useGamePlayers";
import { useStats } from "../hooks/useStats";
import { calculateAwards } from "../utils/awards";
import type { Award, PartnershipAward } from "../utils/awards";
import { useGoalkeeperStats } from "../hooks/useGoalKeeperStats";

function AwardCard({ award }: { award: Award }) {
  return (
    <div
      className={`bg-gray-900 border rounded-2xl p-6 space-y-3 flex flex-col ${
        award.noWinner ? "border-gray-800 opacity-50" : "border-gray-800"
      }`}
    >
      <span className="text-3xl">{award.emoji}</span>
      <div>
        <p className="text-white font-bold text-lg">{award.title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{award.description}</p>
      </div>
      <div className="mt-auto pt-3 border-t border-gray-800">
        {award.noWinner ? (
          <p className="text-gray-600 text-sm">No winner yet</p>
        ) : (
          <>
            <p className="text-white font-semibold">
              {award.winners.join(", ")}
            </p>
            <p className="text-gray-500 text-sm mt-0.5">{award.value}</p>
          </>
        )}
      </div>
    </div>
  );
}

function PartnershipCard({ award }: { award: PartnershipAward }) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-6 space-y-3 flex flex-col">
      <span className="text-3xl">{award.emoji}</span>
      <div>
        <p className="text-white font-bold text-lg">{award.title}</p>
        <p className="text-gray-500 text-xs mt-0.5">{award.description}</p>
      </div>
      <div className="mt-auto pt-3 border-t border-gray-800">
        <p className="text-white font-semibold">{award.players.join(" & ")}</p>
        <p className="text-gray-500 text-sm mt-0.5">{award.value}</p>
      </div>
    </div>
  );
}

const SECTIONS = [
  {
    title: "📌 Pinned",
    titles: ["Hardest Worker"],
  },
  {
    title: "Attacking",
    titles: [
      "Top Scorer",
      "Goal Machine",
      "Playmaker",
      "Assist Hero",
      "Most Involved",
      "One Game Wonder",
      "Chance Creator",
      "Key Pass Hero",
      "Hat Trick Hero",
    ],
  },
  {
    title: "Shooting",
    titles: ["Clinical", "Trigger Happy", "Nearly Man"],
  },
  {
    title: "Defending",
    titles: [
      "Hardman",
      "Sweeper",
      "Enforcer",
      "Tackle Hero",
      "Interception Hero",
      "Terminator",
      "The Interceptor",
    ],
  },
  {
    title: "Goalkeepers",
    titles: ["The Wall", "Stone Cold", "Superhero"],
  },
  {
    title: "Consistency",
    titles: ["Reliable", "Always There", "On Fire"],
  },
  {
    title: "Results",
    titles: ["Winner", "Unbeaten", "Unlucky", "Unlucky Hero"],
  },
  {
    title: "Misc",
    titles: ["Not Too Cool 4 Skool"],
  },
];

export default function Awards() {
  const { players, loading: playersLoading } = usePlayers();
  const { events, loading: eventsLoading } = useEvents();
  const { games, loading: gamesLoading } = useGames();
  const { gamePlayers, loading: gamePlayersLoading } = useGamePlayers();
  const { stats } = useStats(players, events, games, gamePlayers);

  // inside the component, after existing hooks:
  const goalkeeperStats = useGoalkeeperStats(
    players,
    events,
    games,
    gamePlayers,
  );

  // update the useMemo:
  const { awards, partnership } = useMemo(
    () =>
      calculateAwards(
        stats,
        events,
        games,
        gamePlayers,
        players,
        goalkeeperStats,
      ),
    [stats, events, games, gamePlayers, players, goalkeeperStats],
  );

  const loading =
    playersLoading || eventsLoading || gamesLoading || gamePlayersLoading;

  const awardsByTitle = useMemo(
    () => Object.fromEntries(awards.map((a) => [a.title, a])),
    [awards],
  );

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-10">
          <h1 className="text-2xl font-bold text-white">Awards</h1>
          <span className="text-gray-500 text-sm">
            {awards.filter((a) => !a.noWinner).length} active
          </span>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {[...Array(8)].map((_, i) => (
              <div
                key={i}
                className="h-48 bg-gray-900 rounded-2xl animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="space-y-10">
            {SECTIONS.map((section) => (
              <section key={section.title} className="space-y-4">
                <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
                  {section.title}
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {section.titles.map((title) => {
                    const award = awardsByTitle[title];
                    if (!award) return null;
                    return <AwardCard key={title} award={award} />;
                  })}
                  {section.title === "Misc" && partnership && (
                    <PartnershipCard award={partnership} />
                  )}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
