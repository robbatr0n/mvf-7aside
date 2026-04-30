import { useState } from "react";
import { Link } from "react-router-dom";
import type { GameSummary, GoalEntry, TeamStats } from "../../utils/stats";
import type { Event, Player } from "../../types";

interface Props {
  summaries: GameSummary[];
  events: Event[];
}

// ── Rating helpers ────────────────────────────────────────────────────────────

const TOTW_CAP = 65;

function toRating(score: number): number {
  const normalised = Math.min(score / TOTW_CAP, 1);
  const curved = Math.sqrt(normalised);
  return Math.min(10, Math.round(curved * 10 * 10) / 10);
}

// ── Sub-components ────────────────────────────────────────────────────────────

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
          <span className="text-[#1C1C1C] dark:text-[#E5E6E3] text-sm font-medium">
            ⚽{" "}
            {g.scorer.is_guest ? (
              "Guest"
            ) : (
              <Link
                to={`/player/${g.scorer.id}`}
                className="hover:text-mvf transition-colors"
              >
                {g.scorer.name}
              </Link>
            )}
            {g.team_override !== null && (
              <span
                className="text-gray-600 dark:text-[#9CA3AF] text-xs ml-1.5"
                title="Scored after switching teams"
              >
                (OG)
              </span>
            )}
          </span>
          {g.assister && (
            <p
              className={`text-gray-600 dark:text-[#9CA3AF] text-xs ${align === "right" ? "text-right" : "text-left"}`}
            >
              assist:{" "}
              {g.assister.is_guest ? (
                "Guest"
              ) : (
                <Link
                  to={`/player/${g.assister.id}`}
                  className="hover:text-mvf transition-colors"
                >
                  {g.assister.name}
                </Link>
              )}
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
        <span className={t1Wins ? "text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold" : "text-gray-600 dark:text-[#9CA3AF]"}>
          {team1Value}{suffix}
        </span>
        <span className="text-gray-600 dark:text-[#9CA3AF]">{label}</span>
        <span className={t2Wins ? "text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold" : "text-gray-600 dark:text-[#9CA3AF]"}>
          {team2Value}{suffix}
        </span>
      </div>
      <div className="flex items-center gap-1 h-1">
        <div className="flex-1 flex justify-end">
          <div
            className={`h-full rounded-full transition-all ${t1Wins ? "bg-mvf" : "bg-gray-200 dark:bg-gray-700"}`}
            style={{ width: `${t1Width}%` }}
          />
        </div>
        <div className="w-px h-2 bg-gray-200 dark:bg-[#1a1e21]" />
        <div className="flex-1">
          <div
            className={`h-full rounded-full transition-all ${t2Wins ? "bg-orange-500" : "bg-gray-200 dark:bg-gray-700"}`}
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
    <div className="border-t border-[#D4D3D0] dark:border-[#2a2e31] px-5 py-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF] text-center">
        Team Stats
      </p>
      <StatBar label="Shots" team1Value={team1Stats.shots} team2Value={team2Stats.shots} />
      <StatBar label="On Target" team1Value={team1Stats.shotsOnTarget} team2Value={team2Stats.shotsOnTarget} />
      <StatBar label="Accuracy" team1Value={team1Stats.shotAccuracy} team2Value={team2Stats.shotAccuracy} suffix="%" />
      <StatBar label="Conversion" team1Value={team1Stats.shotConversion} team2Value={team2Stats.shotConversion} suffix="%" />
      <StatBar label="Key Passes" team1Value={team1Stats.keyPasses} team2Value={team2Stats.keyPasses} />
      <StatBar label="Tackles" team1Value={team1Stats.tackles} team2Value={team2Stats.tackles} />
      <StatBar label="Interceptions" team1Value={team1Stats.interceptions} team2Value={team2Stats.interceptions} />
      <StatBar label="Passes" team1Value={team1Stats.passesCompleted} team2Value={team2Stats.passesCompleted} />
      <StatBar label="Pass Acc" team1Value={team1Stats.passAccuracy} team2Value={team2Stats.passAccuracy} suffix="%" />
    </div>
  );
}

function PlayerRatingsPanel({
  gameId,
  team1Players,
  team2Players,
  events,
}: {
  gameId: string;
  team1Players: Player[];
  team2Players: Player[];
  events: Event[];
}) {
  const gameEvents = events.filter((e) => e.game_id === gameId);

  function score(player: Player) {
    const pe = gameEvents.filter((e) => e.player_id === player.id);
    const goals = pe.filter((e) => e.event_type === "goal").length;
    const assists = pe.filter((e) => e.event_type === "assist").length;
    const sot = pe.filter((e) => e.event_type === "shot_on_target").length;
    const kp = pe.filter((e) => e.event_type === "key_pass").length;
    const tackles = pe.filter((e) => e.event_type === "tackle").length;
    const interceptions = pe.filter((e) => e.event_type === "interception").length;
    const passCompleted = pe.filter((e) => e.event_type === "pass_completed").length;
    const hasPassingEvents = pe.some(
      (e) => e.event_type === "pass_completed" || e.event_type === "pass_received" || e.event_type === "pass_failed"
    );
    return goals * 4 + assists * 2.5 + sot * 0.5 + kp * 0.5 + tackles + interceptions + (hasPassingEvents ? passCompleted * 0.2 : 0);
  }

  const allPlayers = [
    ...team1Players.map((p) => ({ player: p, team: 1 as const })),
    ...team2Players.map((p) => ({ player: p, team: 2 as const })),
  ];

  const outfield = allPlayers
    .filter(({ player }) => !player.is_goalkeeper)
    .map(({ player, team }) => ({ player, team, s: score(player), rating: toRating(score(player)) }))
    .sort((a, b) => b.s - a.s);

  const keepers = allPlayers
    .filter(({ player }) => player.is_goalkeeper)
    .map(({ player, team }) => ({ player, team, s: 0, rating: 0 }));

  const ranked = [...outfield, ...keepers];

  if (ranked.length === 0) return null;

  return (
    <div className="border-t border-[#D4D3D0] dark:border-[#2a2e31] px-5 py-5 space-y-3">
      <p className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF] text-center">
        Player Ratings
      </p>
      <div className="space-y-1.5">
        {ranked.map(({ player, team, rating }) => (
          <div key={player.id} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <span
                className={`w-2 h-2 rounded-full shrink-0 ${team === 1 ? "bg-[#1C1C1C] dark:bg-[#E5E6E3]" : "bg-orange-500"}`}
              />
              {player.is_guest || player.is_goalkeeper ? (
                <span className={`text-sm font-medium truncate ${player.is_goalkeeper ? "text-[#d4a017]" : "text-[#1C1C1C] dark:text-[#E5E6E3]"}`}>
                  {player.is_guest ? "Guest" : player.name}
                </span>
              ) : (
                <Link
                  to={`/player/${player.id}`}
                  className="text-sm font-medium truncate text-[#1C1C1C] dark:text-[#E5E6E3] hover:text-mvf transition-colors"
                >
                  {player.name}
                </Link>
              )}
            </div>
            {player.is_goalkeeper ? (
              <span className="text-[#d4a017] text-sm shrink-0">GK</span>
            ) : (
              <span className="text-gray-600 dark:text-[#9CA3AF] text-sm tabular-nums shrink-0">
                {rating.toFixed(1)}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function GameBreakdown({ summaries, events }: Props) {
  const [index, setIndex] = useState(0);

  if (summaries.length === 0) return null;

  const current = summaries[index];
  const isInProgress = index === 0 && current.game.winning_team === null && current.game.winning_team !== 0;
  const team1Score = current.team1Goals.length;
  const team2Score = current.team2Goals.length;

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 dark:text-[#9CA3AF]">
        Game Breakdown
      </h2>

      <div className={`bg-[#FFFFFF] dark:bg-[#111518] border border-[#D4D3D0] dark:border-[#2a2e31] rounded-2xl overflow-hidden ${isInProgress ? "border-t-2 border-t-mvf" : ""}`}>
        {/* Navigation header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-[#D4D3D0] dark:border-[#2a2e31]">
          <button
            onClick={() => setIndex((i) => i + 1)}
            disabled={index >= summaries.length - 1}
            className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            ← Older
          </button>

          <div className="text-center space-y-1">
            <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">
              {new Date(current.game.date).toLocaleDateString("en-GB", {
                weekday: "long",
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
            <div className="flex items-center justify-center gap-2">
              {isInProgress ? (
                <span className="inline-flex items-center gap-1.5 bg-mvf/10 border border-mvf/30 text-mvf text-xs font-medium px-2.5 py-1 rounded-full">
                  ⏱ In Progress
                </span>
              ) : (
                <>
                  <span className="text-gray-600 dark:text-[#9CA3AF] text-xs">
                    Game {summaries.length - index} of {summaries.length}
                  </span>
                  {index > 0 && (
                    <button
                      onClick={() => setIndex(0)}
                      className="text-xs text-mvf hover:text-mvf-dark transition-colors"
                    >
                      Latest →
                    </button>
                  )}
                </>
              )}
            </div>
          </div>

          <button
            onClick={() => setIndex((i) => i - 1)}
            disabled={index === 0}
            className="text-gray-600 dark:text-[#9CA3AF] hover:text-[#1C1C1C] dark:hover:text-[#E5E6E3] disabled:opacity-30 disabled:cursor-not-allowed transition-colors text-sm"
          >
            Newer →
          </button>
        </div>

        {/* Score */}
        <div className="grid grid-cols-3 items-center px-6 py-5 border-b border-[#D4D3D0] dark:border-[#2a2e31]">
          <p className="text-[#1C1C1C] dark:text-[#E5E6E3] font-semibold text-sm">Non Bibs</p>
          <div className="flex items-center justify-center gap-3">
            <span className={`text-3xl font-black tabular-nums ${team1Score > team2Score ? "text-[#1C1C1C] dark:text-[#E5E6E3]" : "text-gray-300 dark:text-[#737373]"}`}>
              {team1Score}
            </span>
            <span className="text-gray-300 dark:text-gray-700 text-xl">:</span>
            <span className={`text-3xl font-black tabular-nums ${team2Score > team1Score ? "text-[#1C1C1C] dark:text-[#E5E6E3]" : "text-gray-300 dark:text-[#737373]"}`}>
              {team2Score}
            </span>
          </div>
          <p className="text-orange-500 font-semibold text-sm text-right">🟠 Bibs</p>
        </div>

        {/* Man of the Match */}
        {current.motm && (
          <div className="px-5 py-2.5 border-b border-[#D4D3D0] dark:border-[#2a2e31] flex items-center gap-2">
            <span className="text-sm">🏆</span>
            <span className="text-xs text-gray-600 dark:text-[#9CA3AF] font-semibold uppercase tracking-widest">Man of the Match</span>
            <span className="text-sm font-semibold text-[#1C1C1C] dark:text-[#E5E6E3]">{current.motm.name}</span>
          </div>
        )}

        {/* Goal lists or in progress message */}
        {isInProgress && team1Score === 0 && team2Score === 0 ? (
          <div className="px-6 py-5">
            <p className="text-gray-600 dark:text-[#9CA3AF] text-sm">
              No goals tagged yet — check back soon for the full breakdown.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 px-6 py-5">
            <GoalList goals={current.team1Goals} align="left" />
            <GoalList goals={current.team2Goals} align="right" />
          </div>
        )}

        {/* Player ratings */}
        <PlayerRatingsPanel
          gameId={current.game.id}
          team1Players={current.team1Players}
          team2Players={current.team2Players}
          events={events}
        />

        {/* Team stats */}
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
                  className="p-2 flex items-center justify-center"
                >
                  <span
                    className={`block rounded-full transition-all ${reversedIndex === index
                      ? "bg-mvf w-4 h-1.5"
                      : "bg-gray-200 dark:bg-gray-700 w-1.5 h-1.5"
                      }`}
                  />
                </button>
              );
            })}
          </div>
          <div />
        </div>
      </div>
    </div>
  );
}
