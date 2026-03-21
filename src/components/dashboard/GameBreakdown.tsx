import { useState } from "react";
import type { GameSummary, GoalEntry, TeamStats } from "../../utils/stats";

interface Props {
  summaries: GameSummary[];
}

function GoalList({
  goals,
  align,
}: {
  goals: GoalEntry[];
  align: "left" | "right";
}) {
  if (goals.length === 0) return null;

  return (
    <div
      className={`space-y-3 ${align === "right" ? "text-right" : "text-left"}`}
    >
      {goals.map((g, i) => (
        <div key={i}>
          <span className="text-white text-sm font-medium">
            ⚽ {g.scorer.is_guest ? "Guest" : g.scorer.name}
            {g.team_override !== null && (
              <span
                className="text-gray-500 text-xs ml-1.5"
                title="Scored after switching teams"
              >
                ↔
              </span>
            )}
          </span>
          {g.assister && (
            <p
              className={`text-gray-500 text-xs ${align === "right" ? "text-right" : "text-left"}`}
            >
              assist: {g.assister.is_guest ? "Guest" : g.assister.name}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}

function StatBar({
  label,
  team1Value,
  team2Value,
  suffix = "",
}: {
  label: string;
  team1Value: number;
  team2Value: number;
  suffix?: string;
}) {
  const max = Math.max(team1Value, team2Value, 1);
  const t1Width = Math.round((team1Value / max) * 100);
  const t2Width = Math.round((team2Value / max) * 100);
  const t1Wins = team1Value > team2Value;
  const t2Wins = team2Value > team1Value;

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-xs">
        <span className={t1Wins ? "text-white font-semibold" : "text-gray-400"}>
          {team1Value}
          {suffix}
        </span>
        <span className="text-gray-600">{label}</span>
        <span className={t2Wins ? "text-white font-semibold" : "text-gray-400"}>
          {team2Value}
          {suffix}
        </span>
      </div>
      <div className="flex items-center gap-1 h-1">
        <div className="flex-1 flex justify-end">
          <div
            className={`h-full rounded-full transition-all ${t1Wins ? "bg-blue-500" : "bg-gray-700"}`}
            style={{ width: `${t1Width}%` }}
          />
        </div>
        <div className="w-px h-2 bg-gray-800" />
        <div className="flex-1">
          <div
            className={`h-full rounded-full transition-all ${t2Wins ? "bg-orange-500" : "bg-gray-700"}`}
            style={{ width: `${t2Width}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function TeamStatsPanel({
  team1Stats,
  team2Stats,
}: {
  team1Stats: TeamStats;
  team2Stats: TeamStats;
}) {
  return (
    <div className="border-t border-gray-800 px-5 py-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 text-center">
        Team Stats
      </p>
      <StatBar
        label="Shots"
        team1Value={team1Stats.shots}
        team2Value={team2Stats.shots}
      />
      <StatBar
        label="On Target"
        team1Value={team1Stats.shotsOnTarget}
        team2Value={team2Stats.shotsOnTarget}
      />
      <StatBar
        label="Accuracy"
        team1Value={team1Stats.shotAccuracy}
        team2Value={team2Stats.shotAccuracy}
        suffix="%"
      />
      <StatBar
        label="Conversion"
        team1Value={team1Stats.shotConversion}
        team2Value={team2Stats.shotConversion}
        suffix="%"
      />
      <StatBar
        label="Key Passes"
        team1Value={team1Stats.keyPasses}
        team2Value={team2Stats.keyPasses}
      />
      <StatBar
        label="Tackles"
        team1Value={team1Stats.tackles}
        team2Value={team2Stats.tackles}
      />
      <StatBar
        label="Interceptions"
        team1Value={team1Stats.interceptions}
        team2Value={team2Stats.interceptions}
      />
    </div>
  );
}

export default function GameBreakdown({ summaries }: Props) {
  const [index, setIndex] = useState(0);

  if (summaries.length === 0) return null;

  const current = summaries[index];
  const team1Score = current.team1Goals.length;
  const team2Score = current.team2Goals.length;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Game Breakdown
      </h2>

      <div className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden">
        {/* Navigation header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-800">
          <button
            onClick={() => setIndex((i) => i + 1)}
            disabled={index >= summaries.length - 1}
            className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            ← Older
          </button>

          <div className="text-center space-y-1">
            <p className="text-gray-400 text-sm">
              {new Date(current.game.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center justify-center gap-2">
              <span className="text-gray-600 text-xs">
                Game {summaries.length - index} of {summaries.length}
              </span>
              {index > 0 && (
                <button
                  onClick={() => setIndex(0)}
                  className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
                >
                  Latest →
                </button>
              )}
            </div>
          </div>

          <button
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            className="text-gray-500 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Newer →
          </button>
        </div>

        {/* Score */}
        <div className="grid grid-cols-3 items-center px-6 py-5 border-b border-gray-800">
          <p className="text-white font-semibold text-sm">Non Bibs</p>
          <div className="flex items-center justify-center gap-3">
            <span
              className={`text-3xl font-black tabular-nums ${
                team1Score > team2Score ? "text-white" : "text-gray-600"
              }`}
            >
              {team1Score}
            </span>
            <span className="text-gray-700 text-xl">:</span>
            <span
              className={`text-3xl font-black tabular-nums ${
                team2Score > team1Score ? "text-white" : "text-gray-600"
              }`}
            >
              {team2Score}
            </span>
          </div>
          <p className="text-orange-400 font-semibold text-sm text-right">
            🟠 Bibs
          </p>
        </div>

        {/* Goal lists */}
        <div className="grid grid-cols-2 gap-4 px-6 py-5">
          <GoalList goals={current.team1Goals} align="left" />
          <GoalList goals={current.team2Goals} align="right" />
        </div>

        {/* Team stats collapsible */}
        <TeamStatsPanel
          team1Stats={current.team1Stats}
          team2Stats={current.team2Stats}
        />

        {/* Dot pagination */}
        <div className="grid grid-cols-3 items-center px-5 pb-4">
          <div />
          <div className="flex items-center justify-center gap-1.5">
            {[...summaries].reverse().map((_, i) => {
              const reversedIndex = summaries.length - 1 - i;
              return (
                <button
                  key={i}
                  onClick={() => setIndex(reversedIndex)}
                  className={`rounded-full transition-all ${
                    reversedIndex === index
                      ? "bg-blue-500 w-4 h-1.5"
                      : "bg-gray-700 hover:bg-gray-600 w-1.5 h-1.5"
                  }`}
                />
              );
            })}
          </div>
          <div />
        </div>
      </div>
    </div>
  );
}
