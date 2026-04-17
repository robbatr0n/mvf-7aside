import { Link } from "react-router-dom";
import type { GoalkeeperStats } from "../../types";

interface Props {
  stats: GoalkeeperStats[];
  teamOfSeasonIds: Set<string>;
}

function FormBadge({ result }: { result: "W" | "L" | "D" }) {
  const colours = {
    W: "bg-[#dcfce7] text-[#166534] dark:bg-[#14532d] dark:text-[#86efac]",
    L: "bg-[#fee2e2] text-[#991b1b] dark:bg-[#5a0a0a] dark:text-[#fca5a5]",
    D: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <span
      className={`inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold ${colours[result]}`}
    >
      {result}
    </span>
  );
}

export default function GoalkeeperLeaderboard({
  stats,
  teamOfSeasonIds,
}: Props) {
  if (stats.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
        Goalkeeper Stats
      </h2>
      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#FFFFFF] dark:bg-[#111518]">
                <th className="text-left px-5 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider w-px whitespace-nowrap">
                  Player
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31]">
                  <span title="Games Played">GP</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                  <span title="Saves">SV</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31]">
                  <span title="Goals Conceded">GC</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                  <span title="Save Percentage">SV%</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31]">
                  <span title="Clean Sheets">CS</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                  <span title="Goals Conceded Per Game">GC/G</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31]">
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.player.id}
                  className={`transition-colors hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 ${i === 0 ? "border-l-2 border-l-mvf" : ""}`}
                >
                  <td className="px-5 py-3.5 w-px whitespace-nowrap">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-yellow-500 text-xs w-4 flex-shrink-0"
                        title="Team of the Season"
                      >
                        {teamOfSeasonIds.has(s.player.id) ? "⭐" : ""}
                      </span>
                      <Link
                        to={`/player/${s.player.id}`}
                        className="text-gray-600 dark:text-[#E5E6E3] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] transition-colors inline-flex items-center gap-1"
                      >
                        {s.player.name}
                        <span className="text-gray-600 dark:text-[#9CA3AF] text-xs">↗</span>
                      </Link>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.games}
                  </td>
                  <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.saves}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.goalsConceded}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.games > 0 ? `${s.savePercentage}%` : "—"}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.cleanSheets}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.games > 0 ? s.goalsConcededPerGame : "—"}
                  </td>
                  <td className="text-center px-4 py-3.5">
                    <div className="flex items-center justify-center gap-0.5">
                      {s.form.map((result, i) => (
                        <FormBadge key={i} result={result} />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
