import { useMemo, useState } from "react";
import type {
  PlayerStats,
  GoalkeeperStats,
  Event,
  Game,
  GamePlayer,
  Player,
} from "../../types";
import {
  calculateTeamOfTheSeason,
  calculateTeamOfTheWeek,
  type TeamOfTheSeasonPlayer,
} from "../../utils/stats";

interface Props {
  stats: PlayerStats[];
  goalkeeperStats: GoalkeeperStats[];
  players: Player[];
  events: Event[];
  games: Game[];
  gamePlayers: GamePlayer[];
}

type Mode = "alltime" | "thisweek" | "history";

function PlayerPin({
  name,
  rating,
  isKeeper = false,
  empty = false,
}: {
  name?: string;
  rating?: number;
  isKeeper?: boolean;
  empty?: boolean;
}) {
  if (empty) {
    return (
      <div className="flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-full border-2 border-dashed border-white/30 flex items-center justify-center">
          <span className="text-white/30 text-xs">?</span>
        </div>
        <span className="text-white/30 text-xs font-medium">No GK</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-0.5">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${isKeeper
          ? "bg-yellow-500/20 border-yellow-400"
          : "bg-white/20 border-white"
          }`}
      >
        <div
          className={`w-2.5 h-2.5 rounded-full ${isKeeper ? "bg-yellow-400" : "bg-white"}`}
        />
      </div>
      <span
        className={`text-xs font-medium text-center leading-tight max-w-[64px] drop-shadow ${isKeeper ? "text-yellow-300" : "text-white"
          }`}
      >
        {name}
      </span>
      {rating !== undefined && (
        <span className="text-[10px] font-bold drop-shadow text-white/70">
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}

function Row({
  players,
  getRating,
}: {
  players: TeamOfTheSeasonPlayer[];
  getRating: (score: number) => number;
}) {
  return (
    <div className="flex justify-around w-full">
      {players.map((p, i) => (
        <PlayerPin key={i} name={p.player.name} rating={getRating(p.score)} />
      ))}
    </div>
  );
}

export default function TeamOfTheSeason({
  stats,
  goalkeeperStats,
  players,
  events,
  games,
  gamePlayers,
}: Props) {
  const [mode, setMode] = useState<Mode>("alltime");
  const [selectedGameId, setSelectedGameId] = useState<string>("");

  const sortedGames = useMemo(
    () =>
      [...games].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    [games],
  );

  const mostRecentGame = sortedGames[0];

  const allTimeTeam = useMemo(() => {
    if (!stats.length) return null;
    const hasData = stats.some(s => s.goals > 0 || s.tackles > 0)
    if (!hasData) return null
    return calculateTeamOfTheSeason(stats, goalkeeperStats);
  }, [stats, goalkeeperStats]);

  const thisWeekTeam = useMemo(() => {
    if (!mostRecentGame) return null;
    return calculateTeamOfTheWeek(
      mostRecentGame.id,
      players,
      events,
      gamePlayers,
    );
  }, [mostRecentGame, players, events, gamePlayers]);

  const historyTeam = useMemo(() => {
    const gameId = selectedGameId || sortedGames[1]?.id;
    if (!gameId) return null;
    return calculateTeamOfTheWeek(gameId, players, events, gamePlayers);
  }, [selectedGameId, sortedGames, players, events, gamePlayers]);

  const activeTeam =
    mode === "alltime"
      ? allTimeTeam
      : mode === "thisweek"
        ? thisWeekTeam
        : historyTeam;

  if (!activeTeam) return null;

  const [forward, ...rest] = activeTeam.outfield;
  const mids = rest.slice(0, 2);
  const defenders = rest.slice(2, 5);

  const TOTS_CAP = 40
  const TOTW_CAP = 50

  const getRating = (score: number) => {
    const cap = mode === 'alltime' ? TOTS_CAP : TOTW_CAP
    const normalised = Math.min(score / cap, 1)
    const curved = Math.sqrt(normalised)
    return Math.min(10, Math.round(curved * 10 * 10) / 10)
  }

  return (
    <div className="space-y-3">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        {mode === "alltime" ? "Best VII" : "Team of the Week"}
      </h2>

      {/* Toggle */}
      <div className="flex rounded-lg overflow-hidden border border-gray-800">
        {(["alltime", "thisweek", "history"] as Mode[]).map((m, i) => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${i < 2 ? "border-r border-gray-800" : ""
              } ${mode === m
                ? "bg-mvf text-white"
                : "bg-gray-900 text-gray-500 hover:text-gray-300"
              }`}
          >
            {m === "alltime"
              ? "All time"
              : m === "thisweek"
                ? "This week"
                : "History"}
          </button>
        ))}
      </div>

      {/* History dropdown */}
      {mode === "history" && (
        <select
          value={selectedGameId || sortedGames[1]?.id || ""}
          onChange={(e) => setSelectedGameId(e.target.value)}
          className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-2.5 text-white text-sm outline-none focus:border-gray-600 transition-colors"
        >
          {sortedGames.slice(1).map((game) => (
            <option key={game.id} value={game.id}>
              {new Date(game.date).toLocaleDateString("en-GB", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </option>
          ))}
        </select>
      )}

      {/* Pitch */}
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #166534, #15803d, #16a34a)",
          paddingBottom: "min(110%, 500px)",
        }}
      >
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 280"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: "scaleY(-1)" }}
        >
          <rect
            x="10"
            y="10"
            width="380"
            height="260"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <circle
            cx="200"
            cy="280"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <path
            d="M 155 10 A 50 50 0 0 1 245 10"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <rect
            x="110"
            y="10"
            width="180"
            height="60"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <rect
            x="155"
            y="10"
            width="90"
            height="25"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <line
            x1="10"
            y1="280"
            x2="390"
            y2="280"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          <circle cx="200" cy="55" r="2.5" fill="rgba(255,255,255,0.4)" />
        </svg>

        <div className="absolute inset-0 flex flex-col justify-between py-6 px-4">
          <div className="flex justify-around w-full mt-2">
            {forward && (
              <PlayerPin
                name={forward.player.name}
                rating={getRating(forward.score)}
              />
            )}
          </div>
          <Row players={mids} getRating={getRating} />
          <Row players={defenders} getRating={getRating} />
          <div className="flex justify-around w-full mb-2">
            {activeTeam.goalkeeper ? (
              <PlayerPin
                name={activeTeam.goalkeeper.player.name}
                isKeeper
              />
            ) : (
              <PlayerPin empty />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}