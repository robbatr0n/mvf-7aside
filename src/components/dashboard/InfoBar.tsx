import { useState } from "react";
import { Link } from "react-router-dom";
import type { Game } from "../../types";

const STAT_GUIDE = [
  { abbr: "GP", name: "Games Played", desc: "Number of games the player participated in" },
  { abbr: "G", name: "Goals", desc: "Goals scored" },
  { abbr: "A", name: "Assists", desc: "Final pass directly before a goal" },
  { abbr: "G+A", name: "Goal Involvements", desc: "Goals + assists combined" },
  { abbr: "SOT", name: "Shots on Target", desc: "Shots that would have gone in without the keeper" },
  { abbr: "KP", name: "Key Passes", desc: "Chance-creating passes that lead to a shot. Pass must be in the opponents half or cross the halfway line if originating from the players own half" },
  { abbr: "Acc%", name: "Shot Accuracy", desc: "Percentage of shots that were on target" },
  { abbr: "Conv%", name: "Shot Conversion", desc: "Percentage of shots that resulted in a goal" },
  { abbr: "G/GM", name: "Goals per Game", desc: "Average goals scored per game played" },
  { abbr: "TKL", name: "Tackles", desc: "Successfully winning the ball from an opponent" },
  { abbr: "INT", name: "Interceptions", desc: "Cutting out a pass intended for an opponent" },
  { abbr: "DA", name: "Defensive Actions", desc: "Tackles + interceptions combined" },
  { abbr: "TKL/G", name: "Tackles per Game", desc: "Average tackles per game played" },
  { abbr: "INT/G", name: "Interceptions per Game", desc: "Average interceptions per game played" },
  { abbr: "──", name: "", desc: "" },
  { abbr: "SV", name: "Saves", desc: "Shots on target from the opposing team that were not goals — derived automatically from unlinked shots on target" },
  { abbr: "GC", name: "Goals Conceded", desc: "Goals scored by the opposing team while the goalkeeper was playing" },
  { abbr: "SV%", name: "Save Percentage", desc: "Percentage of shots on target that were saved" },
  { abbr: "CS", name: "Clean Sheets", desc: "Games where the goalkeeper conceded zero goals" },
  { abbr: "GC/G", name: "Goals Conceded per Game", desc: "Average goals conceded per game played" },
  { abbr: "──", name: "", desc: "" },
  { abbr: "TOTS", name: "Best VII", desc: "The best 7 players of the season based on a composite score: goals per game (×4), assists per game (×2.5), shots on target per game (×0.5), key passes per game (×0.5), tackles per game (×1), interceptions per game (×1), win rate (×2). The goalkeeper is picked separately by best save percentage." },
  { abbr: "TOTW", name: "Team of the Week", desc: "The best 7 players from a single game using the same scoring formula applied to that game only. Shown as 🏅 ×N on player profiles and cards." },
  { abbr: "Rating", name: "Player Rating", desc: "A 0–10 rating shown on the Best VII and Team of the Week pitch graphic. Scores are calculated using the composite formula then curved using a square root scale. For Best VII ratings are based on season-long per-game averages. For Team of the Week they reflect that single game only." },
];

interface Props {
  games: Game[];
}

export default function InfoBar({ games }: Props) {
  const [showGuide, setShowGuide] = useState(false);

  const lastUpdated =
    games.length > 0
      ? new Date(
        Math.max(...games.map((g) => new Date(g.date).getTime())),
      ).toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
      : "—";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-gray-600 dark:text-[#9CA3AF] text-xs">Last updated {lastUpdated}</p>
        <Link
          to="/changelog"
          className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] text-xs transition-colors"
        >
          Changelog
        </Link>
      </div>

      <div className="bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden">
        <button
          onClick={() => setShowGuide((prev) => !prev)}
          className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-[#F5F4F2] dark:hover:bg-[#1a1e21]/60 transition-colors text-left"
        >
          <span className="text-gray-600 dark:text-[#9CA3AF] text-sm font-medium">
            How stats are tracked
          </span>
          <span className="text-gray-600 dark:text-[#9CA3AF] text-sm">{showGuide ? "▲" : "▼"}</span>
        </button>
        {showGuide && (
          <div className="border-t border-[#D4D3D0] dark:border-[#2a2e31] px-5 py-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {STAT_GUIDE.map(({ abbr, name, desc }) => {
              if (abbr === "──") {
                return (
                  <div
                    key={abbr + name}
                    className="col-span-1 sm:col-span-2 border-t border-[#D4D3D0] dark:border-[#2a2e31] pt-1"
                  />
                );
              }
              return (
                <div key={abbr} className="space-y-0.5">
                  <p className="text-[#1C1C1C] dark:text-[#E5E6E3] text-sm font-semibold">
                    {abbr}{" "}
                    <span className="text-gray-600 dark:text-[#9CA3AF] font-normal">— {name}</span>
                  </p>
                  <p className="text-gray-600 dark:text-[#9CA3AF] text-xs">{desc}</p>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}