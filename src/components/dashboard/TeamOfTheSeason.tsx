import { useMemo } from "react";
import type { PlayerStats, GoalkeeperStats } from "../../types";
import { calculateTeamOfTheSeason } from "../../utils/stats";

interface Props {
  stats: PlayerStats[];
  goalkeeperStats: GoalkeeperStats[];
}

function PlayerPin({ name }: { name: string }) {
  return (
    <div className="flex flex-col items-center gap-1.5">
      <div className="w-6 h-6 rounded-full bg-white/20 border-2 border-white flex items-center justify-center">
        <div className="w-3.5 h-3.5 rounded-full bg-white" />
      </div>
      <span className="text-white text-xs font-semibold text-center leading-tight max-w-[72px] drop-shadow">
        {name}
      </span>
    </div>
  );
}

function Row({ players }: { players: string[] }) {
  return (
    <div className="flex justify-around w-full">
      {players.map((name) => (
        <PlayerPin key={name} name={name} />
      ))}
    </div>
  );
}

export default function TeamOfTheSeason({ stats, goalkeeperStats }: Props) {
  const team = useMemo(
    () => calculateTeamOfTheSeason(stats, goalkeeperStats),
    [stats, goalkeeperStats],
  );

  if (!team.goalkeeper && team.outfield.length === 0) return null;

  const [forward, ...rest] = team.outfield;
  const mids = rest.slice(0, 2);
  const defenders = rest.slice(2, 5);

  return (
    <div className="space-y-3  ">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-500">
        Best VII
      </h2>
      <div
        className="relative w-full rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(to bottom, #166534, #15803d, #16a34a)",
          paddingBottom: "min(110%, 500px)",
        }}
      >
        {/* Pitch markings */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 400 280"
          preserveAspectRatio="xMidYMid slice"
          style={{ transform: "scaleY(-1)" }}
        >
          {/* Outer border */}
          <rect
            x="10"
            y="10"
            width="380"
            height="260"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Centre circle */}
          <circle
            cx="200"
            cy="280"
            r="50"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Penalty arc */}
          <path
            d="M 155 10 A 50 50 0 0 1 245 10"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Penalty box */}
          <rect
            x="110"
            y="10"
            width="180"
            height="60"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Six yard box */}
          <rect
            x="155"
            y="10"
            width="90"
            height="25"
            fill="none"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Halfway line */}
          <line
            x1="10"
            y1="280"
            x2="390"
            y2="280"
            stroke="rgba(255,255,255,0.3)"
            strokeWidth="1.5"
          />
          {/* Penalty spot */}
          <circle cx="200" cy="55" r="2.5" fill="rgba(255,255,255,0.4)" />
        </svg>

        {/* Players */}
        <div className="absolute inset-0 flex flex-col justify-between py-8 px-4">
          {/* Forward */}
          <div className="flex justify-around w-full mt-2">
            {forward && <PlayerPin name={forward.player.name} />}
          </div>

          {/* Midfielders */}
          <Row players={mids.map((p) => p.player.name)} />

          {/* Defenders */}
          <Row players={defenders.map((p) => p.player.name)} />

          {/* Goalkeeper */}
          <div className="flex justify-around w-full mb-2">
            {team.goalkeeper && (
              <PlayerPin name={team.goalkeeper.player.name} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
