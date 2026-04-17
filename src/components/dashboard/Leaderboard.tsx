import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import type { PlayerStats } from "../../types";
import { calculateLastNPlayerStats } from "../../utils/stats";
import type { Event, Game, GamePlayer, Player } from "../../types";

interface Props {
  stats: PlayerStats[];
  players: Player[];
  events: Event[];
  games: Game[];
  gamePlayers: GamePlayer[];
  teamOfSeasonIds: Set<string>;
}

type Tab = "attacking" | "defending";

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

const ATTACKING_HEADERS = [
  { key: "games_played", label: "GP", tooltip: "Games Played" },
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
      onClick={() => setVisible((v) => !v)}
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

export default function Leaderboard({
  stats,
  players,
  events,
  games,
  gamePlayers,
  teamOfSeasonIds,
}: Props) {
  const [tab, setTab] = useState<Tab>("attacking");
  const [view, setView] = useState<"overall" | "last3">("overall");
  const [showAll, setShowAll] = useState(false);

  const last3Stats = useMemo(
    () => calculateLastNPlayerStats(players, events, games, gamePlayers, 3),
    [players, events, games, gamePlayers],
  );

  const activeStats = view === "overall" ? stats : last3Stats;

  const sortedStats = useMemo(() => {
    return tab === "attacking"
      ? [...activeStats].sort(
        (a, b) => b.goal_involvements - a.goal_involvements,
      )
      : [...activeStats].sort(
        (a, b) => b.defensive_actions - a.defensive_actions,
      );
  }, [activeStats, tab]);

  const displayStats = showAll ? sortedStats : sortedStats.slice(0, 8);
  const headers = tab === "attacking" ? ATTACKING_HEADERS : DEFENDING_HEADERS;

  if (stats.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
          Player Stats
        </h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center bg-gray-100 dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-lg p-0.5">
            <button
              onClick={() => setView("overall")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "overall"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              Overall
            </button>
            <button
              onClick={() => setView("last3")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${view === "last3"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              Last 3
            </button>
          </div>

          <div className="flex items-center bg-gray-100 dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-lg p-0.5">
            <button
              onClick={() => setTab("attacking")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "attacking"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              <span className="sm:hidden">⚽</span>
              <span className="hidden sm:inline">⚽ Attacking</span>
            </button>
            <button
              onClick={() => setTab("defending")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "defending"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              <span className="sm:hidden">💪</span>
              <span className="hidden sm:inline">💪 Defending</span>
            </button>
          </div>
        </div>
      </div>

      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
        <div className="relative">
          <div className="overflow-x-auto sm:overflow-y-visible sm:max-h-none max-h-[500px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#FFFFFF] dark:bg-[#111518]">
                  <th className="text-left px-5 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider w-px whitespace-nowrap">
                    Player
                  </th>
                  {headers.map((h, hi) => (
                    <th
                      key={h.key}
                      className={`text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] ${hi % 2 === 1 ? "bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]" : ""
                        }`}
                    >
                      <Tooltip text={h.tooltip}>{h.label}</Tooltip>
                    </th>
                  ))}
                  <th className={`text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] ${headers.length % 2 === 1 ? "bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]" : ""
                    }`}>
                    Form
                  </th>
                </tr>
              </thead>
              <tbody>
                {displayStats.map((s, i) => (
                  <tr
                    key={s.player.id}
                    className={`transition-colors hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 ${i === 0 ? "border-l-2 border-l-mvf" : ""
                      }`}
                  >
                    <td className="px-5 py-3.5 w-px whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <span
                          className="text-yellow-500 text-xs w-4 flex-shrink-0"
                          title="Best VII"
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
                    {tab === "attacking" ? (
                      <>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.games_played}
                        </td>
                        <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.goals}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.assists}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.goal_involvements}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.shots_on_target}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.key_passes}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.shots_on_target + s.shots_off_target > 0 ? `${s.shot_accuracy}%` : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.shots_on_target + s.shots_off_target > 0 ? `${s.shot_conversion}%` : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.games_played > 0 ? s.goals_per_game : "—"}
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.games_played}
                        </td>
                        <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.tackles}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.interceptions}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.defensive_actions}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.games_played > 0 ? s.tackles_per_game : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.games_played > 0 ? s.interceptions_per_game : "—"}
                        </td>
                      </>
                    )}
                    <td className={`text-center px-4 py-3.5  ${headers.length % 2 === 1 ? "bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]" : ""
                      }`}>
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

          {!showAll && sortedStats.length > 8 && (
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFFFFF] dark:from-[#111518] to-transparent pointer-events-none" />
          )}
        </div>

        {sortedStats.length > 8 && (
          <div className="px-5 py-3 text-center border-t border-[#D4D3D0] dark:border-[#2a2e31]">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors"
            >
              {showAll
                ? "▲ Show less"
                : `▼ Show all ${sortedStats.length} players`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}