import { Link } from "react-router-dom";
import type { GoalkeeperStats } from "../../types";

interface Props {
  stats: GoalkeeperStats[];
  teamOfSeasonIds: Set<string>;
}

function FormBadge({ result }: { result: "W" | "L" | "D" }) {
  const colours = {
    W: "bg-green-700 text-green-200",
    L: "bg-red-900 text-red-300",
    D: "bg-gray-700 text-gray-300",
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
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Goalkeeper Stats
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Player
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <span title="Games Played">GP</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <span title="Saves">SV</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <span title="Goals Conceded">GC</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <span title="Save Percentage">SV%</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <span title="Clean Sheets">CS</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  <span title="Goals Conceded Per Game">GC/G</span>
                </th>
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s, i) => (
                <tr
                  key={s.player.id}
                  className={`border-b border-gray-800/50 last:border-0 transition-colors hover:bg-gray-800/40 ${
                    i === 0 ? "bg-gray-800/20" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-yellow-500 text-xs w-4 flex-shrink-0"
                        title="Team of the Season"
                      >
                        {teamOfSeasonIds.has(s.player.id) ? "⭐" : ""}
                      </span>
                      <Link
                        to={`/player/${s.player.id}`}
                        className="text-gray-300 hover:text-white transition-colors inline-flex items-center gap-1"
                      >
                        {s.player.name}
                        <span className="text-gray-600 text-xs">↗</span>
                      </Link>
                    </div>
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.games}
                  </td>
                  <td className="text-center px-4 py-3.5 text-white font-semibold">
                    {s.saves}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.goalsConceded}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.games > 0 ? `${s.savePercentage}%` : "—"}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.cleanSheets}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
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
