import { useMemo, useRef, useState } from "react";
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

type Tab = "attacking" | "defending" | "passing";

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
  { key: "key_passes_per_game", label: "KP/G", tooltip: "Key Passes per Game" },
  { key: "shot_accuracy", label: "Acc%", tooltip: "Shot Accuracy" },
  { key: "shot_conversion", label: "Conv%", tooltip: "Shot Conversion" },
  { key: "goals_per_game", label: "GPG", tooltip: "Goals per Game" },
  { key: "hat_tricks", label: "HT", tooltip: "Hat Tricks (3+ goals in a game)" },
  { key: "win_rate", label: "Win%", tooltip: "Win Rate" },
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
  {
    key: "defensive_actions_per_game",
    label: "DA/G",
    tooltip: "Defensive Actions per Game",
  },
  { key: "win_rate", label: "Win%", tooltip: "Win Rate" },
];

const PASSING_HEADERS = [
  { key: "games_played", label: "GP", tooltip: "Games Played" },
  { key: "passes_completed", label: "PC", tooltip: "Passes Completed" },
  { key: "passes_failed", label: "PF", tooltip: "Passes Failed / Incomplete" },
  { key: "pass_attempts", label: "Att", tooltip: "Pass Attempts (Completed + Failed)" },
  { key: "pass_accuracy", label: "Acc%", tooltip: "Pass Accuracy" },
  { key: "passes_per_game", label: "PC/G", tooltip: "Passes Completed per Game" },
];

function Tooltip({
  text,
  children,
}: {
  text: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTouch = (e: React.TouchEvent) => {
    e.preventDefault();
    setVisible(true);
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => setVisible(false), 2000);
  };

  return (
    <span
      className="relative inline-block cursor-help"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
      onTouchStart={handleTouch}
    >
      {children}
      {visible && (
        <>
          {/* Desktop: appears below header, high z-index to clear sticky context */}
          <span className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-[#1C1C1C] dark:bg-[#2a2e31] text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none shadow-lg">
            {text}
          </span>
          {/* Mobile: fixed to viewport bottom, immune to any overflow/z-index clipping */}
          <span className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-mvf text-white text-sm font-medium rounded-xl whitespace-nowrap z-50 pointer-events-none shadow-xl">
            {text}
          </span>
        </>
      )}
    </span>
  );
}

const TAB_DEFAULTS: Record<Tab, string> = {
  attacking: "goal_involvements",
  defending: "defensive_actions",
  passing: "pass_accuracy",
};

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
  const [sortKey, setSortKey] = useState<string>("goal_involvements");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const last3Stats = useMemo(
    () => calculateLastNPlayerStats(players, events, games, gamePlayers, 3),
    [players, events, games, gamePlayers],
  );

  const activeStats = view === "overall" ? stats : last3Stats;

  function changeTab(newTab: Tab) {
    setTab(newTab);
    setSortKey(TAB_DEFAULTS[newTab]);
    setSortDir("desc");
  }

  function handleSort(key: string) {
    if (key === sortKey) setSortDir(d => d === "desc" ? "asc" : "desc");
    else { setSortKey(key); setSortDir("desc"); }
  }

  const sortedStats = useMemo(() => {
    return [...activeStats].sort((a, b) => {
      if (sortKey === "name") {
        const cmp = a.player.name.localeCompare(b.player.name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const aVal = (a[sortKey as keyof PlayerStats] as number) ?? 0;
      const bVal = (b[sortKey as keyof PlayerStats] as number) ?? 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [activeStats, sortKey, sortDir]);

  const headers =
    tab === "attacking" ? ATTACKING_HEADERS :
      tab === "defending" ? DEFENDING_HEADERS :
        PASSING_HEADERS;

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
              onClick={() => changeTab("attacking")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "attacking"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              <span className="sm:hidden">⚽ ATT</span>
              <span className="hidden sm:inline">⚽ Attacking</span>
            </button>
            <button
              onClick={() => changeTab("defending")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "defending"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              <span className="sm:hidden">💪 DEF</span>
              <span className="hidden sm:inline">💪 Defending</span>
            </button>
            <button
              onClick={() => changeTab("passing")}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${tab === "passing"
                ? "bg-mvf text-white"
                : "text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3]"
                }`}
            >
              <span className="sm:hidden">🔵 PASS</span>
              <span className="hidden sm:inline">🔵 Passing</span>
            </button>
          </div>
        </div>
        <p className="sm:hidden text-xs text-gray-600 dark:text-[#9CA3AF] text-right">Tap column headers for details</p>
      </div>

      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto overflow-y-auto max-h-[500px] sm:overflow-y-visible sm:max-h-none">
          <div className="relative">
            <table className="w-full text-sm">
              <thead className="sticky top-0 z-10">
                <tr className="bg-[#FFFFFF] dark:bg-[#111518]">
                  <th
                    onClick={() => handleSort("name")}
                    className={`text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider w-px whitespace-nowrap cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${sortKey === "name" ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                  >
                    Player
                  </th>
                  {headers.map((h, hi) => (
                    <th
                      key={h.key}
                      onClick={() => handleSort(h.key)}
                      className={`text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${hi % 2 === 1 ? "bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]" : ""} ${sortKey === h.key ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
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
                {sortedStats.map((s, i) => (
                  <tr
                    key={s.player.id}
                    className={`transition-colors hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/40 ${i === 0 ? "border-l-2 border-l-mvf" : ""} ${!showAll && i >= 8 ? "sm:hidden" : ""}`}
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
                    {tab === "passing" ? (
                      <>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{s.games_played}</td>
                        <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">{s.passes_completed}</td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{s.passes_failed}</td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">{s.pass_attempts}</td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">{s.pass_attempts > 0 ? `${s.pass_accuracy}%` : "—"}</td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">{s.games_played > 0 && s.pass_attempts > 0 ? s.passes_per_game : "—"}</td>
                      </>
                    ) : tab === "attacking" ? (
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
                          {s.games_played > 0 ? s.key_passes_per_game : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.shots_on_target + s.shots_off_target > 0 ? `${s.shot_accuracy}%` : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.shots_on_target + s.shots_off_target > 0 ? `${s.shot_conversion}%` : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.games_played > 0 ? s.goals_per_game : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.hat_tricks > 0 ? s.hat_tricks : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.games_played > 0 ? `${s.win_rate}%` : "—"}
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
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] ">
                          {s.games_played > 0 ? s.defensive_actions_per_game : "—"}
                        </td>
                        <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]  bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                          {s.games_played > 0 ? `${s.win_rate}%` : "—"}
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
            {!showAll && sortedStats.length > 8 && (
              <div className="hidden sm:block absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-[#FFFFFF] dark:from-[#111518] to-transparent pointer-events-none" />
            )}
          </div>
        </div>
        {sortedStats.length > 8 && (
          <div className="hidden sm:block px-5 py-3 text-center border-t border-[#D4D3D0] dark:border-[#2a2e31]">
            <button
              onClick={() => setShowAll((prev) => !prev)}
              className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors"
            >
              {showAll ? "▲ Show less" : `▼ Show all ${sortedStats.length} players`}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}