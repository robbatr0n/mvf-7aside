import { Link } from "react-router-dom";
import type { PlayerStats } from "../../types";
import type { PartnershipAward } from "../../utils/awards";

interface Props {
  stats: PlayerStats[];
  partnership: PartnershipAward | null;
}

interface AwardCardProps {
  emoji: string;
  title: string;
  name: string;
  value: string;
}

function AwardCard({ emoji, title, name, value }: AwardCardProps) {
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-2xl p-4 space-y-2">
      <span className="text-xl">{emoji}</span>
      <div>
        <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
          {title}
        </p>
        <p className="text-white font-bold text-base mt-0.5">{name}</p>
        <p className="text-gray-500 text-xs">{value}</p>
      </div>
    </div>
  );
}

export default function AwardCards({ stats, partnership }: Props) {
  const sortedByGoals = [...stats].sort((a, b) => b.goals - a.goals);
  const topGoals = sortedByGoals[0]?.goals ?? 0;
  const topScorers = sortedByGoals.filter(
    (s) => s.goals === topGoals && topGoals > 0,
  );

  const sortedByAssists = [...stats].sort((a, b) => b.assists - a.assists);
  const topAssists = sortedByAssists[0]?.assists ?? 0;
  const topAssisters = sortedByAssists.filter(
    (s) => s.assists === topAssists && topAssists > 0,
  );

  if (!topScorers.length) return null;

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <AwardCard
          emoji="⚽"
          title="Top Scorer"
          name={topScorers.map((s) => s.player.name).join(", ")}
          value={`${topGoals} goal${topGoals !== 1 ? "s" : ""}`}
        />
        <AwardCard
          emoji="🎯"
          title="Most Assists"
          name={
            topAssisters.length
              ? topAssisters.map((s) => s.player.name).join(", ")
              : "—"
          }
          value={
            topAssisters.length
              ? `${topAssists} assist${topAssists !== 1 ? "s" : ""}`
              : "No assists yet"
          }
        />
        {partnership ? (
          <AwardCard
            emoji="🤝"
            title="Best Partnership"
            name={partnership.players.join(" & ")}
            value={partnership.value}
          />
        ) : (
          <div className="bg-gray-900 border border-gray-800 rounded-2xl p-5 opacity-40 space-y-3">
            <span className="text-2xl">🤝</span>
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider font-semibold">
                Best Partnership
              </p>
              <p className="text-gray-600 text-sm mt-1">Not yet</p>
            </div>
          </div>
        )}
      </div>
      <div className="flex justify-end">
        <Link
          to="/awards"
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          View all awards →
        </Link>
      </div>
    </div>
  );
}
