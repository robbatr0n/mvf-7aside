import { useRef, useMemo, useState } from "react";
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
          <span className="hidden sm:block absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-[#1C1C1C] dark:bg-[#2a2e31] text-white text-xs rounded whitespace-nowrap z-50 pointer-events-none shadow-lg">
            {text}
          </span>
          <span className="sm:hidden fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2 bg-mvf text-white text-sm font-medium rounded-xl whitespace-nowrap z-50 pointer-events-none shadow-xl">
            {text}
          </span>
        </>
      )}
    </span>
  );
}

const HEADERS = [
  { key: "games", label: "GP", tooltip: "Games Played" },
  { key: "saves", label: "SV", tooltip: "Saves" },
  { key: "savesPerGame", label: "SV/G", tooltip: "Saves per Game" },
  { key: "goalsConceded", label: "GC", tooltip: "Goals Conceded", lowerIsBetter: true },
  { key: "savePercentage", label: "SV%", tooltip: "Save Percentage" },
  { key: "cleanSheets", label: "CS", tooltip: "Clean Sheets" },
  { key: "cleanSheetPercentage", label: "CS%", tooltip: "Clean Sheet Percentage" },
  { key: "goalsConcededPerGame", label: "GC/G", tooltip: "Goals Conceded per Game", lowerIsBetter: true },
  { key: "win_rate", label: "Win%", tooltip: "Win Rate" },
];

export default function GoalkeeperLeaderboard({
  stats,
  teamOfSeasonIds,
}: Props) {
  const [sortKey, setSortKey] = useState<string>("saves");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  function handleSort(key: string) {
    const header = HEADERS.find(h => h.key === key);
    if (key === sortKey) {
      setSortDir(d => d === "desc" ? "asc" : "desc");
    } else {
      setSortKey(key);
      setSortDir(header?.lowerIsBetter ? "asc" : "desc");
    }
  }

  const sortedStats = useMemo(() => {
    return [...stats].sort((a, b) => {
      if (sortKey === "name") {
        const cmp = a.player.name.localeCompare(b.player.name);
        return sortDir === "asc" ? cmp : -cmp;
      }
      const aVal = (a[sortKey as keyof GoalkeeperStats] as number) ?? 0;
      const bVal = (b[sortKey as keyof GoalkeeperStats] as number) ?? 0;
      return sortDir === "desc" ? bVal - aVal : aVal - bVal;
    });
  }, [stats, sortKey, sortDir]);

  if (stats.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="space-y-3">
        <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
          Goalkeeper Stats
        </h2>
        <p className="sm:hidden text-xs text-gray-600 dark:text-[#9CA3AF] text-right">Tap column headers for details</p>
      </div>
      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="sticky top-0 z-10">
              <tr className="bg-[#FFFFFF] dark:bg-[#111518]">
                <th
                  onClick={() => handleSort("name")}
                  className={`text-left px-5 py-3 font-semibold text-xs uppercase tracking-wider w-px whitespace-nowrap cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${sortKey === "name" ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                >
                  Player
                </th>
                {HEADERS.map((h, hi) => (
                  <th
                    key={h.key}
                    onClick={() => handleSort(h.key)}
                    className={`text-center px-4 py-3 font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] cursor-pointer select-none transition-colors hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] ${hi % 2 === 1 ? "bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]" : ""} ${sortKey === h.key ? "text-[#1C1C1C] dark:text-[#E5E6E3] border-b-2 border-b-mvf" : "text-gray-600 dark:text-[#9CA3AF]"}`}
                  >
                    <Tooltip text={h.tooltip}>{h.label}</Tooltip>
                  </th>
                ))}
                <th className={`text-center px-4 py-3 text-gray-600 dark:text-[#9CA3AF] font-semibold text-xs uppercase tracking-wider border-l border-[#D4D3D0] dark:border-[#2a2e31] ${HEADERS.length % 2 === 1 ? "bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]" : ""}`}>
                  Form
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedStats.map((s, i) => (
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
                  {/* GP */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.games}
                  </td>
                  {/* SV */}
                  <td className="text-center px-4 py-3.5 text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.saves}
                  </td>
                  {/* SV/G */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.games > 0 ? s.savesPerGame : "—"}
                  </td>
                  {/* GC */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.goalsConceded}
                  </td>
                  {/* SV% */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.games > 0 ? `${s.savePercentage}%` : "—"}
                  </td>
                  {/* CS */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.cleanSheets}
                  </td>
                  {/* CS% */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.games > 0 ? `${s.cleanSheetPercentage}%` : "—"}
                  </td>
                  {/* GC/G */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3] bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
                    {s.games > 0 ? s.goalsConcededPerGame : "—"}
                  </td>
                  {/* Win% */}
                  <td className="text-center px-4 py-3.5 text-gray-500 dark:text-[#E5E6E3]">
                    {s.games > 0 ? `${s.win_rate}%` : "—"}
                  </td>
                  {/* Form */}
                  <td className="text-center px-4 py-3.5 bg-black/[0.02] dark:bg-[#FFFFFF]/[0.02]">
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
