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
  unclaimed?: boolean;
}

function AwardCard({ emoji, title, name, value, unclaimed }: AwardCardProps) {
  return (
    <div className={`bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl p-3 flex items-start gap-3 ${unclaimed ? "opacity-40" : ""}`}>
      <span className="text-xl w-7 flex-shrink-0">{emoji}</span>
      <div className="min-w-0">
        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs uppercase tracking-wider font-semibold">
          {title}
        </p>
        <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-medium text-sm mt-0.5">{name}</p>
        {unclaimed ? (
          <p className="text-gray-600 dark:text-[#9CA3AF] text-xs mt-0.5">Not yet claimed</p>
        ) : (
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-xs mt-0.5">{value}</p>
        )}
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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
        Awards
      </h2>
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
          <AwardCard
            emoji="🤝"
            title="Best Partnership"
            name="—"
            value=""
            unclaimed
          />
        )}
      </div>
      <div className="flex justify-end">
        <Link
          to="/awards"
          className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-sm transition-colors"
        >
          View all awards →
        </Link>
      </div>
    </div>
  );
}