import { useState } from "react";
import { Link } from "react-router-dom";
import type { PlayerStats } from "../../types";

interface Props {
  stats: PlayerStats[];
}

type Tab = "attacking" | "defending";

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

const ATTACKING_HEADERS = [
  { key: "goals", label: "G", tooltip: "Goals" },
  { key: "assists", label: "A", tooltip: "Assists" },
  { key: "goal_involvements", label: "G+A", tooltip: "Goals + Assists" },
  { key: "shots_on_target", label: "SOT", tooltip: "Shots on Target" },
  { key: "key_passes", label: "KP", tooltip: "Key Passes" },
  { key: "shot_accuracy", label: "Acc%", tooltip: "Shot Accuracy" },
  { key: "shot_conversion", label: "Conv%", tooltip: "Shot Conversion" },
  { key: "goals_per_game", label: "G/GM", tooltip: "Goals per Game" },
];

const DEFENDING_HEADERS = [
  { key: "games_played", label: "GP", tooltip: "Games Played" },
  { key: "tackles", label: "TKL", tooltip: "Tackles" },
  { key: "interceptions", label: "INT", tooltip: "Interceptions" },
  {
    key: "defensive_actions",
    label: "DA",
    tooltip: "Defensive Actions (Tackles + Interceptions)",
  },
  { key: "tackles_per_game", label: "TKL/G", tooltip: "Tackles per Game" },
  {
    key: "interceptions_per_game",
    label: "INT/G",
    tooltip: "Interceptions per Game",
  },
];

function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-700 text-white text-xs rounded whitespace-nowrap z-10 pointer-events-none">
          {text}
        </span>
      )}
    </span>
  );
}

export default function Leaderboard({ stats }: Props) {
  const [tab, setTab] = useState<Tab>("attacking");

  if (stats.length === 0) return null;

  const sortedStats =
    tab === "attacking"
      ? [...stats].sort((a, b) => b.goal_involvements - a.goal_involvements)
      : [...stats].sort((a, b) => b.defensive_actions - a.defensive_actions);

  const headers = tab === "attacking" ? ATTACKING_HEADERS : DEFENDING_HEADERS;

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
          Player Stats
        </h2>
        <div className="flex items-center bg-gray-900 border border-gray-800 rounded-lg p-0.5">
          <button
            onClick={() => setTab("attacking")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === "attacking"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            ⚽ Attacking
          </button>
          <button
            onClick={() => setTab("defending")}
            className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
              tab === "defending"
                ? "bg-gray-700 text-white"
                : "text-gray-500 hover:text-gray-300"
            }`}
          >
            💪 Defending
          </button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left px-5 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Player
                </th>
                {headers.map((h) => (
                  <th
                    key={h.key}
                    className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider"
                  >
                    <Tooltip text={h.tooltip}>{h.label}</Tooltip>
                  </th>
                ))}
                <th className="text-center px-4 py-3 text-gray-500 font-semibold text-xs uppercase tracking-wider">
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((s, i) => (
                <tr
                  key={s.player.id}
                  className={`border-b border-gray-800/50 last:border-0 transition-colors hover:bg-gray-800/40 ${
                    i === 0 ? "bg-gray-800/20" : ""
                  }`}
                >
                  <td className="px-5 py-3.5">
                    <Link
                      to={`/player/${s.player.id}`}
                      className="text-white font-medium hover:text-blue-400 transition-colors flex items-center gap-2"
                    >
                      {i === 0 && (
                        <span className="text-yellow-500 text-xs">👑</span>
                      )}
                      {s.player.is_goalkeeper && (
                        <span className="text-xs">🧤</span>
                      )}
                      {s.player.name}
                    </Link>
                  </td>
                  {tab === "attacking" ? (
                    <>
                      <td className="text-center px-4 py-3.5 text-white font-semibold">
                        {s.goals}
                      </td>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.assists}
                      </td>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.goal_involvements}
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
                    </>
                  ) : (
                    <>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.games_played}
                      </td>
                      <td className="text-center px-4 py-3.5 text-white font-semibold">
                        {s.tackles}
                      </td>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.interceptions}
                      </td>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.defensive_actions}
                      </td>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.games_played > 0 ? s.tackles_per_game : "—"}
                      </td>
                      <td className="text-center px-4 py-3.5 text-gray-300">
                        {s.games_played > 0 ? s.interceptions_per_game : "—"}
                      </td>
                    </>
                  )}
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
