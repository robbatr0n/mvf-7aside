import { useState } from "react";
import { Link } from "react-router-dom";
import type { PlayerStats } from "../../types";

interface Props {
  stats: PlayerStats[];
}

interface TooltipProps {
  text: string;
  children: React.ReactNode;
}

type SortKey =
  | "goals"
  | "assists"
  | "shots_on_target"
  | "key_passes"
  | "shot_accuracy"
  | "shot_conversion"
  | "goals_per_game"
  | "wins"
  | "losses"
  | "draws";

function Tooltip({ text, children }: TooltipProps) {
  const [visible, setVisible] = useState(false);

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

const HEADERS: { key: SortKey; label: string; tooltip: string }[] = [
  { key: "goals", label: "G", tooltip: "Goals" },
  { key: "assists", label: "A", tooltip: "Assists" },
  { key: "shots_on_target", label: "SOT", tooltip: "Shots on Target" },
  { key: "key_passes", label: "KP", tooltip: "Key Passes" },
  {
    key: "shot_accuracy",
    label: "ShAcc%",
    tooltip: "Shot Accuracy (shots on target / total shots)",
  },
  {
    key: "shot_conversion",
    label: "Conv%",
    tooltip: "Shot Conversion (goals / total shots)",
  },
  { key: "goals_per_game", label: "GPG", tooltip: "Goals per Game" },
  { key: "wins", label: "W", tooltip: "Wins" },
  { key: "losses", label: "L", tooltip: "Losses" },
  { key: "draws", label: "D", tooltip: "Draws" },
];

export default function Leaderboard({ stats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("goals");
  const [sortDesc, setSortDesc] = useState(true);

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDesc((prev) => !prev);
    } else {
      setSortKey(key);
      setSortDesc(true);
    }
  }

  const sorted = [...stats].sort((a, b) => {
    const diff = b[sortKey] - a[sortKey];
    return sortDesc ? diff : -diff;
  });

  if (stats.length === 0) return null;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Player Stats
      </h2>
      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Player
                </th>
                {HEADERS.map((h) => (
                  <th
                    key={h.key}
                    onClick={() => handleSort(h.key)}
                    className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider cursor-pointer hover:text-white transition-colors select-none"
                  >
                    <Tooltip text={h.tooltip}>
                      <span className="inline-flex items-center gap-1">
                        {h.label}
                        {sortKey === h.key && (
                          <span className="text-blue-400">
                            {sortDesc ? "↓" : "↑"}
                          </span>
                        )}
                      </span>
                    </Tooltip>
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, i) => (
                <tr
                  key={s.player.id}
                  className={`border-b border-gray-800/50 last:border-0 transition-colors hover:bg-gray-800/40 ${
                    i === 0 ? "bg-gray-800/20" : ""
                  }`}
                >
                  <td className="px-5 py-3.5 text-white font-medium">
                    <Link
                      to={`/player/${s.player.id}`}
                      className="hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      {s.player.name}
                    </Link>
                  </td>
                  <td className="text-center px-4 py-3.5 text-white font-semibold">
                    {s.goals}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.assists}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.shots_on_target}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.key_passes}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.shots_on_target + s.shots_off_target > 0
                      ? `${s.shot_accuracy}%`
                      : "—"}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.shots_on_target + s.shots_off_target > 0
                      ? `${s.shot_conversion}%`
                      : "—"}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-300">
                    {s.games_played > 0 ? s.goals_per_game : "—"}
                  </td>
                  <td className="text-center px-4 py-3.5 text-green-400">
                    {s.wins}
                  </td>
                  <td className="text-center px-4 py-3.5 text-red-400">
                    {s.losses}
                  </td>
                  <td className="text-center px-4 py-3.5 text-gray-400">
                    {s.draws}
                  </td>
                  <td className="text-center px-4 py-3.5">
                    <div className="flex items-center justify-center gap-0.5">
                      {s.form.length === 0 ? (
                        <span className="text-gray-600 text-xs">—</span>
                      ) : (
                        s.form.map((result, i) => (
                          <span
                            key={i}
                            className={`text-xs font-bold w-5 h-5 rounded flex items-center justify-center ${
                              result === "W"
                                ? "bg-green-900/60 text-green-400"
                                : result === "L"
                                  ? "bg-red-900/60 text-red-400"
                                  : "bg-gray-800 text-gray-400"
                            }`}
                          >
                            {result}
                          </span>
                        ))
                      )}
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
